import {
  extractAmountAndCurrency,
  extractFrequency,
  extractInstalments
} from './numberParser.js';
import { isApprovedBenefitCategory } from '../data/taxonomy.js';

/**
 * Infer benefit category from text keywords
 * @param {string} text
 * @returns {string|null}
 */
export function inferBenefitCategory(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  if (/(?:scholarship|tuition|education|fellowship|school|college|academic)/i.test(lower)) {
    return 'education';
  }
  if (/(?:hous(?:e|ing)|shelter|home construction|flat|pucca house)/i.test(lower)) {
    return 'housing';
  }
  if (/(?:health|medical|hospital|patient|doctor|treatment|illness|disease|medicine)/i.test(lower)) {
    return 'healthcare';
  }
  if (/(?:employ(?:ment|ee)|job|apprentice(?:ship)?|vocational|training|livelihood|worker)/i.test(lower)) {
    return 'employment';
  }
  if (/(?:financial assistance|grant|subsidy|pension|dbt|direct transfer|cash|relief fund|stipend|allowance)/i.test(lower)) {
    return 'financial_assistance';
  }

  return null;
}

/**
 * Infer benefit type (e.g. grant, subsidy, pension, scholarship, loan)
 * @param {string} text
 * @returns {string|null}
 */
export function inferBenefitType(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  if (/grant\b/i.test(lower)) return 'grant';
  if (/subsidy\b/i.test(lower)) return 'subsidy';
  if (/pension\b/i.test(lower)) return 'pension';
  if (/scholarship\b/i.test(lower)) return 'scholarship';
  if (/fellowship\b/i.test(lower)) return 'scholarship';
  if (/stipend|allowance\b/i.test(lower)) return 'allowance';
  if (/loan\b/i.test(lower)) return 'loan';
  if (/financial assistance\b/i.test(lower)) return 'financial_assistance';

  return 'financial_assistance';
}

/**
 * Deterministic rule-based extraction for benefit text
 * @param {string} originalText
 * @returns {{
 *   data: object,
 *   isComplete: boolean,
 *   reviewReasons: string[]
 * }}
 */
export function extractBenefitRules(originalText) {
  if (!originalText || typeof originalText !== 'string' || !originalText.trim()) {
    return {
      data: {
        category: null,
        type: null,
        amount: null,
        currency: null,
        frequency: null,
        instalments: null,
        originalText: originalText || '',
        extractionMethod: 'rule_based',
        confidence: 0
      },
      isComplete: false,
      reviewReasons: ['Benefit text is empty']
    };
  }

  const { amount, currency } = extractAmountAndCurrency(originalText);
  const frequency = extractFrequency(originalText);
  const instalments = extractInstalments(originalText);
  const rawCategory = inferBenefitCategory(originalText);
  const category = isApprovedBenefitCategory(rawCategory) ? rawCategory : null;
  const type = inferBenefitType(originalText);

  const reviewReasons = [];

  // Check if text suggests financial aid but amount is missing
  if (amount === null) {
    if (/(?:benefit|assistance|grant|subsidy|amount|aid|pension|stipend)/i.test(originalText)) {
      reviewReasons.push('Missing or ambiguous benefit amount in description');
    }
  }

  // Check if frequency is missing when instalments or recurrent aid mentioned
  if (frequency === null && instalments !== null) {
    reviewReasons.push('Instalments specified but payment frequency is unclear');
  }

  const isComplete = amount !== null && frequency !== null;
  const confidence = amount !== null && frequency !== null ? 0.95 : (amount !== null ? 0.75 : 0.4);

  return {
    data: {
      category,
      type,
      amount,
      currency: amount !== null ? (currency || 'INR') : null,
      frequency,
      instalments,
      originalText,
      extractionMethod: 'rule_based',
      confidence
    },
    isComplete,
    reviewReasons
  };
}
