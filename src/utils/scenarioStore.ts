import { QuotationProposal } from "../types";

export type QuoteScenario = {
  id: string;
  name: string;
  proposalId: string;
  premium: number;
  tariff: number;
  franchiseAmount: number;
  createdAt: string;
  details: Record<string, unknown>;
};

const KEY = "sil-quote-scenarios-v1";

export function getScenarios(): QuoteScenario[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveScenario(proposal: QuotationProposal, name: string, details: Record<string, unknown> = {}): QuoteScenario {
  const scenario: QuoteScenario = {
    id: `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || `Տարբերակ ${getScenarios().length + 1}`,
    proposalId: proposal.id,
    premium: proposal.annualPremium,
    tariff: proposal.finalTariff,
    franchiseAmount: proposal.franchiseAmount,
    createdAt: new Date().toISOString(),
    details,
  };
  localStorage.setItem(KEY, JSON.stringify([scenario, ...getScenarios()].slice(0, 100)));
  return scenario;
}
