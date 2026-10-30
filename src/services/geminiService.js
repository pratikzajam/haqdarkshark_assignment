import { getGeminiClient, DEFAULT_GEMINI_MODEL } from '../config/gemini.js';
import { benefitExtractionSchema, eligibilityExtractionSchema } from '../validators/schemas.js';
import { getApprovedTaxonomy } from '../data/taxonomy.js';

/**
 * Safely parse JSON text from Gemini output, stripping possible markdown wrappers
 * @param {string} text
 * @returns {any}
 */
export function parseModelJsonResponse(text) {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text.trim();
  // Strip ```json and ``` code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[Gemini Service] Failed to parse model output as JSON:', err.message);
    return null;
  }
}

/**
 * Extract structured benefit data using Gemini API
 * @param {string} benefitText
 * @returns {Promise<object|null>}
 */
export async function extractBenefitWithGemini(benefitText) {
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }

  const taxonomy = getApprovedTaxonomy();

  const prompt = `
You are an expert government scheme data structuring engine.
Analyze the following messy benefit text and convert it into a strict JSON object:

Text: "${benefitText}"

Rules:
1. Category must be one of: ${JSON.stringify(taxonomy.benefitCategories)} or null if unspecified.
2. Type must be one of: ${JSON.stringify(taxonomy.benefitTypes)} or null.
3. Amount must be the numeric value in INR (e.g., 6000, 15000, 250000). Convert lakh (1 lakh = 100,000) and crore accurately. If missing, set to null.
4. Currency must be "INR" or null.
5. Frequency must be one of: ${JSON.stringify(taxonomy.frequencies)} or null if unspecified.
6. Instalments must be an integer count (e.g., 3) or null if unspecified.
7. extractionMethod must be "gemini_ai".
8. confidence must be a number between 0 and 1.
9. Do NOT invent missing data. If not mentioned in the text, use null.

Return ONLY a valid JSON object matching this structure:
{
  "category": "financial_assistance" | null,
  "type": "grant" | null,
  "amount": 15000 | null,
  "currency": "INR" | null,
  "frequency": "one-time" | null,
  "instalments": null,
  "extractionMethod": "gemini_ai",
  "confidence": 0.95
}
`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = parseModelJsonResponse(response.text);
    if (!parsed) return null;

    // Validate with Zod
    const validation = benefitExtractionSchema.safeParse({
      ...parsed,
      originalText: benefitText,
      extractionMethod: 'gemini_ai'
    });

    if (!validation.success) {
      console.warn('[Gemini Service] Gemini benefit response failed Zod validation:', validation.error.message);
      return null;
    }

    return validation.data;
  } catch (error) {
    console.error('[Gemini Service Error] Benefit extraction failed:', error.message);
    return null;
  }
}

/**
 * Extract structured eligibility criteria using Gemini API
 * @param {string} eligibilityText
 * @returns {Promise<object|null>}
 */
export async function extractEligibilityWithGemini(eligibilityText) {
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }

  const taxonomy = getApprovedTaxonomy();

  const prompt = `
You are an expert government scheme eligibility structuring engine.
Analyze the following messy eligibility text and convert it into a structured JSON object:

Text: "${eligibilityText}"

Approved Taxonomy Concepts: ${JSON.stringify(taxonomy.concepts)}
Approved Operators: ${JSON.stringify(taxonomy.operators)}

Rules:
1. Extract conditions for approved concepts: age, income, social_category, state.
2. For operators:
   - "under" or "less than" -> "<"
   - "does not exceed", "not exceeding", "up to", "maximum" -> "<="
   - "above", "older than", "greater than" -> ">"
   - "at least", "minimum", "and above" -> ">="
   - "between X and Y" -> "BETWEEN" with value [X, Y]
   - SC/ST, OBC lists -> "IN" with value array e.g. ["SC", "ST"]
3. If text contains ANY concept NOT in the approved taxonomy list (such as disability, gender/women, residence_years, economic_status/EWS/BPL, land_holding), do NOT invent or force them into approved concepts. List them in "unknownConcepts".
4. If conditions logically contradict each other (e.g. age > 60 AND age < 25), record the explanation in "contradictions".
5. Support nested logicalExpression without flattening mixed AND/OR operations.
6. Preserve original evidence phrase in each condition.

Return ONLY a valid JSON object matching this schema:
{
  "conditions": [
    {
      "concept": "social_category",
      "operator": "IN",
      "value": ["SC", "ST"],
      "evidence": "SC/ST families",
      "isApprovedConcept": true
    }
  ],
  "logicalExpression": {
    "operator": "AND",
    "conditions": []
  },
  "unknownConcepts": ["disability"],
  "contradictions": [],
  "extractionMethod": "gemini_ai",
  "confidence": 0.95
}
`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = parseModelJsonResponse(response.text);
    if (!parsed) return null;

    // Validate with Zod
    const validation = eligibilityExtractionSchema.safeParse({
      ...parsed,
      originalText: eligibilityText,
      extractionMethod: 'gemini_ai'
    });

    if (!validation.success) {
      console.warn('[Gemini Service] Gemini eligibility response failed Zod validation:', validation.error.message);
      return null;
    }

    return validation.data;
  } catch (error) {
    console.error('[Gemini Service Error] Eligibility extraction failed:', error.message);
    return null;
  }
}
