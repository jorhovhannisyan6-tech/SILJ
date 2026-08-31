import {
  PropertyInsuranceFormState,
  MortgageInsuranceData,
  QuotationProposal,
  InsuranceProductType,
  CascoInsuranceData,
  HealthInsuranceData,
  TravelInsuranceData,
  CargoInsuranceData,
} from "../types";
import { SIL_PRODUCTS_CATALOG } from "../data/productsCatalog";
import { TUN_SERVICE_PACKAGES, PropertyPackageId } from "../data/tunServicePackages";
import {
  CASCO_BASE_GROSS_MAX, CASCO_BONUS_MALUS_ADJUSTMENTS, CASCO_FRANCHISE_ADJUSTMENTS,
  CASCO_PAYMENT_FACTORS, CASCO_TRAFFIC_RULE_FACTOR, CASCO_THEFT_EXCLUDE_MAX,
  CASCO_THEFT_EXCLUDE_SMALL_DETAILS_FACTOR, CASCO_REGION_FACTORS, CASCO_WARRANTY_FACTOR,
  CASCO_UNLIMITED_DRIVERS_ADJUSTMENT, CASCO_LOSS_RATIO_FACTOR, CASCO_ELECTRIC_VEHICLE_ADJUSTMENT,
  CASCO_BROKER_COMMISSION, CASCO_PROFIT, CASCO_MIN_TARIFF, CASCO_YEAR_BANDS, CascoYearBand, CascoParty
} from "../data/cascoExcelRules";

export function formatCurrency(
  amount: number,
  currency: "AMD" | "USD" | "EUR" = "AMD"
): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0 ֏";
  const formatted = Math.round(amount).toLocaleString("hy-AM");
  if (currency === "USD") return `$ ${formatted}`;
  if (currency === "EUR") return `€ ${formatted}`;
  return `${formatted} ֏`;
}

export function formatPercent(rate: number): string {
  if (isNaN(rate) || rate === null || rate === undefined) return "0.00%";
  return `${Number(rate).toFixed(2)}%`;
}

export function generateQuotationNumber(type: InsuranceProductType): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  const prefixMap: Record<InsuranceProductType, string> = {
    property: "SIL-PROP",
    mortgage: "SIL-MORT",
    casco: "SIL-CASCO",
    health: "SIL-MED",
    travel: "SIL-TRAV",
    cargo: "SIL-CARGO",
    construction: "SIL-CAR",
    liability: "SIL-LIAB",
    accident: "SIL-ACC",
    agro: "SIL-AGRO",
    financial: "SIL-FIN",
    bundle: "SIL-BUNDLE",
    aviation: "SIL-AVIATION",
  };
  const prefix = prefixMap[type] || "SIL-QUOTE";
  return `${prefix}-${year}/${month}-${random}`;
}

export function calculatePropertyQuotation(state: PropertyInsuranceFormState) {
  const { values, insuredProperty, fireProtection, security, lossHistory, coverageRisks, operations, propertyPackage } = state;
  let totalSum = 0;
  const breakdown: Array<{ item: string; value: number; tariff: number; premium: number }> = [];

  // 1. If a specific Tun Service Offer package is selected (start, standard, standard_plus, premium)
  if (propertyPackage && propertyPackage !== "custom" && TUN_SERVICE_PACKAGES[propertyPackage as PropertyPackageId]) {
    const pkg = TUN_SERVICE_PACKAGES[propertyPackage as PropertyPackageId];

    // Building
    const buildingVal = values.buildingValue > 0 ? values.buildingValue : pkg.buildingSumInsuredAMD;
    if (buildingVal > 0) {
      const tariff = pkg.buildingTariffPercent;
      const premium = (buildingVal * tariff) / 100;
      totalSum += buildingVal;
      breakdown.push({ item: "Շինություն / Կառույց (Building)", value: buildingVal, tariff, premium });
    }

    // Contents / Movables
    const contentsVal = (values.interiorValue > 0 ? values.interiorValue : 0) || (values.equipmentValue > 0 ? values.equipmentValue : 0) || pkg.contentsSumInsuredAMD;
    if (contentsVal > 0) {
      const tariff = pkg.contentsTariffPercent;
      const premium = (contentsVal * tariff) / 100;
      totalSum += contentsVal;
      breakdown.push({ item: "Շարժական գույք / Կահույք, տեխնիկա (Contents)", value: contentsVal, tariff, premium });
    }

    // Guest Damage (for Standard Plus and Premium packages or if selected)
    const guestDamageVal = values.guestDamageValue !== undefined && values.guestDamageValue > 0 
      ? values.guestDamageValue 
      : (insuredProperty.guestDamage || pkg.guestDamageSumInsuredAMD > 0 ? pkg.guestDamageSumInsuredAMD : 0);
    if (guestDamageVal > 0) {
      const tariff = pkg.guestDamageTariffPercent || 0.35;
      const premium = (guestDamageVal * tariff) / 100;
      totalSum += guestDamageVal;
      breakdown.push({ item: "Հյուրերի կողմից պատճառված վնաս (Guest Damage)", value: guestDamageVal, tariff, premium });
    }

    // Third Party Liability (Քաղաքացիական Պատասխանատվություն)
    const liabilityVal = values.thirdPartyLiabilityValue !== undefined && values.thirdPartyLiabilityValue > 0
      ? values.thirdPartyLiabilityValue
      : (coverageRisks.thirdPartyLiability || pkg.liabilitySumInsuredAMD > 0 ? pkg.liabilitySumInsuredAMD : 0);
    if (liabilityVal > 0) {
      const tariff = pkg.liabilityTariffPercent || 0.25;
      const premium = (liabilityVal * tariff) / 100;
      totalSum += liabilityVal;
      breakdown.push({ item: "Քաղ․ պատասխանատվություն 3-րդ անձանց առջև (Third Party Liability)", value: liabilityVal, tariff, premium });
    }

    const calculatedTotalPremium = breakdown.reduce((acc, curr) => acc + curr.premium, 0);
    const weightedAverageTariff = totalSum > 0 ? (calculatedTotalPremium / totalSum) * 100 : pkg.averageTariffPercent;
    const finalTariff = state.customTariff !== undefined && state.customTariff > 0 ? state.customTariff : weightedAverageTariff;
    const annualPremium = state.customTariff !== undefined && state.customTariff > 0 ? (totalSum * state.customTariff) / 100 : calculatedTotalPremium;
    const franchisePercent = state.customFranchise !== undefined ? state.customFranchise : 0.5;
    const franchiseAmount = (totalSum * franchisePercent) / 100;

    return {
      totalSum,
      totalSumInsured: totalSum,
      baseTariff: weightedAverageTariff,
      discountBonus: 0,
      finalTariff,
      annualPremium,
      franchisePercent,
      franchiseAmount,
      franchiseSummaryText: pkg.fullFranchiseSummary,
      breakdown,
      packageInfo: pkg,
    };
  }

  // 2. Custom 13-Section Comprehensive Underwriting Logic
  const baseRates = {
    building: 0.12,
    interior: 0.16,
    machinery: 0.22,
    equipment: 0.25,
    stock: 0.24,
    glass: 0.35,
    signs: 0.30,
    guestDamage: 0.35,
    thirdPartyLiability: 0.25,
  };

  let discount = 0;
  if (fireProtection.autoExtinguishing) discount += 0.04;
  if (fireProtection.alarm && fireProtection.smokeDetectors) discount += 0.03;
  if (security.cctv && security.burglarAlarm) discount += 0.03;
  if (security.guards) discount += 0.02;
  if (!lossHistory.hasLosses) discount += 0.03;

  let loading = 0;
  if (operations.isBasement) loading += 0.02;
  if (lossHistory.hasLosses) loading += 0.04;
  if (coverageRisks.businessInterruption) loading += 0.05;
  if (coverageRisks.thirdPartyLiability) loading += 0.03;

  const netModifier = Math.max(-0.10, Math.min(0.12, loading - discount));

  if (insuredProperty.building && values.buildingValue > 0) {
    const tariff = Math.max(0.08, baseRates.building + netModifier);
    const premium = (values.buildingValue * tariff) / 100;
    totalSum += values.buildingValue;
    breakdown.push({ item: "Շինություն / Կառույց", value: values.buildingValue, tariff, premium });
  }

  if (insuredProperty.interior && values.interiorValue > 0) {
    const tariff = Math.max(0.10, baseRates.interior + netModifier);
    const premium = (values.interiorValue * tariff) / 100;
    totalSum += values.interiorValue;
    breakdown.push({ item: "Ներքին հարդարում և կոնստրուկտիվ տարրեր", value: values.interiorValue, tariff, premium });
  }

  if (insuredProperty.machinery && values.machineryValue > 0) {
    const tariff = Math.max(0.14, baseRates.machinery + netModifier);
    const premium = (values.machineryValue * tariff) / 100;
    totalSum += values.machineryValue;
    breakdown.push({ item: "Արտադրական հաստոցներ և սարքավորումներ", value: values.machineryValue, tariff, premium });
  }

  if (insuredProperty.equipment && values.equipmentValue > 0) {
    const tariff = Math.max(0.15, baseRates.equipment + netModifier);
    const premium = (values.equipmentValue * tariff) / 100;
    totalSum += values.equipmentValue;
    breakdown.push({ item: "Տեխնիկա, էլեկտրոնիկա, սերվերային սարքեր", value: values.equipmentValue, tariff, premium });
  }

  if (insuredProperty.stock && values.stockValue > 0) {
    const tariff = Math.max(0.15, baseRates.stock + netModifier);
    const premium = (values.stockValue * tariff) / 100;
    totalSum += values.stockValue;
    breakdown.push({ item: "Ապրանքանյութական պաշարներ / Հումք", value: values.stockValue, tariff, premium });
  }

  if (insuredProperty.glass && values.glassValue > 0) {
    const tariff = Math.max(0.20, baseRates.glass + netModifier);
    const premium = (values.glassValue * tariff) / 100;
    totalSum += values.glassValue;
    breakdown.push({ item: "Վիտրաժային ապակիներ և ապակեպատում", value: values.glassValue, tariff, premium });
  }

  if (insuredProperty.signs && values.signsValue > 0) {
    const tariff = Math.max(0.18, baseRates.signs + netModifier);
    const premium = (values.signsValue * tariff) / 100;
    totalSum += values.signsValue;
    breakdown.push({ item: "Գովազդային վահանակներ և ցուցանակներ", value: values.signsValue, tariff, premium });
  }

  if ((insuredProperty.guestDamage || (values.guestDamageValue && values.guestDamageValue > 0)) && (values.guestDamageValue || 0) > 0) {
    const val = values.guestDamageValue || 2000000;
    const tariff = Math.max(0.25, baseRates.guestDamage + netModifier);
    const premium = (val * tariff) / 100;
    totalSum += val;
    breakdown.push({ item: "Հյուրերի կողմից պատճառված վնաս", value: val, tariff, premium });
  }

  if (values.thirdPartyLiabilityValue && values.thirdPartyLiabilityValue > 0) {
    const val = values.thirdPartyLiabilityValue;
    const tariff = Math.max(0.20, baseRates.thirdPartyLiability + netModifier);
    const premium = (val * tariff) / 100;
    totalSum += val;
    breakdown.push({ item: "Քաղաքացիական պատասխանատվություն 3-րդ անձանց առջև", value: val, tariff, premium });
  }

  const calculatedTotalPremium = breakdown.reduce((acc, curr) => acc + curr.premium, 0);
  const weightedAverageTariff = totalSum > 0 ? (calculatedTotalPremium / totalSum) * 100 : 0.18;
  const finalTariff = state.customTariff !== undefined && state.customTariff > 0 ? state.customTariff : weightedAverageTariff;
  const annualPremium = state.customTariff !== undefined && state.customTariff > 0 ? (totalSum * state.customTariff) / 100 : calculatedTotalPremium;
  const franchisePercent = state.customFranchise !== undefined ? state.customFranchise : 0.5;
  const franchiseAmount = (totalSum * franchisePercent) / 100;

  return {
    totalSum,
    totalSumInsured: totalSum,
    baseTariff: weightedAverageTariff,
    discountBonus: discount * 100,
    finalTariff,
    annualPremium,
    franchisePercent,
    franchiseAmount,
    franchiseSummaryText: `${franchisePercent}% ապահովագրական գումարից (յուրաքանչյուր պատահարի համար)`,
    breakdown,
  };
}

export function calculateMortgageQuotation(data: MortgageInsuranceData) {
  const isPackageI = data.packageType === "PACKAGE_I";
  let interestTwoYearsAmount = 0;
  if (isPackageI) {
    interestTwoYearsAmount = data.principalBalance * (data.annualInterestRate / 100) * 2;
  }
  const insuredSumProperty = data.principalBalance + interestTwoYearsAmount;
  const propertyPremium = (insuredSumProperty * data.propertyTariff) / 100;
  let lifePremium = 0;
  if (data.lifeInsuranceIncluded) {
    lifePremium = (data.principalBalance * data.lifeTariff) / 100;
  }
  const totalAnnualPremium = propertyPremium + lifePremium;

  return {
    interestTwoYearsAmount,
    insuredSumProperty,
    propertyPremium,
    lifePremium,
    totalAnnualPremium,
  };
}

// 1. Property Proposal Builder
export function buildPropertyProposal(state: PropertyInsuranceFormState): QuotationProposal {
  const calc = calculatePropertyQuotation(state);
  const { coverageRisks, propertyPackage, rentalDetails } = state;
  const isPackage = propertyPackage && propertyPackage !== "custom" && TUN_SERVICE_PACKAGES[propertyPackage as PropertyPackageId];
  const pkg = isPackage ? TUN_SERVICE_PACKAGES[propertyPackage as PropertyPackageId] : null;

  const perils: string[] = [];
  if (coverageRisks.fireExplosion || pkg) perils.push("Հրդեհ, պայթյուն, կայծակի հարված, օդանավի անկում (FLEXA)");
  if (coverageRisks.waterDamage || pkg) perils.push("Ջրամատակարարման, ջեռուցման, կոյուղու և հակահրդեհային համակարգերի վթարներ / ջրալցում");
  if (coverageRisks.naturalDisasters || pkg) perils.push("Բնական աղետներ (երկրաշարժ, փոթորիկ, կարկուտ, ջրհեղեղ, սողանք)");
  if (coverageRisks.burglaryRobbery || pkg) perils.push("Հափշտակություն (գողություն կոտրանքով / ներթափանցմամբ, կողոպուտ, ավազակություն)");
  if (coverageRisks.vandalism || pkg) perils.push("Երրորդ անձանց հակաիրավական գործողություններ / դիտավորյալ վնասում / վանդալիզմ");
  if (coverageRisks.mechanicalSmoke) perils.push("Մեխանիկական և ծխի ազդեցություն");
  
  if (coverageRisks.guestDamage || pkg?.guestDamageSumInsuredAMD || state.insuredProperty.guestDamage || rentalDetails?.hasGuestDamageCoverage) {
    perils.push("Հյուրերի / վարձակալների կողմից շարժական կամ անշարժ գույքին պատճառված վնասների հատուցում (ըստ Գույքի Պայմանների 5.19 կետի)");
  }
  
  if (coverageRisks.thirdPartyLiability || pkg?.liabilitySumInsuredAMD) {
    perils.push("Քաղաքացիական պատասխանատվություն 3-րդ անձանց (հարևաններին) պատճառված գույքային և առողջական վնասների գծով");
  }
  
  if (coverageRisks.businessInterruption) perils.push("Բիզնեսի ընդհատման հետևանքով կորուստների հատուցում");

  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);

  const productName = pkg 
    ? `Գույքի Ապահովագրություն — Փաթեթ «${pkg.name}»` 
    : "Գույքի Համապարփակ Ապահովագրություն";

  const specialConditions: string[] = [
    "Վերջնական ծածկույթը, բացառությունները, սահմանաչափերը և հատուկ պայմանները սահմանվում են գործող ապահովագրական պայմաններով և սույն գնառաջարկում ընտրված ռիսկերով։",
  ];

  if (pkg) {
    specialConditions.push(`Ընտրված փաթեթ՝ «${pkg.name}» (${pkg.tagline})։`);
    specialConditions.push(`Ֆրանշիզայի պայմաններ՝ ${pkg.fullFranchiseSummary}։`);
    if (pkg.isRentalOptimized) {
      specialConditions.push("Փաթեթը ներառում է օրավարձով / կարճաժամկետ հյուրերի ընդունման ռիսկերը, ներառյալ հյուրերի կողմից գույքին հասցված պատահական վնասները:");
    }
  } else {
    specialConditions.push("Գույքի վերաբերյալ վերջնական սակագինը և պայմանները կարող են կախված լինել ներկայացված տվյալներից, վնասների պատմությունից և անհրաժեշտ զննությունից։");
  }

  const clientName = state.company.name || "«Ապահովադիր / Գույքի Սեփականատեր»";
  const purpose = rentalDetails?.rentalType === "short_term_rental"
    ? "Օրավարձով / Կարճաժամկետ վարձակալություն (Airbnb / Booking)"
    : rentalDetails?.rentalType === "long_term_rental"
    ? "Երկարաժամկետ վարձակալություն"
    : state.objectData.purpose || "Բնակելի / Կոմերցիոն տարածք";

  return {
    id: `prop-${Date.now()}`,
    quotationNumber: generateQuotationNumber("property"),
    type: "property",
    productNameArm: productName,
    categoryNameArm: "Գույք և Անշարժ Գույք",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName,
    contactInfo: `${state.company.contactPerson || ""} | Հեռ․՝ ${state.company.phone || ""} | Էլ․ հասցե՝ ${state.company.email || ""}`,
    objectDescription: `Գտնվելու վայրը՝ ${state.objectData.address || "ք․ Երևան"}: Տարածք՝ ${state.objectData.totalArea || "0"} քմ: Շահագործման ձև՝ ${purpose}:`,
    totalSumInsured: calc.totalSum || (pkg ? pkg.totalSumInsuredAMD : 25000000),
    currency: state.values.currency,
    baseTariff: calc.baseTariff,
    discountBonus: calc.discountBonus,
    finalTariff: calc.finalTariff,
    annualPremium: calc.annualPremium,
    franchiseDescription: pkg ? pkg.fullFranchiseSummary : `${calc.franchisePercent}% ապահովագրական գումարից (յուրաքանչյուր պատահարի համար)`,
    franchiseAmount: calc.franchiseAmount,
    paymentTerms: state.paymentSchedule === "quarterly" ? "Եռամսյակային հավասար մասերով (4 փուլ)" : state.paymentSchedule === "biannual" ? "Կիսամյակային (2 փուլ)" : "Միանվագ 100% տարեկան վճարում",
    beneficiaryDetails: state.beneficiary.isPledged ? `Շահառու՝ ${state.beneficiary.bankName} (Վարկային պայմանագիր՝ ${state.beneficiary.loanAgreementNumber || "Առկա է"})` : "Շահառու՝ Ապահովադիր",
    coveredPerilsList: perils,
    propertyBreakdown: calc.breakdown,
    specialConditions,
    productSpecificDetails: {
      packageId: propertyPackage || "custom",
      packageName: pkg ? pkg.name : "Անհատական",
      rentalType: rentalDetails?.rentalType || "owner_occupied",
      platform: rentalDetails?.platform || "—",
      hasGuestDamage: Boolean(pkg?.guestDamageSumInsuredAMD || state.insuredProperty.guestDamage || rentalDetails?.hasGuestDamageCoverage),
      guestDamageSumInsured: (pkg?.guestDamageSumInsuredAMD || state.values.guestDamageValue || 0),
      liabilitySumInsured: (pkg?.liabilitySumInsuredAMD || state.values.thirdPartyLiabilityValue || 0),
    },
    sourceDocuments: [
      pkg ? "«Tun Servic Offer PR+LB.docx» Պաշտոնական Փաթեթներ և Սակագներ" : "Տրամադրված գույքի ապահովագրության պայմաններ / SIL Insurance պաշտոնական գույքի էջ"
    ],
    sourceVersion: pkg ? "Tun Servic Offer PR+LB 2024/2025" : "SIL Property Underwriting 2024",
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Անդեռռայթինգի Բաժին",
    agentTitle: "Գլխավոր Անդեռռայթեր / Գույքային Ապահովագրության Փորձագետ",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "info@silinsurance.am",
  };
}

// 2. Mortgage Proposal Builder
export function buildMortgageProposal(data: MortgageInsuranceData): QuotationProposal {
  const calc = calculateMortgageQuotation(data);
  const isPackageI = data.packageType === "PACKAGE_I";
  const overallTariff = calc.insuredSumProperty > 0 ? (calc.totalAnnualPremium / calc.insuredSumProperty) * 100 : 0.18;

  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);

  return {
    id: `mort-${Date.now()}`,
    quotationNumber: generateQuotationNumber("mortgage"),
    type: "mortgage",
    productNameArm: "Հիփոթեքային Վարկառուների Ապահովագրություն",
    categoryNameArm: "Գույք և Անշարժ Գույք",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName: data.borrowerName || "Անհատ Վարկառու",
    contactInfo: `Անձնագիր՝ ${data.borrowerPassport || "Առկա է"} | Հեռ․՝ ${data.borrowerPhone || ""} | Էլ․ հասցե՝ ${data.borrowerEmail || ""}`,
    objectDescription: `Հիփոթեքով ծանրաբեռնված գույքի հասցե՝ ${data.propertyAddress || "ք․ Երևան"}: Ֆինանսավորող Բանկ՝ ${data.bankName}: Վարկային պայմանագիր N ${data.loanContractNumber || "—"}:`,
    totalSumInsured: calc.insuredSumProperty,
    currency: data.currency,
    baseTariff: data.propertyTariff,
    discountBonus: 0,
    finalTariff: overallTariff,
    annualPremium: calc.totalAnnualPremium,
    franchiseDescription: data.franchisePercent === 0 ? "0% (Անհատույց / Առանց ֆրանշիզայի)" : `${data.franchisePercent}% ապահովագրական գումարից`,
    franchiseAmount: (calc.insuredSumProperty * data.franchisePercent) / 100,
    paymentTerms: "Տարեկան միանվագ վճարում (վարկի տարեդարձի օրը)",
    beneficiaryDetails: `Առաջնային Շահառու՝ ${data.bankName} (Չմարված վարկային պարտավորությունների չափով), Մնացորդային մասով՝ Վարկառու կամ նրա իրավահաջորդներ:`,
    coveredPerilsList: [
      "Գրավադրված անշարժ գույքի հրդեհ, պայթյուն, բնական աղետներ (երկրաշարժ, փոթորիկ)",
      "Ջրամատակարարման և ջեռուցման համակարգերի վթարային արտահոսք",
      ...(data.lifeInsuranceIncluded ? ["Վարկառուի մահ դժբախտ պատահարի հետևանքով", "Վարկառուի 1-ին կամ 2-րդ կարգի հաշմանդամություն դժբախտ պատահարի հետևանքով"] : []),
    ],
    mortgageBreakdown: {
      packageType: data.packageType,
      packageLabel: isPackageI ? "ՓԱԹԵԹ I (ԱՀԸ չափանիշներ՝ Մայր գումար + 2 տարվա տոկոսներ)" : "ՓԱԹԵԹ II (ԲԵ չափանիշներ՝ Միայն մայր գումար)",
      principal: data.principalBalance,
      interestTwoYears: isPackageI ? calc.interestTwoYearsAmount : 0,
      totalCoveredSum: calc.insuredSumProperty,
      propertyPremium: calc.propertyPremium,
      lifePremium: calc.lifePremium,
      bankName: data.bankName,
    },
    specialConditions: [
      "Վերջնական փաթեթը, սահմանաչափերը, բացառությունները և շահառուի իրավունքները սահմանվում են գործող պայմանագրով և ընտրված հիփոթեքային փաթեթով։",
      "Հաշվարկի հիմքում օգտագործվում են մուտքագրված վարկային տվյալները և ընտրված փաթեթի հաշվարկային կանոնները։",
    ],
    sourceDocuments: ["Հիփոթեքային հաշվարկի գործող կանոններ / համապատասխան պայմանագրային փաստաթղթեր"],
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Հիփոթեքային Կենտրոն",
    agentTitle: "Բանկային Գործընկերության Պատասխանատու",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "mortgage@silinsurance.am",
  };
}

export type CascoExcelCalculation = {
  valid: boolean;
  errors: string[];
  yearBand: CascoYearBand;
  amountBand: "under7" | "over7";
  baseGrossMax: number;
  adjustments: Array<{ label: string; value: number }>;
  subtotal: number;
  brokerCommission: number;
  profit: number;
  tariffBeforeMinimum: number;
  minimumTariff: number;
  finalTariff: number;
  annualPremium: number;
  source: string;
  calculatorVersion: string;
};

function getCascoYearBand(year: number): CascoYearBand {
  const found = CASCO_YEAR_BANDS.find((b) => year >= b.min && (b.max === undefined || year <= b.max));
  return found?.key ?? "2021_plus";
}

export function calculateCascoFromExcel(data: CascoInsuranceData): CascoExcelCalculation {
  const party: CascoParty = data.policyholderType ?? "Ֆիզիկական անձ";
  const yearBand = getCascoYearBand(Number(data.manufactureYear));
  const amountBand = Number(data.marketValue) < 7_000_000 ? "under7" : "over7";
  const baseGrossMax = CASCO_BASE_GROSS_MAX[yearBand][party][amountBand];
  const adjustments: Array<{ label: string; value: number }> = [];
  const errors: string[] = [];
  const marketValue = Number(data.marketValue);
  const manufactureYear = Number(data.manufactureYear);
  if (!Number.isFinite(marketValue) || marketValue <= 0) errors.push("Ապահովագրական/շուկայական արժեքը պետք է լինի 0-ից մեծ։");
  if (!Number.isFinite(manufactureYear) || manufactureYear < 1900 || manufactureYear > new Date().getFullYear() + 1) errors.push("Արտադրության տարին անվավեր է։");
  if (!String(data.clientName || "").trim()) errors.push("Ապահովադրի անունը պարտադիր է։");
  if (!String(data.vehicleMake || "").trim() || !String(data.vehicleModel || "").trim()) errors.push("Մեքենայի մակնիշը և մոդելը պարտադիր են։");
  if (Number(data.brokerCommissionPercent ?? 10) < 0 || Number(data.brokerCommissionPercent ?? 10) > 100) errors.push("Միջնորդավճարը պետք է լինի 0-100% միջակայքում։");
  if (Number(data.profitPercent ?? 10) < 0 || Number(data.profitPercent ?? 10) > 100) errors.push("Շահույթի տոկոսը պետք է լինի 0-100% միջակայքում։");

  const warranty = data.warrantyService ?? "չներառել";
  if (warranty === "ներառել") {
    // Exact calculator formula: warranty is rejected unless the selected Excel band is 2021+.
    if (yearBand !== "2021_plus") {
      errors.push("Երաշխիքային սպասարկումը Excel հաշվիչի բանաձևով թույլատրված է միայն «2021-ից բարձր» խմբի համար։");
    } else {
      adjustments.push({ label: "Երաշխիքային սպասարկում", value: CASCO_WARRANTY_FACTOR });
    }
  }

  if ((data.driverCountOption ?? (data.isUnlimitedDrivers ? "Անսահմանափակ" : "Սահմանափակ")) === "Անսահմանափակ") {
    adjustments.push({ label: "Անսահմանափակ վարորդներ", value: CASCO_UNLIMITED_DRIVERS_ADJUSTMENT });
  }

  const franchiseOption = data.franchiseOption ?? "Ֆրանշիզան անփոփոխ";
  if (franchiseOption === "Ֆրանշիզայի կիսում") {
    adjustments.push({ label: "Ֆրանշիզայի կիսում", value: CASCO_FRANCHISE_ADJUSTMENTS.share[amountBand] });
  } else if (franchiseOption === "Մինիմալ ֆրանշիզա") {
    adjustments.push({ label: "Մինիմալ ֆրանշիզա", value: CASCO_FRANCHISE_ADJUSTMENTS.minimal[amountBand] });
  }

  const bonusMalus = data.bonusMalus ?? "չընտրել";
  const lossRatio = data.lossRatio ?? "չընտրել";
  if (bonusMalus !== "չընտրել" && lossRatio !== "չընտրել") {
    errors.push("Excel հաշվիչի կանոնով ԲՄ և Վնասաբերություն դաշտերից պետք է ընտրել միայն մեկը։");
  } else if (bonusMalus === "չընտրել" && lossRatio === "չընտրել") {
    errors.push("Excel հաշվիչի կանոնով պետք է ընտրել ԲՄ կամ Վնասաբերություն դաշտերից մեկը։");
  } else if (bonusMalus !== "չընտրել") {
    adjustments.push({ label: `Բոնուս Մալուս՝ ${bonusMalus}`, value: CASCO_BONUS_MALUS_ADJUSTMENTS[bonusMalus] ?? 0 });
  } else if (lossRatio === "Վնասաբերությունը  >=  90% ") {
    adjustments.push({ label: "Վնասաբերությունը ≥ 90%", value: CASCO_LOSS_RATIO_FACTOR });
  }

  const paymentMethod = data.paymentMethod ?? "Միանվագ";
  const paymentFactor = CASCO_PAYMENT_FACTORS[paymentMethod] ?? 0;
  adjustments.push({ label: `Վճարման ձև՝ ${paymentMethod}`, value: paymentFactor });

  const trafficRules = data.trafficRules ?? "չներառել";
  if (trafficRules === "ներառել" && party === "Ֆիզիկական անձ") {
    adjustments.push({ label: "ՃԵԿ կանոններ", value: CASCO_TRAFFIC_RULE_FACTOR });
  }

  const theftCoverage = data.theftCoverage ?? "ներառել";
  if (theftCoverage === "ներառել միայն մանր դետալները") {
    adjustments.push({ label: "Գողություն՝ միայն մանր դետալներ", value: CASCO_THEFT_EXCLUDE_SMALL_DETAILS_FACTOR });
  } else if (theftCoverage === "չներառել") {
    const exclusion = Math.min(Math.max(Number(data.theftExclusionPercent ?? 0), 0), CASCO_THEFT_EXCLUDE_MAX);
    adjustments.push({ label: `Գողության ռիսկը չներառելու չափ՝ ${(exclusion * 100).toFixed(0)}%`, value: -0.00543956043956044 });
  }

  const territory = data.territory ?? "Միայն ՀՀ";
  adjustments.push({ label: `Տարածաշրջան՝ ${territory}`, value: CASCO_REGION_FACTORS[territory] ?? 0 });

  if (data.electricVehicle) {
    adjustments.push({ label: "Էլեկտրոմոբիլ", value: CASCO_ELECTRIC_VEHICLE_ADJUSTMENT });
  }

  const subtotal = baseGrossMax + adjustments.reduce((sum, a) => sum + a.value, 0);
  const brokerPct = Math.min(Math.max(Number(data.brokerCommissionPercent ?? CASCO_BROKER_COMMISSION * 100), 0), 100) / 100;
  const profitPct = Math.min(Math.max(Number(data.profitPercent ?? CASCO_PROFIT * 100), 0), 100) / 100;
  const tariffBeforeMinimum = subtotal / (1 - brokerPct) / (1 - profitPct);
  const minimumTariff = CASCO_MIN_TARIFF[party][amountBand];
  const finalTariff = Math.max(tariffBeforeMinimum, minimumTariff);
  const annualPremium = Math.round((marketValue * finalTariff) / 1000) * 1000;

  return {
    valid: errors.length === 0,
    errors,
    yearBand,
    amountBand,
    baseGrossMax,
    adjustments,
    subtotal,
    brokerCommission: brokerPct,
    profit: profitPct,
    tariffBeforeMinimum,
    minimumTariff,
    finalTariff,
    annualPremium,
    source: "casco calculator 2024 - առանց ՃՈՈ.xlsx / calculator + result 2 + վերապ",
    calculatorVersion: "CASCO-EXCEL-2024-v1",
  };
}

// Helper to resolve CASCO franchise description and amount
export function getCascoFranchiseInfo(data: CascoInsuranceData): { description: string; amount: number } {
  const opt = data.franchiseOption ?? "Ֆրանշիզան անփոփոխ";
  const currency = data.currency || "AMD";
  const marketVal = Number(data.marketValue) || 0;

  // 1. Explicit fixed amount specified (> 0)
  if (data.franchiseAmount && data.franchiseAmount > 0) {
    if (opt === "Ֆրանշիզայի կիսում") {
      return {
        description: `Ֆրանշիզայի կիսում՝ ֆիքսված ${formatCurrency(data.franchiseAmount, currency)} (յուրաքանչյուր պատահարի համար)`,
        amount: data.franchiseAmount,
      };
    }
    if (opt === "Մինիմալ ֆրանշիզա") {
      return {
        description: `Մինիմալ ֆրանշիզա՝ ֆիքսված ${formatCurrency(data.franchiseAmount, currency)} (յուրաքանչյուր պատահարի համար)`,
        amount: data.franchiseAmount,
      };
    }
    return {
      description: `Ֆիքսված ֆրանշիզա՝ ${formatCurrency(data.franchiseAmount, currency)} (յուրաքանչյուր պատահարի համար)`,
      amount: data.franchiseAmount,
    };
  }

  // 2. Explicit zero franchise / VIP package
  if (data.franchiseType === "zero" || (data as any).isZeroFranchise) {
    return {
      description: "0% (Առանց ֆրանշիզայի / Լրիվ ծածկույթ)",
      amount: 0,
    };
  }

  // 3. Based on Excel franchiseOption
  if (opt === "Ֆրանշիզայի կիսում") {
    const calcHalf = marketVal > 0 ? Math.round(marketVal * 0.0025) : 0;
    return {
      description: "Ֆրանշիզայի կիսում՝ 50% կրճատված չհատուցվող գումար (ըստ ԿԱՍԿՈ պայմանների)",
      amount: calcHalf,
    };
  }

  if (opt === "Մինիմալ ֆրանշիզա") {
    return {
      description: "Մինիմալ ֆրանշիզա (նվազագույն սահմանված չհատուցվող գումար)",
      amount: 0,
    };
  }

  // 4. Default / "Ֆրանշիզան անփոփոխ"
  const defaultStandardAmt = marketVal > 0 ? Math.round(marketVal * 0.005) : 0;
  return {
    description: "Ստանդարտ ֆրանշիզա՝ 0.5% (անփոփոխ՝ համաձայն ԿԱՍԿՈ պայմանների)",
    amount: defaultStandardAmt,
  };
}

// 3. CASCO Proposal Builder
export function buildCascoProposal(data: CascoInsuranceData): QuotationProposal {
  const calc = calculateCascoFromExcel(data);
  const tariff = calc.finalTariff * 100;
  const annualPremium = calc.annualPremium;
  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);
  const franchiseInfo = getCascoFranchiseInfo(data);

  return {
    id: `casco-${Date.now()}`,
    quotationNumber: generateQuotationNumber("casco"),
    type: "casco",
    productNameArm: "ԿԱՍԿՈ Ավտոապահովագրություն",
    categoryNameArm: "Ավտոտրանսպորտ",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName: data.clientName || "Ավտոտիրոջ Անուն Ազգանուն",
    contactInfo: `Հեռ․՝ ${data.phone || ""} | Էլ․ հասցե՝ ${data.email || ""}`,
    objectDescription: `Ավտոմեքենա՝ ${data.vehicleMake} ${data.vehicleModel}, Թողարկման տարեթիվ՝ ${data.manufactureYear} թ․, Շուկայական գնահատված արժեք՝ ${formatCurrency(data.marketValue, data.currency)}:`,
    totalSumInsured: data.marketValue,
    currency: data.currency,
    baseTariff: calc.baseGrossMax * 100,
    discountBonus: 0,
    finalTariff: tariff,
    annualPremium: annualPremium,
    franchiseDescription: franchiseInfo.description,
    franchiseAmount: franchiseInfo.amount,
    paymentTerms: "Տարեկան միանվագ կամ 2-4 փուլով տարաժամկետ վճարում",
    beneficiaryDetails: data.isPledged && data.bankName ? `Շահառու՝ ${data.bankName} (Գրավի իրավունքով)` : "Շահառու՝ Ապահովադիր",
    coveredPerilsList: [
      "ԿԱՍԿՈ-ի ծածկույթները որոշվում են գործող պայմանագրով և ընտրված ռիսկերով։",
      ...(data.theftCoverage === "չներառել" ? [] : ["Գողության ռիսկ՝ ըստ ընտրված տարբերակի"]),
      ...(data.trafficRules === "ներառել" ? ["ՃԵԿ կանոններ՝ ըստ Excel հաշվիչի"] : []),
      ...(data.warrantyService === "ներառել" ? ["Երաշխիքային սպասարկում"] : []),
      ...(data.includeGlassNoPolice ? ["Ապակիների/մանր դետալների ընտրված լրացուցիչ ծածկույթ"] : []),
      ...(data.includeTowingAssistance ? ["Տարհանում / ճանապարհային օգնություն"] : []),
    ],
    productSpecificDetails: {
      makeModel: `${data.vehicleMake} ${data.vehicleModel}`,
      year: data.manufactureYear,
      driverAge: data.driverMinAge,
      driverExp: data.driverMinExp,
      glassNoPolice: data.includeGlassNoPolice,
      towing: data.includeTowingAssistance,
      excelYearBand: calc.yearBand,
      excelAmountBand: calc.amountBand,
      excelBaseGrossMax: calc.baseGrossMax * 100,
      excelMinimumTariff: calc.minimumTariff * 100,
      excelAdjustments: calc.adjustments,
    },
    calculationBreakdown: [
      { label: "Բազային բրուտտո մաքս", value: calc.baseGrossMax * 100, unit: "%" },
      ...calc.adjustments.map((a) => ({ label: a.label, value: a.value * 100, unit: "տոկոսային կետ" })),
      { label: "Սակագին՝ նվազագույն շեմից առաջ", value: calc.tariffBeforeMinimum * 100, unit: "%" },
      { label: "Excel նվազագույն սակագին", value: calc.minimumTariff * 100, unit: "%" },
      { label: "Վերջնական սակագին", value: calc.finalTariff * 100, unit: "%" },
    ],
    underwriting: { status: calc.errors.length ? "manual_review" : "approved", reasons: calc.errors },
    sourceDocuments: [calc.source],
    specialConditions: [
      `Հաշվարկը կատարվել է տրամադրված Excel հաշվիչի տրամաբանությամբ՝ ${calc.source}։`,
      `Բազային բրուտտո մաքս՝ ${(calc.baseGrossMax * 100).toFixed(4)}%։`,
      ...calc.adjustments.map((a) => `${a.label}: ${a.value >= 0 ? "+" : ""}${(a.value * 100).toFixed(4)} տոկոսային կետ։`),
      `Միջնորդավճար՝ ${(calc.brokerCommission * 100).toFixed(0)}%, շահույթ՝ ${(calc.profit * 100).toFixed(0)}%։`,
      `Excel նվազագույն սակագին՝ ${(calc.minimumTariff * 100).toFixed(2)}%։`,
      ...(calc.errors.length ? calc.errors : []),
      "Վերջնական ապահովագրական ծածկույթը և հատուցման պայմանները որոշվում են գործող ԿԱՍԿՈ պայմանագրով։",
    ],
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Ավտոապահովագրության Դեպարտամենտ",
    agentTitle: "Ավտոապահովագրության Գլխավոր Մասնագետ",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "casco@silinsurance.am",
  };
}

// 4. Health / VMI Proposal Builder
export function buildHealthProposal(data: HealthInsuranceData): QuotationProposal {
  let tariff = data.tariffPerPerson || 4.2;
  if (data.planLevel === "platinum") tariff = 5.5;
  if (data.planLevel === "standard") tariff = 3.5;
  if (data.includeDental) tariff += 0.8;
  if (data.includeVision) tariff += 0.3;

  const totalSumInsured = data.limitPerPerson * data.insuredCount;
  const annualPremium = (totalSumInsured * tariff) / 100;
  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);

  return {
    id: `health-${Date.now()}`,
    quotationNumber: generateQuotationNumber("health"),
    type: "health",
    productNameArm: "Կամավոր Բժշկական Ապահովագրություն (ԿԲԱ)",
    categoryNameArm: "Առողջություն և Կյանք",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName: data.companyName || data.clientName || "Կորպորատիվ Հաճախորդ",
    contactInfo: `Հեռ․՝ ${data.phone || ""} | Էլ․ հասցե՝ ${data.email || ""}`,
    objectDescription: `Ապահովագրվող անձանց քանակ՝ ${data.insuredCount} աշխատակից / անձ: Ծրագրի մակարդակ՝ ${data.planLevel.toUpperCase()}: Տարեկան սահմանաչափ 1 անձի համար՝ ${formatCurrency(data.limitPerPerson, data.currency)}:`,
    totalSumInsured: totalSumInsured,
    currency: data.currency,
    baseTariff: tariff,
    discountBonus: 0,
    finalTariff: tariff,
    annualPremium: annualPremium,
    franchiseDescription: "0% հոսպիտալային բուժօգնության համար, 10% դեղորայքի ձեռքբերման համար",
    franchiseAmount: 0,
    paymentTerms: "Եռամսյակային կամ կիսամյակային հավասար փուլերով",
    beneficiaryDetails: "Շահառու՝ Ապահովագրված աշխատակիցներ",
    coveredPerilsList: [
      "Ստացիոնար բուժօգնություն և վիրահատական միջամտություններ ՀՀ լավագույն կլինիկաներում",
      "Ամբուլատոր-պոլիկլինիկական խորհրդատվություն, լաբորատոր և գործիքային ախտորոշում (MRT, CT, ՈՒՁՀ)",
      "Անհետաձգելի շտապ բժշկական օգնություն և տեղափոխում",
      "Դեղորայքի հատուցում դեղատոմսի հիման վրա",
      "Տարեկան կանխարգելիչ բժշկական համալիր զննում (Preventive Check-up)",
      ...(data.includeDental ? ["Թերապևտիկ և վիրաբուժական ատամնաբուժություն, ատամնաքարերի մաքրում"] : []),
    ],
    productSpecificDetails: {
      count: data.insuredCount,
      limitPerPerson: data.limitPerPerson,
      premiumPerPerson: annualPremium / data.insuredCount,
      planLevel: data.planLevel,
    },
    specialConditions: [
      "Ծածկույթը, բժշկական սահմանաչափերը, բացառությունները և սպասարկման կարգը սահմանվում են ընտրված ծրագրով և գործող պայմաններով։",
      "Գնառաջարկը չի փոխարինում ապահովագրական պայմանագրին և վերջնական հաստատմանը։",
    ],
    sourceDocuments: ["SIL Insurance առողջության ապահովագրության պրոդուկտի հրապարակված տեղեկատվություն"],
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Բժշկական Ապահովագրության Դեպարտամենտ",
    agentTitle: "Բժշկական Ծրագրերի Ղեկավար",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "health@silinsurance.am",
  };
}

// 5. Travel Proposal Builder
export function buildTravelProposal(data: TravelInsuranceData): QuotationProposal {
  const dailyRateEur = data.destination === "schengen" ? 0.9 : data.destination === "georgia" ? 0.4 : 1.4;
  const totalPremiumEur = dailyRateEur * data.tripDurationDays * data.travelerCount;
  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);

  return {
    id: `trav-${Date.now()}`,
    quotationNumber: generateQuotationNumber("travel"),
    type: "travel",
    productNameArm: "Արտերկիր Մեկնողների (Ճամփորդական) Ապահովագրություն",
    categoryNameArm: "Ճամփորդություն",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName: data.travelerName || "Ճամփորդող",
    contactInfo: `Հեռ․՝ ${data.phone || ""}`,
    objectDescription: `Ուղղություն՝ ${data.destination.toUpperCase()}, Տևողություն՝ ${data.tripDurationDays} օր, Ճամփորդների քանակ՝ ${data.travelerCount} անձ, Ծածկույթի սահմանաչափ՝ ${formatCurrency(data.coverageLimit, data.currency)}:`,
    totalSumInsured: data.coverageLimit * data.travelerCount,
    currency: data.currency,
    baseTariff: 0.8,
    discountBonus: 0,
    finalTariff: 0.8,
    annualPremium: totalPremiumEur,
    franchiseDescription: "0 € (Առանց ֆրանշիզայի)",
    franchiseAmount: 0,
    paymentTerms: "Միանվագ 100% վճարում վկայագրի տրամադրման պահին",
    beneficiaryDetails: "Շահառու՝ Ճամփորդող կամ նրա իրավահաջորդ",
    coveredPerilsList: [
      "Անհետաձգելի բժշկական օգնություն և հոսպիտալացում արտերկրում",
      "Բժշկական տարհանում (Medical Repatriation) դեպի Հայաստան",
      "Անհետաձգելի ատամնաբուժական ծախսեր",
      "Ուղեբեռի կորստի կամ ուշացման հատուցում",
      "COVID-19 ծածկույթ արտերկրում",
    ],
    specialConditions: [
      "Ծածկույթը, տարածքը, օրերի քանակը, սահմանաչափերը և բացառությունները սահմանվում են ընտրված ճանապարհորդական ծրագրով և գործող պայմաններով։",
      "Վերջնական առաջարկը պետք է ստուգվի ուղևորության տվյալների և ընտրված ծրագրի նկատմամբ։",
    ],
    sourceDocuments: ["SIL Insurance ճանապարհորդության ապահովագրության հրապարակված տեղեկատվություն"],
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Միջազգային Ապահովագրության Բաժին",
    agentTitle: "Ճամփորդական Վկայագրերի Մասնագետ",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "travel@silinsurance.am",
  };
}

// 6. Cargo Proposal Builder
export function buildCargoProposal(data: CargoInsuranceData): QuotationProposal {
  let tariff = data.clauseType === "ICC_A" ? 0.28 : data.clauseType === "ICC_B" ? 0.20 : 0.15;
  if (data.isFragile) tariff += 0.05;
  if (data.isTemperatureControlled) tariff += 0.04;

  const premium = (data.cargoValue * tariff) / 100;
  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);

  return {
    id: `cargo-${Date.now()}`,
    quotationNumber: generateQuotationNumber("cargo"),
    type: "cargo",
    productNameArm: "Բեռների Ապահովագրություն (Cargo ICC A/B/C)",
    categoryNameArm: "Բիզնես և Կորպորատիվ",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName: data.clientName || "Բեռնատեր / Ապահովադիր",
    contactInfo: `Հեռ․՝ ${data.phone || ""}`,
    objectDescription: `Բեռ՝ ${data.cargoDescription}, Երթուղի՝ ${data.originCountry} -> ${data.destinationCountry}, Փոխադրման եղանակ՝ ${data.transportMode.toUpperCase()}, Կլաուզա՝ ${data.clauseType}:`,
    totalSumInsured: data.cargoValue,
    currency: data.currency,
    baseTariff: tariff,
    discountBonus: 0,
    finalTariff: tariff,
    annualPremium: premium,
    franchiseDescription: "0.3% բեռի արժեքից (յուրաքանչյուր դեպքի համար)",
    franchiseAmount: (data.cargoValue * 0.3) / 100,
    paymentTerms: "Միանվագ վճարում մինչև փոխադրման մեկնարկը",
    beneficiaryDetails: "Շահառու՝ Բեռի սեփականատեր / Բանկ (ակրեդիտիվի դեպքում)",
    coveredPerilsList: [
      "Փոխադրամիջոցի ՃՏՊ, բախում, շրջվել, կամրջից անկում",
      "Հրդեհ, պայթյուն, կայծակի հարված փոխադրման և միջանկյալ պահեստավորման ընթացքում",
      "Բեռնման, վերաբեռնման և բեռնաթափման ընթացքում առաջացած մեխանիկական վնասներ",
      "Գողություն, կողոպուտ, ամբողջական տեղի անհետացում",
      "Բնական աղետների և տարերային ռիսկերի ազդեցություն",
    ],
    specialConditions: [
      "Բեռի վերջնական ծածկույթը, երթուղին, պայմանները, բացառությունները և սահմանաչափերը սահմանվում են ընտրված ICC/այլ պայմաններով և պայմանագրով։",
      "Վերջնական ապահովագրավճարը կախված է մուտքագրված բեռի և փոխադրման տվյալներից։",
    ],
    sourceDocuments: ["SIL Insurance բեռների ապահովագրության համապատասխան պայմաններ"],
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Բեռների Ապահովագրության Բաժին",
    agentTitle: "Բեռնափոխադրումների Գլխավոր Անդեռռայթեր",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "cargo@silinsurance.am",
  };
}

// 7. Generic Product Proposal Builder for all remaining products
export function buildGenericCatalogProposal(
  productType: InsuranceProductType,
  customData?: Record<string, any>
): QuotationProposal {
  const cat = SIL_PRODUCTS_CATALOG.find((p) => p.id === productType) || SIL_PRODUCTS_CATALOG[0];
  const defaults = { ...cat.defaultValues, ...customData };
  const sumInsured = defaults.propertySum || defaults.marketValue || defaults.contractValue || defaults.limitOfIndemnity || defaults.cargoValue || defaults.totalSum || defaults.estimatedHarvestValue || 50000000;
  const currency = defaults.currency || "AMD";
  const tariff = cat.baseTariffPercent;
  const premium = (sumInsured * tariff) / 100;

  const today = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(today.getDate() + 30);

  return {
    id: `${productType}-${Date.now()}`,
    quotationNumber: generateQuotationNumber(productType),
    type: productType,
    productNameArm: cat.nameArm,
    categoryNameArm: cat.categoryArm,
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntilDate.toLocaleDateString("hy-AM"),
    clientName: defaults.clientName || defaults.contractorName || defaults.farmerName || defaults.insuredName || defaults.borrowerName || "«Հաճախորդ»",
    contactInfo: `Հեռ․՝ ${defaults.phone || "+374 (10) 58-00-00"}`,
    objectDescription: cat.fullDesc,
    totalSumInsured: sumInsured,
    currency: currency,
    baseTariff: tariff,
    discountBonus: 0,
    finalTariff: tariff,
    annualPremium: premium,
    franchiseDescription: cat.typicalFranchise,
    franchiseAmount: (sumInsured * 0.5) / 100,
    paymentTerms: "Տարեկան միանվագ կամ փուլային վճարում",
    beneficiaryDetails: "Շահառու՝ Ապահովադիր",
    coveredPerilsList: cat.coveredRisks,
    specialConditions: cat.keyBenefits,
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Մասնագիտացված Կենտրոն",
    agentTitle: "Ապահովագրական Պրոդուկտների Կառավարիչ",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "info@silinsurance.am",
  };
}
