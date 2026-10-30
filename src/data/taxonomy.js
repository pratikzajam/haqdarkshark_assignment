/**
 * Approved Taxonomy Definitions for Government Scheme Extraction
 * 
 * Strict rule: Never silently expand the approved taxonomy.
 * Unknown concepts extracted from messy text must trigger taxonomy proposals.
 */

export const APPROVED_CONCEPTS = new Set([
  'age',
  'income',
  'social_category',
  'state'
]);

export const APPROVED_BENEFIT_CATEGORIES = new Set([
  'education',
  'housing',
  'healthcare',
  'employment',
  'financial_assistance'
]);

export const SUPPORTED_OPERATORS = new Set([
  '=',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'BETWEEN',
  'IN'
]);

export const BENEFIT_TYPES = new Set([
  'financial_assistance',
  'subsidy',
  'grant',
  'scholarship',
  'pension',
  'allowance',
  'loan',
  'insurance_coverage',
  'in_kind'
]);

export const FREQUENCIES = new Set([
  'monthly',
  'yearly',
  'quarterly',
  'half_yearly',
  'one-time'
]);

// Dynamically approved concepts that have been approved via governance
const dynamicallyApprovedConcepts = new Map();

/**
 * Check if a concept is part of the approved taxonomy
 * @param {string} concept
 * @returns {boolean}
 */
export function isApprovedConcept(concept) {
  if (!concept || typeof concept !== 'string') return false;
  const normalized = concept.trim().toLowerCase();
  return APPROVED_CONCEPTS.has(normalized) || dynamicallyApprovedConcepts.has(normalized);
}

/**
 * Check if a benefit category is approved
 * @param {string} category
 * @returns {boolean}
 */
export function isApprovedBenefitCategory(category) {
  if (!category || typeof category !== 'string') return false;
  return APPROVED_BENEFIT_CATEGORIES.has(category.trim().toLowerCase());
}

/**
 * Check if an operator is supported
 * @param {string} operator
 * @returns {boolean}
 */
export function isSupportedOperator(operator) {
  if (!operator || typeof operator !== 'string') return false;
  return SUPPORTED_OPERATORS.has(operator.trim().toUpperCase());
}

/**
 * Get current snapshot of approved taxonomy
 */
export function getApprovedTaxonomy() {
  const dynamicList = Array.from(dynamicallyApprovedConcepts.keys());
  return {
    concepts: [...Array.from(APPROVED_CONCEPTS), ...dynamicList],
    benefitCategories: Array.from(APPROVED_BENEFIT_CATEGORIES),
    benefitTypes: Array.from(BENEFIT_TYPES),
    operators: Array.from(SUPPORTED_OPERATORS),
    frequencies: Array.from(FREQUENCIES)
  };
}

/**
 * Add a newly approved concept via governance
 * @param {string} concept
 * @param {object} metadata
 */
export function addApprovedConcept(concept, metadata = {}) {
  if (!concept) return false;
  const normalized = concept.trim().toLowerCase();
  dynamicallyApprovedConcepts.set(normalized, {
    approvedAt: new Date().toISOString(),
    ...metadata
  });
  return true;
}

/**
 * Reset dynamic concepts (useful for tests)
 */
export function resetDynamicTaxonomy() {
  dynamicallyApprovedConcepts.clear();
}
