import { QuotationProposal } from "../types";

export type ValidationSeverity = "error" | "warning";
export type ValidationIssue = { severity: ValidationSeverity; field: string; message: string };

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateQuotationProposal(proposal: QuotationProposal): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!proposal.clientName?.trim()) issues.push({ severity: "error", field: "clientName", message: "Հաճախորդի անունը պարտադիր է։" });
  if (!proposal.productNameArm?.trim()) issues.push({ severity: "error", field: "product", message: "Ապահովագրական պրոդուկտը պարտադիր է։" });
  if (!Number.isFinite(proposal.totalSumInsured) || proposal.totalSumInsured <= 0) issues.push({ severity: "error", field: "sumInsured", message: "Ապահովագրական գումարը պետք է լինի 0-ից մեծ։" });
  if (!Number.isFinite(proposal.annualPremium) || proposal.annualPremium < 0) issues.push({ severity: "error", field: "premium", message: "Ապահովագրավճարը անվավեր է։" });
  if (proposal.finalTariff < 0) issues.push({ severity: "error", field: "tariff", message: "Սակագինը չի կարող բացասական լինել։" });
  if (!proposal.validUntil) issues.push({ severity: "warning", field: "validUntil", message: "Գնառաջարկի գործողության ժամկետը նշված չէ։" });
  if (proposal.contactInfo && proposal.contactInfo.includes("@") && !emailRe.test(proposal.contactInfo.match(/[^\s|]+@[^\s|]+/)?.[0] || "")) {
    issues.push({ severity: "warning", field: "contact", message: "Էլ․ փոստի ձևաչափը կարող է սխալ լինել։" });
  }
  if (!proposal.coveredPerilsList?.length) issues.push({ severity: "warning", field: "risks", message: "Ծածկույթների ցանկը դատարկ է։" });
  if (proposal.underwriting?.status === "rejected") issues.push({ severity: "error", field: "underwriting", message: "Underwriting-ի ստուգմամբ հայտը մերժված է։" });
  return issues;
}

export function assertQuotationReady(proposal: QuotationProposal) {
  const issues = validateQuotationProposal(proposal);
  const errors = issues.filter(i => i.severity === "error");
  if (errors.length) throw new Error(errors.map(e => e.message).join("\n"));
  return issues;
}
