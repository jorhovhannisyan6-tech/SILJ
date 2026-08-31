import { InsuranceProductType, QuotationProposal } from "../types";
import { QuoteCheck, QuoteInput } from "../data/quotationRules";
import { getQuotationRules } from "./rulesStore";
import { generateQuotationNumber } from "./insuranceCalculator";

export type QuoteDecision = "approved" | "manual_review" | "rejected";

export type QuoteEngineResult = {
  eligible: boolean;
  decision: QuoteDecision;
  checks: QuoteCheck[];
  proposal: QuotationProposal | null;
  reasons: string[];
};

function normalize(text: string) {
  return text.trim().toLocaleLowerCase("hy-AM");
}

export function evaluateQuoteInput(input: QuoteInput): QuoteEngineResult {
  const rule = getQuotationRules()[input.product];
  const checks: QuoteCheck[] = [];

  checks.push({
    label: "Տվյալների ամբողջականություն",
    passed: Boolean(input.clientName.trim() && input.phone.trim() && input.businessActivity.trim() && input.objectDescription.trim() && input.insuredAmount > 0),
    message: input.clientName.trim() && input.phone.trim() && input.businessActivity.trim() && input.objectDescription.trim() && input.insuredAmount > 0
      ? "Պարտադիր տվյալները լրացված են։"
      : "Լրացրեք ապահովադրի անունը, հեռախոսը, գործունեությունը, օբյեկտի նկարագրությունը և ապահովագրական գումարը։",
  });

  const allowedCurrencies = rule.allowedCurrencies ?? ["AMD", "USD", "EUR"];
  checks.push({
    label: "Արժույթի համապատասխանություն",
    passed: allowedCurrencies.includes(input.currency),
    message: allowedCurrencies.includes(input.currency)
      ? "Ընտրված արժույթը թույլատրելի է։"
      : `Թույլատրելի արժույթներ՝ ${allowedCurrencies.join(", ")}`,
  });

  const franchiseValid = (rule.minFranchisePercent === undefined || input.franchisePercent >= rule.minFranchisePercent) &&
    (rule.maxFranchisePercent === undefined || input.franchisePercent <= rule.maxFranchisePercent);
  checks.push({
    label: "Ֆրանշիզայի համապատասխանություն",
    passed: franchiseValid,
    message: franchiseValid
      ? "Ֆրանշիզան համապատասխանում է սահմանված միջակայքին։"
      : `Թույլատրելի ֆրանշիզա՝ ${rule.minFranchisePercent ?? 0}%–${rule.maxFranchisePercent ?? "անսահմանափակ"}%։`,
  });

  checks.push({
    label: "Ապահովագրության գումար",
    passed: input.insuredAmount >= rule.minInsuredAmount && (!rule.maxInsuredAmount || input.insuredAmount <= rule.maxInsuredAmount),
    message: input.insuredAmount < rule.minInsuredAmount
      ? `Նվազագույն ապահովագրական գումարը ${rule.minInsuredAmount.toLocaleString()} է։`
      : rule.maxInsuredAmount && input.insuredAmount > rule.maxInsuredAmount
        ? `Առավելագույն ապահովագրական գումարը ${rule.maxInsuredAmount.toLocaleString()} է։`
        : "Համապատասխանում է սահմանված գումարի միջակայքին։",
  });

  const activity = normalize(input.businessActivity);
  const excludedActivity = rule.excludedActivities.find((item) => activity.includes(normalize(item)));
  checks.push({
    label: "Գործունեության համապատասխանություն",
    passed: !excludedActivity,
    message: excludedActivity
      ? `Տվյալ գործունեությունը բացառված է՝ ${excludedActivity}`
      : "Բացառող պայման չի հայտնաբերվել։",
  });


  const allowedRisks = rule.availableRisks ?? rule.requiredRisks;
  const invalidRisks = input.selectedRisks.filter((risk) => !allowedRisks.some((allowed) => normalize(allowed) === normalize(risk)));
  checks.push({
    label: "Ընտրված ռիսկերի համապատասխանություն",
    passed: invalidRisks.length === 0,
    message: invalidRisks.length ? `Չթույլատրելի ռիսկ՝ ${invalidRisks.join(", ")}` : "Բոլոր ընտրված ռիսկերը թույլատրելի են։",
  });

  const missingRisks = rule.requiredRisks.filter(
    (risk) => !input.selectedRisks.some((selected) => normalize(selected) === normalize(risk))
  );
  checks.push({
    label: "Պարտադիր ռիսկեր",
    passed: missingRisks.length === 0,
    message: missingRisks.length ? `Բացակայում է՝ ${missingRisks.join(", ")}` : "Պարտադիր ռիսկերը ներառված են։",
  });

  const lossAllowed = rule.previousLossesAllowed !== false || !input.previousLosses;
  checks.push({
    label: "Նախկին վնասների ստուգում",
    passed: lossAllowed,
    message: lossAllowed
      ? (input.previousLosses && rule.manualReviewOnPreviousLosses ? "Նախկին վնաս կա․ վերջնական հաստատումից առաջ անհրաժեշտ է ձեռքով ստուգում։" : "Խնդիրը չի հակասում տվյալ կանոնին։")
      : "Նախկին ապահովագրական վնասների առկայությունը տվյալ պրոդուկտի համար չի թույլատրվում։",
  });

  const reasons = checks.filter((check) => !check.passed).map((check) => check.message);
  const eligible = reasons.length === 0;
  const manualReview = eligible && Boolean(input.previousLosses && rule.manualReviewOnPreviousLosses);
  const decision: QuoteDecision = !eligible ? "rejected" : manualReview ? "manual_review" : "approved";

  if (!eligible) {
    return { eligible, decision, checks, proposal: null, reasons };
  }

  const requestedTariff = input.customTariff ?? rule.defaultTariff;
  const tariffInRange = requestedTariff >= rule.minTariff && requestedTariff <= rule.maxTariff;
  if (!tariffInRange) {
    checks.push({
      label: "Սակագնի համապատասխանություն",
      passed: false,
      message: `Սակագինը պետք է լինի ${rule.minTariff}%–${rule.maxTariff}% միջակայքում։`,
    });
    return { eligible: false, decision: "rejected", checks, proposal: null, reasons: checks.filter((c) => !c.passed).map((c) => c.message) };
  }
  checks.push({ label: "Սակագնի համապատասխանություն", passed: true, message: `Սակագինը ${requestedTariff}% է և գտնվում է թույլատրելի միջակայքում։` });
  const riskAdjustment = input.selectedRisks.reduce((sum, risk) => sum + Number(rule.riskTariffAdjustments?.[risk] ?? 0), 0);
  const tariff = requestedTariff + riskAdjustment;
  const finalTariff = Math.min(rule.maxTariff, Math.max(rule.minTariff, tariff));
  const premium = (input.insuredAmount * finalTariff) / 100;
  const franchiseAmount = (input.insuredAmount * input.franchisePercent) / 100;
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(today.getDate() + 30);

  const proposal: QuotationProposal = {
    id: `auto-${Date.now()}`,
    quotationNumber: generateQuotationNumber(input.product),
    type: input.product,
    productNameArm: rule.nameArm,
    categoryNameArm: "Ավտոմատ հաշվարկված գնառաջարկ",
    date: today.toLocaleDateString("hy-AM"),
    validUntil: validUntil.toLocaleDateString("hy-AM"),
    clientName: input.clientName || "Ապահովադիր",
    contactInfo: `Հեռ․՝ ${input.phone || "—"}`,
    objectDescription: input.objectDescription || "Տվյալները մուտքագրվել են արագ գնառաջարկի ձևով։",
    totalSumInsured: input.insuredAmount,
    currency: input.currency,
    baseTariff: requestedTariff,
    discountBonus: 0,
    finalTariff,
    annualPremium: premium,
    franchiseDescription: `${input.franchisePercent}% ապահովագրական գումարից`,
    franchiseAmount,
    paymentTerms: "Համաձայն պայմանագրի",
    beneficiaryDetails: "Շահառու՝ ըստ ապահովագրական պայմանագրի",
    coveredPerilsList: input.selectedRisks.length ? input.selectedRisks : ["Ըստ հաստատված ապահովագրական պայմանների"],
    specialConditions: [
      `Գնառաջարկը ստեղծվել է ֆիքսված անդերրայթինգային կանոնների ավտոմատ համեմատության հիման վրա։ Սակագին՝ ${requestedTariff}%, ռիսկերի ճշգրտում՝ ${riskAdjustment.toFixed(2)} տոկոսային կետ։`,
      "Վերջնական պայմանագիրը ենթակա է փաստաթղթերի ստուգման և հաստատման։",
    ],
    aiAnalysisText: undefined,
    agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ",
    agentTitle: "Ավտոմատ գնառաջարկի համակարգ",
    agentPhone: "+374 (10) 58-00-00 / 81-00",
    agentEmail: "info@silinsurance.am",
  };

  return { eligible, decision, checks, proposal, reasons };
}
