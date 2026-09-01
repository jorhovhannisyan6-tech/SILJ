import { QuotationProposal, QuoteStatus } from '../types';

export interface UnderwritingCheckResult {
  requiresUnderwriter: boolean;
  status: QuoteStatus;
  riskScore: number; // 0 - 100
  triggerReasons: string[];
  maxAgentDiscountAllowed: number;
}

export function evaluateUnderwritingRules(proposal: QuotationProposal): UnderwritingCheckResult {
  const triggerReasons: string[] = [];
  let riskScore = 15; // baseline low risk
  let requiresUnderwriter = false;

  // Rule 1: High Sum Insured thresholds by product
  if (proposal.type === 'casco') {
    if (proposal.totalSumInsured > 20000000) { // > 20M AMD
      requiresUnderwriter = true;
      triggerReasons.push('Ավտոմեքենայի շուկայական արժեքը գերազանցում է 20,000,000 ՀՀ դրամը:');
      riskScore += 35;
    }
    const year = Number(proposal.productSpecificDetails?.manufactureYear || proposal.productSpecificDetails?.year || 2022);
    if (year < 2014) {
      requiresUnderwriter = true;
      triggerReasons.push(`Ավտոմեքենայի տարեթիվը (${year}) 10 տարուց հին է:`);
      riskScore += 25;
    }
    if (proposal.productSpecificDetails?.lossRatio?.includes('>=  90%')) {
      requiresUnderwriter = true;
      triggerReasons.push('Նախորդ տարիների վնասաբերությունը >= 90% է:');
      riskScore += 40;
    }
  } else if (proposal.type === 'property' || proposal.type === 'mortgage') {
    if (proposal.totalSumInsured > 50000000) { // > 50M AMD
      requiresUnderwriter = true;
      triggerReasons.push('Գույքի ապահովագրական գումարը գերազանցում է 50,000,000 ՀՀ դրամը:');
      riskScore += 30;
    }
  } else if (proposal.type === 'cargo' || proposal.type === 'construction') {
    if (proposal.totalSumInsured > 100000000) { // > 100M AMD
      requiresUnderwriter = true;
      triggerReasons.push('Խոշոր ռիսկ. ապահովագրական գումարը գերազանցում է 100,000,000 ՀՀ դրամը:');
      riskScore += 35;
    }
  }

  // Rule 2: High discount requested by agent
  if (proposal.discountBonus > 15) {
    requiresUnderwriter = true;
    triggerReasons.push(`Ագենտի զեղչը (${proposal.discountBonus}%) գերազանցում է թույլատրելի 15% սահմանաչափը:`);
    riskScore += 20;
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(Math.max(riskScore, 5), 98);

  const status: QuoteStatus = requiresUnderwriter
    ? 'pending_underwriter'
    : (proposal.status === 'locked' ? 'locked' : proposal.status || 'ready');

  return {
    requiresUnderwriter,
    status,
    riskScore,
    triggerReasons,
    maxAgentDiscountAllowed: 15,
  };
}
