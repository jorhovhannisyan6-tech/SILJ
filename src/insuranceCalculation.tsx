import { PropertyInsuranceFormState } from "./types";

export function calculatePropertyInsurance(
  data: PropertyInsuranceFormState
) {
  const totalSumInsured =
    (data.values.buildingValue || 0) +
    (data.values.interiorValue || 0) +
    (data.values.machineryValue || 0) +
    (data.values.equipmentValue || 0) +
    (data.values.stockValue || 0) +
    (data.values.glassValue || 0) +
    (data.values.signsValue || 0);

  // Սակագինը ԴՈՒ ես սահմանում
  const tariffPercent = Number(data.customTariff || 0);

  // 0.18 նշանակում է 0.18%
  const annualPremium =
    totalSumInsured * (tariffPercent / 100);

  return {
    totalSumInsured,
    tariffPercent,
    annualPremium,
    franchisePercent: Number(data.customFranchise || 0),
    paymentSchedule: data.paymentSchedule,
  };
}