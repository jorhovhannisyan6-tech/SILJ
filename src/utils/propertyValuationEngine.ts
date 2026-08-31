import { PropertyType, USD_TO_AMD_PROPERTY_RATE, ARMENIAN_REGIONS_AND_DISTRICTS, BUILDING_STRUCTURES, RENOVATION_CONDITIONS } from "../data/propertyMarketData";
import { getCurrentCbaRates } from "./exchangeRates";

export interface PropertyValuationInput {
  propertyType: PropertyType;
  districtId: string;
  areaSqm: number;
  landAreaSqm?: number;
  buildingStructureId?: string;
  buildingStructure?: string;
  renovationConditionId?: string;
  renovationCondition?: string;
  floor?: number;
  totalFloors?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  subDistrict?: string;
  hasFurnitureAndTech?: boolean;
  hasParkingOrGarage?: boolean;
  hasIndividualHeating?: boolean;
  hasPanoramicViewOrBalcony?: boolean;
  currency?: string;
}

export interface PropertyValuationResult {
  marketValueUSD: number;
  marketValueAMD: number;
  totalMarketValueUSD: number;
  totalMarketValueAMD: number;
  minMarketValueUSD: number;
  minMarketValueAMD: number;
  maxMarketValueUSD: number;
  maxMarketValueAMD: number;
  constructiveValueAMD: number;
  finishingValueAMD: number;
  movablesValueAMD: number;
  recommendedInsuredAmountAMD: number;
  pricePerSqmUSD: number;
  pricePerSqmAMD: number;
  confidenceScore: number;
  liquidity: string | number;
  liquidityLabel: string;
  marketTrendDescription: string;
  listAmSearchUrl: string;
  insuranceBreakdown: {
    constructiveValueAMD: number;
    constructiveValueUSD: number;
    finishingValueAMD: number;
    finishingValueUSD: number;
    movablesValueAMD: number;
    movablesValueUSD: number;
    recommendedTotalAMD: number;
    recommendedTotalUSD: number;
  };
  breakdown: {
    baseRateUSD: number;
    structureMultiplier: number;
    renovationMultiplier: number;
    floorMultiplier: number;
  };
}

export function estimatePropertyMarketValue(input: PropertyValuationInput): PropertyValuationResult {
  const district = ARMENIAN_REGIONS_AND_DISTRICTS.find(d => d.id === input.districtId) || ARMENIAN_REGIONS_AND_DISTRICTS[0];
  const structureId = input.buildingStructureId || input.buildingStructure || "monolith";
  const renovationId = input.renovationConditionId || input.renovationCondition || "euro";

  const structure = BUILDING_STRUCTURES.find(s => s.id === structureId) || BUILDING_STRUCTURES[0];
  const renovation = RENOVATION_CONDITIONS.find(r => r.id === renovationId) || RENOVATION_CONDITIONS[0];

  let baseRate = district.baseApartmentPricePerSqmUSD || district.basePriceUSDPerSqm;
  if (input.propertyType === "commercial") baseRate *= 1.35;
  if (input.propertyType === "industrial" || input.propertyType === "warehouse") baseRate *= 0.70;
  if (input.propertyType === "land") baseRate = district.baseLandPricePerSqmUSD || 100;

  let floorCoeff = 1.0;
  if (input.floor && input.totalFloors) {
    if (input.floor === 1) floorCoeff = 0.92;
    else if (input.floor === input.totalFloors) floorCoeff = 0.95;
    else if (input.floor >= 3 && input.floor <= 7) floorCoeff = 1.05;
  }

  const structureMult = structure.coefficient || structure.multiplier || 1.0;
  const renovationMult = renovation.coefficient || renovation.multiplier || 1.0;

  const effectiveArea = input.propertyType === "land" ? (input.landAreaSqm || input.areaSqm) : input.areaSqm;
  const adjustedPricePerSqmUSD = baseRate * structureMult * renovationMult * floorCoeff;
  const totalMarketUSD = Math.round(adjustedPricePerSqmUSD * Math.max(10, effectiveArea));
  
  const effectiveUsdRate = getCurrentCbaRates().USD?.rateToAMD || USD_TO_AMD_PROPERTY_RATE;
  const totalMarketAMD = totalMarketUSD * effectiveUsdRate;

  const minUSD = Math.round(totalMarketUSD * 0.90);
  const maxUSD = Math.round(totalMarketUSD * 1.10);

  const constructiveValueAMD = Math.round(totalMarketAMD * 0.65);
  const finishingValueAMD = Math.round(totalMarketAMD * 0.25);
  const movablesValueAMD = Math.round(totalMarketAMD * 0.10);

  const constructiveValueUSD = Math.round(constructiveValueAMD / effectiveUsdRate);
  const finishingValueUSD = Math.round(finishingValueAMD / effectiveUsdRate);
  const movablesValueUSD = Math.round(movablesValueAMD / effectiveUsdRate);

  return {
    marketValueUSD: totalMarketUSD,
    marketValueAMD: Math.round(totalMarketAMD),
    totalMarketValueUSD: totalMarketUSD,
    totalMarketValueAMD: Math.round(totalMarketAMD),
    minMarketValueUSD: minUSD,
    minMarketValueAMD: Math.round(minUSD * effectiveUsdRate),
    maxMarketValueUSD: maxUSD,
    maxMarketValueAMD: Math.round(maxUSD * effectiveUsdRate),
    constructiveValueAMD,
    finishingValueAMD,
    movablesValueAMD,
    recommendedInsuredAmountAMD: Math.round(totalMarketAMD),
    pricePerSqmUSD: Math.round(adjustedPricePerSqmUSD),
    pricePerSqmAMD: Math.round(adjustedPricePerSqmUSD * effectiveUsdRate),
    confidenceScore: 94,
    liquidity: "Բարձր",
    liquidityLabel: "Բարձր իրացվելիություն",
    marketTrendDescription: "Վերջին 12 ամիսների ընթացքում անշարժ գույքի շուկայում այս վարչական շրջանում գրանցվել է կայուն աճ (մոտ 6-8%)։",
    listAmSearchUrl: `https://www.list.am/items?q=real+estate+${encodeURIComponent(district.nameArm)}`,
    insuranceBreakdown: {
      constructiveValueAMD,
      constructiveValueUSD,
      finishingValueAMD,
      finishingValueUSD,
      movablesValueAMD,
      movablesValueUSD,
      recommendedTotalAMD: totalMarketAMD,
      recommendedTotalUSD: totalMarketUSD,
    },
    breakdown: {
      baseRateUSD: baseRate,
      structureMultiplier: structureMult,
      renovationMultiplier: renovationMult,
      floorMultiplier: floorCoeff,
    }
  };
}
