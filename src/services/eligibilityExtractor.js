import { isApprovedConcept } from '../data/taxonomy.js';
import { extractAmountAndCurrency } from './numberParser.js';

// Common Indian states for extraction
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

/**
 * Extract age conditions from text
 * Distinguishes:
 * - BETWEEN: "between 18 and 35"
 * - >: "above 21 years", "greater than"
 * - >=: "at least 60 years", "60 years and above", "minimum 18 years"
 * - <: "under 25 years", "below 30 years"
 * - <=: "up to 35 years", "not exceeding 40 years", "maximum 35 years"
 * @param {string} text
 * @returns {Array<object>}
 */
export function extractAgeConditions(text) {
  const conditions = [];

  // 1. BETWEEN: "aged between 18 and 35 years"
  const betweenMatch = text.match(/(?:age(?:d)?\s*(?:is\s*)?between|between)\s*([0-9]{1,2})\s*(?:and|to)\s*([0-9]{1,2})\s*years?/i);
  if (betweenMatch) {
    const min = parseInt(betweenMatch[1], 10);
    const max = parseInt(betweenMatch[2], 10);
    conditions.push({
      concept: 'age',
      operator: 'BETWEEN',
      value: [min, max],
      evidence: betweenMatch[0],
      isApprovedConcept: true
    });
    return conditions;
  }

  // 2. >= at least / minimum / X years and above
  const atLeastMatch = text.match(/(?:at\s*least|minimum\s*age\s*(?:of)?|min\.?)\s*([0-9]{1,2})\s*years?/i)
    || text.match(/([0-9]{1,2})\s*years?\s*and\s*above/i)
    || text.match(/aged?\s*(?:of\s*)?at\s*least\s*([0-9]{1,2})/i);
  if (atLeastMatch) {
    conditions.push({
      concept: 'age',
      operator: '>=',
      value: parseInt(atLeastMatch[1], 10),
      evidence: atLeastMatch[0],
      isApprovedConcept: true
    });
  }

  // 3. > above / greater than
  const aboveMatch = text.match(/(?:aged?\s*)?(?:above|greater\s*than|older\s*than)\s*([0-9]{1,2})\s*years?/i);
  if (aboveMatch) {
    conditions.push({
      concept: 'age',
      operator: '>',
      value: parseInt(aboveMatch[1], 10),
      evidence: aboveMatch[0],
      isApprovedConcept: true
    });
  }

  // 4. < under / below / less than
  const underMatch = text.match(/(?:aged?\s*)?(?:under|below|less\s*than)\s*([0-9]{1,2})\s*years?/i);
  if (underMatch) {
    conditions.push({
      concept: 'age',
      operator: '<',
      value: parseInt(underMatch[1], 10),
      evidence: underMatch[0],
      isApprovedConcept: true
    });
  }

  // 5. <= not exceeding / up to / maximum
  const notExceedingMatch = text.match(/(?:aged?\s*)?(?:not\s*exceeding|up\s*to|maximum\s*(?:age\s*)?(?:of)?)\s*([0-9]{1,2})\s*years?/i);
  if (notExceedingMatch) {
    conditions.push({
      concept: 'age',
      operator: '<=',
      value: parseInt(notExceedingMatch[1], 10),
      evidence: notExceedingMatch[0],
      isApprovedConcept: true
    });
  }

  return conditions;
}

/**
 * Extract income conditions from text
 * Distinguishes:
 * - <: "income under ₹2.5 lakh", "income below 200000"
 * - <=: "income does not exceed Rs. 3 lakhs", "not exceeding 1.5 lakhs", "up to ₹2 lakh"
 * - >: "income must exceed ₹5,00,000", "income above 5 lakh"
 * - >=: "income at least 1 lakh"
 * @param {string} text
 * @returns {Array<object>}
 */
export function extractIncomeConditions(text) {
  const conditions = [];

  // Income clause regexes
  // Match not exceeding / does not exceed / up to / maximum
  const notExceedingRegex = /(?:income\s*)?(?:does\s*not\s*exceed|not\s*exceeding|up\s*to|maximum\s*income\s*of)\s*([₹\s0-9.,a-zA-Z/-]+?(?:lakhs?|crores?|[0-9]{3,}))/gi;
  let match;
  while ((match = notExceedingRegex.exec(text)) !== null) {
    const rawVal = match[1];
    const { amount } = extractAmountAndCurrency(rawVal);
    if (amount !== null) {
      conditions.push({
        concept: 'income',
        operator: '<=',
        value: amount,
        evidence: match[0].trim(),
        isApprovedConcept: true
      });
    }
  }

  // Match under / below / less than
  const underRegex = /(?:income\s*)?(?:under|below|less\s*than)\s*([₹\s0-9.,a-zA-Z/-]+?(?:lakhs?|crores?|[0-9]{3,}))/gi;
  while ((match = underRegex.exec(text)) !== null) {
    // Avoid double matching if preceded by does not exceed
    const preceding = text.substring(Math.max(0, match.index - 15), match.index);
    if (/exceed|not/i.test(preceding)) continue;

    const rawVal = match[1];
    const { amount } = extractAmountAndCurrency(rawVal);
    if (amount !== null) {
      conditions.push({
        concept: 'income',
        operator: '<',
        value: amount,
        evidence: match[0].trim(),
        isApprovedConcept: true
      });
    }
  }

  // Match above / exceeds / greater than / more than
  const aboveRegex = /(?:income\s*)?(?:must\s*exceed|above|greater\s*than|more\s*than)\s*([₹\s0-9.,a-zA-Z/-]+?(?:lakhs?|crores?|[0-9]{3,}))/gi;
  while ((match = aboveRegex.exec(text)) !== null) {
    const preceding = text.substring(Math.max(0, match.index - 10), match.index);
    if (/not|does not/i.test(preceding)) continue;

    const rawVal = match[1];
    const { amount } = extractAmountAndCurrency(rawVal);
    if (amount !== null) {
      conditions.push({
        concept: 'income',
        operator: '>',
        value: amount,
        evidence: match[0].trim(),
        isApprovedConcept: true
      });
    }
  }

  return conditions;
}

/**
 * Extract social category conditions (SC, ST, OBC, General)
 * @param {string} text
 * @returns {Array<object>}
 */
export function extractSocialCategoryConditions(text) {
  const conditions = [];

  // Check SC, ST or OBC combinations
  if (/\bSC[,\s/]+ST[,\s/]+(?:or\s+)?OBC\b/i.test(text) || /\bSC\s*,\s*ST\s*or\s*OBC\b/i.test(text)) {
    conditions.push({
      concept: 'social_category',
      operator: 'IN',
      value: ['SC', 'ST', 'OBC'],
      evidence: 'SC, ST or OBC',
      isApprovedConcept: true
    });
    return conditions;
  }

  // Check SC/ST or SC and ST
  if (/\bSC\s*[/,&]\s*ST\b/i.test(text) || /\bSC\s*and\s*ST\b/i.test(text)) {
    conditions.push({
      concept: 'social_category',
      operator: 'IN',
      value: ['SC', 'ST'],
      evidence: 'SC/ST',
      isApprovedConcept: true
    });
    return conditions;
  }

  // Individual categories
  const categories = [];
  if (/\bOBC\b/i.test(text)) categories.push('OBC');
  if (/\bST\b/i.test(text) && !/\bSC\s*[/,&]\s*ST\b/i.test(text)) categories.push('ST');
  if (/\bSC\b/i.test(text) && !/\bSC\s*[/,&]\s*ST\b/i.test(text)) categories.push('SC');
  if (/\bGeneral\b/i.test(text)) categories.push('General');

  if (categories.length > 0) {
    conditions.push({
      concept: 'social_category',
      operator: categories.length === 1 ? '=' : 'IN',
      value: categories.length === 1 ? categories[0] : categories,
      evidence: categories.join(', '),
      isApprovedConcept: true
    });
  }

  return conditions;
}

/**
 * Extract Indian state conditions
 * @param {string} text
 * @returns {Array<object>}
 */
export function extractStateConditions(text) {
  const conditions = [];
  const foundStates = [];

  for (const state of INDIAN_STATES) {
    const regex = new RegExp(`\\b${state}\\b`, 'i');
    if (regex.test(text)) {
      foundStates.push(state);
    }
  }

  if (foundStates.length === 1) {
    conditions.push({
      concept: 'state',
      operator: '=',
      value: foundStates[0],
      evidence: foundStates[0],
      isApprovedConcept: true
    });
  } else if (foundStates.length > 1) {
    // Check if states are joined with OR (e.g. Jharkhand or Odisha)
    const orRegex = new RegExp(foundStates.join('\\s*or\\s*'), 'i');
    const isOr = orRegex.test(text) || /\bor\b/i.test(text);
    conditions.push({
      concept: 'state',
      operator: 'IN',
      value: foundStates,
      evidence: foundStates.join(isOr ? ' or ' : ', '),
      isApprovedConcept: true
    });
  }

  return conditions;
}

/**
 * Scan for concepts that are NOT in the approved taxonomy
 * @param {string} text
 * @returns {Array<{ concept: string, evidence: string, reason: string }>}
 */
export function detectUnknownConcepts(text) {
  const unknownList = [];
  const lower = text.toLowerCase();

  if (/disabilit(?:y|ies)|divyang/i.test(lower)) {
    unknownList.push({
      concept: 'disability',
      evidence: text.match(/disabilit(?:y|ies)|divyang/i)?.[0] || 'disability',
      reason: 'Physical or mental disability criteria extracted from text'
    });
  }

  if (/\bwomen\b|\bfemale\b|\bmahila\b|\bgirl child\b/i.test(lower)) {
    unknownList.push({
      concept: 'gender',
      evidence: text.match(/\b(?:women|female|mahila|girl child)\b/i)?.[0] || 'gender',
      reason: 'Gender criteria extracted from eligibility text'
    });
  }

  if (/(?:for\s*at\s*least|resident\s*for)\s*[0-9a-z]+\s*years/i.test(lower)) {
    const match = text.match(/(?:for\s*at\s*least|resident\s*for)\s*([0-9a-z]+)\s*years/i);
    unknownList.push({
      concept: 'residence_years',
      evidence: match?.[0] || 'residence period',
      reason: 'Duration of state residency criteria'
    });
  }

  if (/economically\s*weaker|bpl|ews|ration\s*card/i.test(lower)) {
    unknownList.push({
      concept: 'economic_status',
      evidence: text.match(/economically\s*weaker|bpl|ews|ration\s*card/i)?.[0] || 'economic status',
      reason: 'Economic categorization (EWS/BPL) criteria'
    });
  }

  if (/cultivable\s*land|hectares?|acres?/i.test(lower)) {
    unknownList.push({
      concept: 'land_holding',
      evidence: text.match(/(?:cultivable\s*land|land\s*holding|up\s*to\s*[0-9.]+\s*hectares?)/i)?.[0] || 'land holding',
      reason: 'Agricultural land holding area criteria'
    });
  }

  if (/10th\s*grade|matric|intermediate|graduate|degree/i.test(lower)) {
    unknownList.push({
      concept: 'educational_qualification',
      evidence: text.match(/(?:10th\s*grade|matric|intermediate|graduate|degree)/i)?.[0] || 'educational qualification',
      reason: 'Educational qualification prerequisite'
    });
  }

  // Filter out any concept that might already be in dynamic approved taxonomy
  return unknownList.filter((item) => !isApprovedConcept(item.concept));
}

/**
 * Check for logical contradictions in conditions
 * (e.g. age > 60 and age < 25, or income > 500000 and income <= 200000)
 * @param {Array<object>} conditions
 * @returns {Array<string>} list of contradiction descriptions
 */
export function detectContradictions(conditions) {
  const contradictions = [];

  // Check age contradiction
  const ageGreaterThan = conditions.find(c => c.concept === 'age' && (c.operator === '>' || c.operator === '>='));
  const ageLessThan = conditions.find(c => c.concept === 'age' && (c.operator === '<' || c.operator === '<='));

  if (ageGreaterThan && ageLessThan) {
    const minAge = ageGreaterThan.value;
    const maxAge = ageLessThan.value;
    if (minAge > maxAge) {
      contradictions.push(
        `Contradictory age criteria: Requires age ${ageGreaterThan.operator} ${minAge} and ${ageLessThan.operator} ${maxAge}, which cannot be satisfied simultaneously.`
      );
    }
  }

  // Check income contradiction
  const incGreaterThan = conditions.find(c => c.concept === 'income' && (c.operator === '>' || c.operator === '>='));
  const incLessThan = conditions.find(c => c.concept === 'income' && (c.operator === '<' || c.operator === '<='));

  if (incGreaterThan && incLessThan) {
    const minInc = incGreaterThan.value;
    const maxInc = incLessThan.value;
    if (minInc > maxInc) {
      contradictions.push(
        `Contradictory income criteria: Requires income ${incGreaterThan.operator} ${minInc} and ${incLessThan.operator} ${maxInc}, which cannot be satisfied simultaneously.`
      );
    }
  }

  return contradictions;
}

/**
 * Build logical expression tree, supporting nested AND / OR without flattening
 * @param {Array<object>} conditions
 * @param {string} text
 * @returns {object} Logical expression tree
 */
export function buildLogicalExpression(conditions, text) {
  if (!conditions || conditions.length === 0) {
    return { operator: 'AND', conditions: [] };
  }

  // Check for nested OR patterns, e.g. "either (SC/ST with income under 2.5 lakh) OR (OBC with income under 1.5 lakh)"
  const eitherOrMatch = text.match(/either\s*\((.*?)\)\s*or\s*\((.*?)\)/i)
    || text.match(/either\s*(.*?)\s*or\s*(.*?)(?:and\s+aged|\.|$)/i);

  if (eitherOrMatch) {
    const branch1Text = eitherOrMatch[1];
    const branch2Text = eitherOrMatch[2];

    const branch1Conditions = [
      ...extractSocialCategoryConditions(branch1Text),
      ...extractIncomeConditions(branch1Text),
      ...extractAgeConditions(branch1Text)
    ];

    const branch2Conditions = [
      ...extractSocialCategoryConditions(branch2Text),
      ...extractIncomeConditions(branch2Text),
      ...extractAgeConditions(branch2Text)
    ];

    if (branch1Conditions.length > 0 && branch2Conditions.length > 0) {
      // Common conditions outside the either/or branch (e.g. State, Age)
      const branch1Evidence = branch1Conditions.map(c => c.evidence.toLowerCase());
      const branch2Evidence = branch2Conditions.map(c => c.evidence.toLowerCase());

      const topLevelConditions = conditions.filter(c => {
        const ev = (c.evidence || '').toLowerCase();
        return !branch1Evidence.some(b => ev.includes(b)) && !branch2Evidence.some(b => ev.includes(b));
      });

      return {
        operator: 'AND',
        conditions: topLevelConditions,
        expressions: [
          {
            operator: 'OR',
            expressions: [
              {
                operator: 'AND',
                conditions: branch1Conditions
              },
              {
                operator: 'AND',
                conditions: branch2Conditions
              }
            ]
          }
        ]
      };
    }
  }

  // Default expression
  return {
    operator: 'AND',
    conditions
  };
}

/**
 * Deterministic rule-based extraction for eligibility text
 * @param {string} originalText
 * @returns {object}
 */
export function extractEligibilityRules(originalText) {
  if (!originalText || typeof originalText !== 'string' || !originalText.trim()) {
    return {
      conditions: [],
      logicalExpression: { operator: 'AND', conditions: [] },
      originalText: originalText || '',
      extractionMethod: 'rule_based',
      confidence: 0,
      unknownConcepts: [],
      contradictions: []
    };
  }

  const ageConds = extractAgeConditions(originalText);
  const incomeConds = extractIncomeConditions(originalText);
  const socialConds = extractSocialCategoryConditions(originalText);
  const stateConds = extractStateConditions(originalText);

  const conditions = [
    ...socialConds,
    ...incomeConds,
    ...ageConds,
    ...stateConds
  ];

  const unknownConceptItems = detectUnknownConcepts(originalText);
  const contradictions = detectContradictions(conditions);
  const logicalExpression = buildLogicalExpression(conditions, originalText);

  const confidence = contradictions.length > 0 ? 0.5 : (conditions.length > 0 ? 0.9 : 0.4);

  return {
    conditions,
    logicalExpression,
    originalText,
    extractionMethod: 'rule_based',
    confidence,
    unknownConcepts: unknownConceptItems,
    contradictions
  };
}
