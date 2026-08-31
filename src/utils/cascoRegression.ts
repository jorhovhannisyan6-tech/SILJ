import { CascoInsuranceData } from "../types";
import { calculateCascoFromExcel } from "./insuranceCalculator";

// Golden vectors are fixed regression checks. They are intentionally independent of UI state.
const base: CascoInsuranceData = {
  clientName: "Test", phone: "", email: "", vehicleMake: "Test", vehicleModel: "Test", manufactureYear: 2024,
  marketValue: 10_000_000, currency: "AMD", coverageType: "comprehensive", franchiseType: "percent", franchiseAmount: 0,
  driverMinAge: 18, driverMinExp: 1, isUnlimitedDrivers: true, includeGlassNoPolice: false, includeTowingAssistance: false,
  isPledged: false, baseTariff: 0, discount: 0, policyholderType: "Ֆիզիկական անձ", warrantyService: "չներառել",
  driverCountOption: "Անսահմանափակ", franchiseOption: "Ֆրանշիզան անփոփոխ", bonusMalus: "<=7", lossRatio: "չընտրել",
  paymentMethod: "Միանվագ", trafficRules: "չներառել", theftCoverage: "ներառել", theftExclusionPercent: 0,
  territory: "Միայն ՀՀ", electricVehicle: false, brokerCommissionPercent: 10, profitPercent: 10,
};

const cases: Array<{ name: string; patch: Partial<CascoInsuranceData>; tariff: number; premium: number }> = [
  { name: "2024 ՖԱ / 10մլն / BM<=7", patch: {}, tariff: 0.01995232277213443, premium: 200000 },
  { name: "2018 Իրավաբանական / 5մլն / BM11-12", patch: { manufactureYear: 2018, policyholderType: "Իրավաբանական անձ", marketValue: 5_000_000, bonusMalus: "11-12", paymentMethod: "4 վճարում", territory: "ՀՀ և Վրաստան", electricVehicle: true, driverCountOption: "Սահմանափակ", isUnlimitedDrivers: false, franchiseOption: "Ֆրանշիզայի կիսում", theftCoverage: "ներառել միայն մանր դետալները" }, tariff: 0.02489492293470737, premium: 124000 },
  { name: "2008 լիզինգ / 6մլն / BM13-14", patch: { manufactureYear: 2008, policyholderType: "բանկային լիզինգ", marketValue: 6_000_000, bonusMalus: "13-14", paymentMethod: "12 վճարում", territory: "ՀՀ, Վրաստան և ԱՊՀ երկրներ", franchiseOption: "Մինիմալ ֆրանշիզա", theftCoverage: "չներառել", theftExclusionPercent: 0.3 }, tariff: 0.03579805126819965, premium: 215000 },
];

export function runCascoRegression() {
  return cases.map(c => {
    const result = calculateCascoFromExcel({ ...base, ...c.patch });
    const tariffOk = Math.abs(result.finalTariff - c.tariff) < 1e-12;
    const premiumOk = result.annualPremium === c.premium;
    return { ...c, pass: result.valid && tariffOk && premiumOk, actualTariff: result.finalTariff, actualPremium: result.annualPremium, errors: result.errors };
  });
}
