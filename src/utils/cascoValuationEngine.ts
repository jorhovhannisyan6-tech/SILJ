import { POPULAR_ARMENIAN_CAR_BRANDS, USD_TO_AMD_CAR_RATE, CarModelData } from "../data/carMarketData";
import { getCurrentCbaRates } from "./exchangeRates";

export interface VehicleValuationInput {
  make: string;
  model: string;
  manufactureYear: number;
  condition?: "excellent" | "good" | "fair" | "salvage";
  fuelType?: "gasoline" | "diesel" | "hybrid" | "electric" | "gas_lpg";
  transmission?: "automatic" | "manual";
  mileageKm?: number;
  isCustomsCleared?: boolean;
  usdToAmdRate?: number;
}

export interface VehicleValuationResult {
  estimatedPriceUSD: number;
  estimatedPriceAMD: number;
  minPriceUSD: number;
  minPriceAMD: number;
  maxPriceUSD: number;
  maxPriceAMD: number;
  listAmSearchUrl: string;
  liquidity: "Բարձր" | "Միջին" | "Ցածր";
  marketTrendDescription: string;
  depreciationAgeYears: number;
  confidenceScore: number;
}

export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric" | "gas_lpg";

export function inferFuelTypeFromModel(make: string = "", model: string = ""): FuelType {
  const full = `${make || ""} ${model || ""}`.toLowerCase().trim();

  // Electric checks
  if (
    /tesla|leaf|taycan|ix|id\.3|id\.4|id\.6|e-tron|eqs|eqe|eqc|eqb|eqa|bz4x|solterra|ev6|ioniq|lucid|rivian|byd.*ev|yuan.*plus|han.*ev|song.*ev|atto|neta|zeekr|nio|polestar|e-golf|i3|i4|i7|ex30|ex90|smart #1/i.test(
      full
    ) ||
    /\b(ev|electric)\b/i.test(full) ||
    /model 3|model y|model s|model x|song plus ev|han ev|yuan plus/i.test(full)
  ) {
    return "electric";
  }

  // Hybrid checks
  if (
    /prius|aqua|insight|clarity|ampera|volt|song.*dm|byd.*dm|hsd/i.test(full) ||
    /\b(hybrid|phev|plug-in|45e|530e|330e|e-hybrid)\b/i.test(full) ||
    /rx.*450h|es.*300h|nx.*300h|ct.*200h/i.test(full)
  ) {
    return "hybrid";
  }

  // Diesel checks
  if (
    /\b(diesel|cdi|tdi|crdi|d4d|d-4d|d5|d3|d4|d2|30d|40d|50d|220d|250d|300d|350d)\b/i.test(full) ||
    /[0-9]{3}d\b/i.test(model.toLowerCase())
  ) {
    return "diesel";
  }

  // Gas / LPG checks
  if (/\b(gas|lpg|cng|մեթան|պրոպան)\b/i.test(full)) {
    return "gas_lpg";
  }

  return "gasoline";
}

export function estimateVehicleMarketValue(input: VehicleValuationInput): VehicleValuationResult {
  const currentYear = new Date().getFullYear();
  const year = Math.max(1990, Math.min(currentYear, input.manufactureYear || 2018));
  const age = currentYear - year;

  const fullStr = `${input.make || ""} ${input.model || ""}`.toLowerCase().trim();

  // Find brand and model
  const brandObj = POPULAR_ARMENIAN_CAR_BRANDS.find(
    (b) => b.make.toLowerCase() === (input.make || "").toLowerCase().trim()
  );

  let modelData: CarModelData | undefined;
  if (brandObj && input.model) {
    modelData = brandObj.popularModels.find(
      (m) => m.name.toLowerCase().includes(input.model.toLowerCase().trim()) ||
             input.model.toLowerCase().trim().includes(m.name.toLowerCase())
    );
  }

  // Smart base price and floor determination if not explicitly listed
  let basePrice2024 = 28000;
  let deprecRate = 0.07;
  let floorLimit = 2500;
  let liquidity: "Բարձր" | "Միջին" | "Ցածր" = "Բարձր";

  if (modelData) {
    basePrice2024 = modelData.basePriceUSD2024;
    deprecRate = modelData.annualDepreciationRate;
    liquidity = modelData.liquidity;
  } else {
    // Dynamic segment heuristics
    if (/g63|g-class|g class|g 63|maybach|ferrari|lamborghini|bentley|rolls|urus|taycan|911/.test(fullStr)) {
      basePrice2024 = 140000;
      floorLimit = 15000;
      liquidity = "Միջին";
    } else if (/lx 570|lx 600|lx570|lx600|land cruiser 300|lc 300|lc300|escalade|q8|x7|gls|s-class|s class|s500|s550|s600|7 series|750|740/.test(fullStr)) {
      basePrice2024 = 115000;
      floorLimit = 10000;
      liquidity = "Բարձր";
    } else if (/prado|gx|gx460|gx550|x5|x6|gle|ml|touareg|cayenne|q7|rx350|rx450|rx 350|e-class|e class|e200|e300|e350|5 series|528|530|535|a6|model s|model x|porsche|macan/.test(fullStr)) {
      basePrice2024 = 70000;
      floorLimit = 7000;
      liquidity = "Բարձր";
    } else if (/c-class|c class|c200|c300|3 series|320|328|330|a4|q5|x3|glc|nx|model 3|model y/.test(fullStr)) {
      basePrice2024 = 48000;
      floorLimit = 5000;
      liquidity = "Բարձր";
    } else if (/rav4|tucson|sportage|santa fe|cr-v|crv|cx-5|cx5|rogue|x-trail|tiguan|highlander|palisade|sorento|equinox|id\.4|id\.6|song|subaru|forester|outback/.test(fullStr)) {
      basePrice2024 = 33000;
      floorLimit = 4000;
      liquidity = "Բարձր";
    } else if (/camry|sonata|k5|optima|passat|altima|teana|accord|malibu|mazda 6|insignia/.test(fullStr)) {
      basePrice2024 = 27000;
      floorLimit = 3500;
      liquidity = "Բարձր";
    } else if (/corolla|elantra|forte|k3|civic|cruze|focus|astra|golf|polo|accent|rio|tiida|versa|jetta|yaris|fit|vectra|zafira/.test(fullStr)) {
      basePrice2024 = 18000;
      floorLimit = 2500;
      liquidity = "Բարձր";
    } else if (/niva|granta|vesta|samara|2107|2106|vaz|lada/.test(fullStr)) {
      basePrice2024 = 10000;
      floorLimit = 1500;
      liquidity = "Բարձր";
    }
  }

  // Armenian market age depreciation curve
  const year3Dec = Math.pow(1 - deprecRate, Math.min(age, 3));
  const year10Dec = Math.pow(1 - Math.max(0.05, deprecRate - 0.01), Math.min(Math.max(age - 3, 0), 7));
  const yearOlderDec = Math.pow(1 - Math.max(0.04, deprecRate - 0.02), Math.max(age - 10, 0));

  let priceUSD = basePrice2024 * year3Dec * year10Dec * yearOlderDec;

  // Apply condition coefficient
  if (input.condition === "excellent") priceUSD *= 1.10;
  else if (input.condition === "fair") priceUSD *= 0.85;
  else if (input.condition === "salvage") priceUSD *= 0.60;

  // Fuel type adjustment
  if (input.fuelType === "electric") priceUSD *= 1.05;
  if (input.fuelType === "hybrid") priceUSD *= 1.03;

  // Mileage penalty/bonus
  const avgExpectedKm = age * 15000;
  if (input.mileageKm && input.mileageKm > 0) {
    if (input.mileageKm < avgExpectedKm * 0.7) priceUSD *= 1.05;
    else if (input.mileageKm > avgExpectedKm * 1.4) priceUSD *= 0.90;
  }

  // Floor limit so cars don't drop under market floor
  priceUSD = Math.max(floorLimit, Math.round(priceUSD / 100) * 100);

  const effectiveUsdRate = input.usdToAmdRate || getCurrentCbaRates().USD?.rateToAMD || USD_TO_AMD_CAR_RATE;
  const priceAMD = priceUSD * effectiveUsdRate;
  const minUSD = Math.round((priceUSD * 0.90) / 100) * 100;
  const maxUSD = Math.round((priceUSD * 1.10) / 100) * 100;

  // Direct List.am search query URL
  const queryStr = `${input.make || ""} ${input.model || ""} ${input.manufactureYear || ""}`.trim();
  const listAmSearchUrl = `https://www.list.am/category/23?q=${encodeURIComponent(queryStr)}`;

  return {
    estimatedPriceUSD: priceUSD,
    estimatedPriceAMD: Math.round(priceAMD),
    minPriceUSD: minUSD,
    minPriceAMD: Math.round(minUSD * effectiveUsdRate),
    maxPriceUSD: maxUSD,
    maxPriceAMD: Math.round(maxUSD * effectiveUsdRate),
    listAmSearchUrl,
    liquidity,
    marketTrendDescription: `${input.make} ${input.model} (${input.manufactureYear}թ.) մոդելը Հայաստանի ավտոշուկայում (List.am) ունի ${liquidity.toLowerCase()} պահանջարկ։`,
    depreciationAgeYears: age,
    confidenceScore: modelData ? 92 : 82,
  };
}
