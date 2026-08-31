import { FIXED_QUOTATION_RULES, FixedProductRule } from "../data/quotationRules";
import { InsuranceProductType } from "../types";
import { addAuditEvent, getRulesVersion } from "./auditStore";

const ACTIVE_KEY = "sil-quotation-rules-active-v3";
const DRAFT_KEY = "sil-quotation-rules-draft-v3";
const SITE_KEY = "sil-site-content-v1";

function clone<T>(value: T): T {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function getQuotationRules(): Record<InsuranceProductType, FixedProductRule> {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return clone(FIXED_QUOTATION_RULES);
}

export function getDraftQuotationRules(): Record<InsuranceProductType, FixedProductRule> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return clone(getQuotationRules());
}

/** Save only to TEST/DRAFT. Published production rules are not changed. */
export function saveQuotationRules(rules: Record<InsuranceProductType, FixedProductRule>) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(rules));
  addAuditEvent({ action: "rules.draft.save", entity: "quotation-rules", details: { version: getRulesVersion() } });
  window.dispatchEvent(new CustomEvent("sil_rules_draft_updated", { detail: rules }));
}

export function publishQuotationRules(rules: Record<InsuranceProductType, FixedProductRule>) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(rules));
  localStorage.setItem(DRAFT_KEY, JSON.stringify(rules));
  addAuditEvent({ action: "rules.production.publish", entity: "quotation-rules", details: { version: getRulesVersion() } });
  window.dispatchEvent(new CustomEvent("sil_rules_updated", { detail: rules }));
}

export function resetQuotationRules() {
  const rules = clone(FIXED_QUOTATION_RULES);
  saveQuotationRules(rules);
  return rules;
}

export function getSiteContent() {
  const defaults = {
    slogan: "Ազատ լինելն ապահով է",
    heroTitle: "Ազատ լինելն ապահով է",
    heroText: "Մենք կառավարում ենք ռիսկերը, դուք՝ ձեր նախագիծը։ Մուտքագրեք հաճախորդի տվյալները, համեմատեք գործող պայմանների հետ և ստացեք գնառաջարկ։",
    phone: "+374 60 54 00 00",
    phone2: "+374 10 58 00 00",
    email: "info@silinsurance.am",
    address: "ՀՀ, ք. Երևան, Արամի 3 և 5",
    officialSite: "https://silinsurance.am/",
  };
  try { return { ...defaults, ...(JSON.parse(localStorage.getItem(SITE_KEY) || "{}")) }; } catch { return defaults; }
}

export function saveSiteContent(content: ReturnType<typeof getSiteContent>) {
  localStorage.setItem(SITE_KEY, JSON.stringify(content));
  addAuditEvent({ action: "site-content.save", entity: "site-content", details: { version: getRulesVersion() } });
  window.dispatchEvent(new CustomEvent("sil_site_content_updated", { detail: content }));
}
