import { Scheme } from '../models/Scheme.js';
import { Benefit } from '../models/Benefit.js';
import { Eligibility } from '../models/Eligibility.js';
import { Review } from '../models/Review.js';
import { TaxonomyProposal } from '../models/TaxonomyProposal.js';
import { extractBenefitRules } from './benefitExtractor.js';
import { extractEligibilityRules } from './eligibilityExtractor.js';
import { extractBenefitWithGemini, extractEligibilityWithGemini } from './geminiService.js';
import { isApprovedConcept } from '../data/taxonomy.js';
import { benefitExtractionSchema, eligibilityExtractionSchema } from '../validators/schemas.js';

/**
 * Main Extraction Pipeline for Government Schemes
 * Implements deterministic rules + Gemini contextual AI interpretation + review workflow
 * 
 * @param {object} params
 * @param {string} params.name Scheme name
 * @param {string} [params.benefitText] Messy benefit description
 * @param {string} [params.eligibilityText] Messy eligibility conditions
 * @param {string} [params.sourceDocument] Optional source document reference
 * @param {string} [params.schemeId] Optional existing scheme ID for re-processing
 * @returns {Promise<object>} Complete structured extraction result
 */
export async function processSchemeExtraction({
  name,
  benefitText = '',
  eligibilityText = '',
  sourceDocument = null,
  schemeId = null
}) {
  // 1. Normalize input text
  const cleanName = (name || '').trim();
  const cleanBenefitText = (benefitText || '').trim();
  const cleanEligibilityText = (eligibilityText || '').trim();

  // 2. Save or update Scheme document with status 'processing'
  let scheme;
  if (schemeId) {
    scheme = await Scheme.findByIdAndUpdate(
      schemeId,
      {
        name: cleanName,
        originalBenefitText: cleanBenefitText,
        originalEligibilityText: cleanEligibilityText,
        sourceDocument,
        extractionStatus: 'processing'
      },
      { new: true }
    );
    if (!scheme) {
      throw new Error(`Scheme with id ${schemeId} not found`);
    }
  } else {
    scheme = await Scheme.create({
      name: cleanName,
      originalBenefitText: cleanBenefitText,
      originalEligibilityText: cleanEligibilityText,
      sourceDocument,
      extractionStatus: 'processing'
    });
  }

  const reviewsToCreate = [];
  const taxonomyProposalsToCreate = [];

  // ==========================================
  // 3. BENEFIT EXTRACTION PIPELINE
  // ==========================================
  let finalBenefitData = null;

  if (cleanBenefitText) {
    // A. Deterministic rule-based extraction
    const ruleResult = extractBenefitRules(cleanBenefitText);

    let mergedBenefit = { ...ruleResult.data };
    let method = 'rule_based';

    // B. Contextual Gemini AI fallback or enrichment if needed
    // (e.g. if amount or frequency is missing or category is unclassified)
    if (!ruleResult.isComplete || !ruleResult.data.category) {
      try {
        const aiResult = await extractBenefitWithGemini(cleanBenefitText);
        if (aiResult) {
          method = 'hybrid';
          // Merge AI insights without overriding deterministic numeric/frequency extractions
          mergedBenefit = {
            category: ruleResult.data.category || aiResult.category || null,
            type: ruleResult.data.type || aiResult.type || 'financial_assistance',
            amount: ruleResult.data.amount !== null ? ruleResult.data.amount : (aiResult.amount ?? null),
            currency: ruleResult.data.currency || aiResult.currency || 'INR',
            frequency: ruleResult.data.frequency || aiResult.frequency || null,
            instalments: ruleResult.data.instalments !== null ? ruleResult.data.instalments : (aiResult.instalments ?? null),
            originalText: cleanBenefitText,
            extractionMethod: method,
            confidence: (ruleResult.data.confidence + (aiResult.confidence || 0.9)) / 2
          };
        }
      } catch (err) {
        console.warn('[Extraction Service] Gemini benefit extraction skipped:', err.message);
      }
    }

    // Validate with Zod
    const validatedBenefit = benefitExtractionSchema.parse({
      ...mergedBenefit,
      originalText: cleanBenefitText,
      extractionMethod: method
    });

    finalBenefitData = validatedBenefit;

    // Check for uncertain fields or review requirements
    if (finalBenefitData.amount === null) {
      reviewsToCreate.push({
        schemeId: scheme._id,
        field: 'benefit.amount',
        originalText: cleanBenefitText,
        reason: 'Benefit amount is missing or ambiguous in source text',
        extractionMethod: method,
        proposedValue: null,
        status: 'pending'
      });
    }

    if (finalBenefitData.frequency === null && finalBenefitData.amount !== null) {
      reviewsToCreate.push({
        schemeId: scheme._id,
        field: 'benefit.frequency',
        originalText: cleanBenefitText,
        reason: 'Payment frequency could not be unambiguously determined',
        extractionMethod: method,
        proposedValue: null,
        status: 'pending'
      });
    }
  }

  // ==========================================
  // 4. ELIGIBILITY EXTRACTION PIPELINE
  // ==========================================
  let finalEligibilityData = null;

  if (cleanEligibilityText) {
    // A. Deterministic rule-based extraction
    const ruleResult = extractEligibilityRules(cleanEligibilityText);

    let mergedEligibility = { ...ruleResult };
    let method = 'rule_based';

    // B. AI enrichment if conditions are empty or ambiguous
    if (ruleResult.conditions.length === 0) {
      try {
        const aiResult = await extractEligibilityWithGemini(cleanEligibilityText);
        if (aiResult && aiResult.conditions?.length > 0) {
          method = 'gemini_ai';
          mergedEligibility = {
            ...mergedEligibility,
            conditions: aiResult.conditions,
            logicalExpression: aiResult.logicalExpression || mergedEligibility.logicalExpression,
            unknownConcepts: [
              ...mergedEligibility.unknownConcepts,
              ...(aiResult.unknownConcepts || []).map(c => ({ concept: c, evidence: c, reason: 'AI detected concept' }))
            ],
            confidence: aiResult.confidence || 0.8
          };
        }
      } catch (err) {
        console.warn('[Extraction Service] Gemini eligibility extraction skipped:', err.message);
      }
    }

    // Validate with Zod
    const validatedEligibility = eligibilityExtractionSchema.parse({
      conditions: mergedEligibility.conditions,
      logicalExpression: mergedEligibility.logicalExpression,
      originalText: cleanEligibilityText,
      extractionMethod: method,
      confidence: mergedEligibility.confidence,
      unknownConcepts: mergedEligibility.unknownConcepts.map(u => (typeof u === 'string' ? u : u.concept)),
      contradictions: mergedEligibility.contradictions
    });

    finalEligibilityData = validatedEligibility;

    // C. Detect and handle unknown concepts (Strict rule: never silently expand taxonomy)
    for (const unknown of mergedEligibility.unknownConcepts) {
      const conceptName = typeof unknown === 'string' ? unknown : unknown.concept;
      const evidence = typeof unknown === 'string' ? unknown : unknown.evidence;
      const reason = typeof unknown === 'string' ? 'Unknown concept found in eligibility criteria' : unknown.reason;

      if (!isApprovedConcept(conceptName)) {
        taxonomyProposalsToCreate.push({
          proposedConcept: conceptName.toLowerCase(),
          originalText: evidence,
          reason,
          status: 'pending_approval'
        });

        reviewsToCreate.push({
          schemeId: scheme._id,
          field: 'eligibility.unknown_concept',
          originalText: evidence,
          reason: `Unknown concept '${conceptName}' is not in approved taxonomy. Proposal queued for review.`,
          extractionMethod: method,
          proposedValue: { concept: conceptName },
          status: 'pending'
        });
      }
    }

    // D. Detect contradictions (e.g. age > 60 and age < 25)
    for (const contradiction of mergedEligibility.contradictions) {
      reviewsToCreate.push({
        schemeId: scheme._id,
        field: 'eligibility.contradiction',
        originalText: cleanEligibilityText,
        reason: contradiction,
        extractionMethod: method,
        proposedValue: null,
        status: 'pending'
      });
    }
  }

  // ==========================================
  // 5. DATABASE PERSISTENCE & CONSISTENCY
  // ==========================================
  // Clean up previous extractions if reprocessing scheme to prevent duplicate records
  await Benefit.deleteMany({ schemeId: scheme._id });
  await Eligibility.deleteMany({ schemeId: scheme._id });

  let savedBenefit = null;
  if (finalBenefitData) {
    savedBenefit = await Benefit.create({
      schemeId: scheme._id,
      ...finalBenefitData
    });
  }

  let savedEligibility = null;
  if (finalEligibilityData) {
    savedEligibility = await Eligibility.create({
      schemeId: scheme._id,
      logicalExpression: finalEligibilityData.logicalExpression,
      conditions: finalEligibilityData.conditions,
      originalText: cleanEligibilityText,
      extractionMethod: finalEligibilityData.extractionMethod,
      confidence: finalEligibilityData.confidence
    });
  }

  // Save review records
  const createdReviews = [];
  for (const rev of reviewsToCreate) {
    const created = await Review.create(rev);
    createdReviews.push(created);
  }

  // Save taxonomy proposals (avoiding duplicates if one was already proposed)
  const createdProposals = [];
  for (const prop of taxonomyProposalsToCreate) {
    const existing = await TaxonomyProposal.findOne({
      proposedConcept: prop.proposedConcept,
      status: 'pending_approval'
    });
    if (!existing) {
      const created = await TaxonomyProposal.create(prop);
      createdProposals.push(created);
    } else {
      createdProposals.push(existing);
    }
  }

  // ==========================================
  // 6. UPDATE SCHEME FINAL STATUS
  // ==========================================
  let finalStatus = 'completed';

  if (reviewsToCreate.length > 0) {
    finalStatus = 'needs_review';
  } else if (!savedBenefit && !savedEligibility) {
    finalStatus = 'failed';
  } else if (!savedBenefit || !savedEligibility) {
    finalStatus = 'partially_completed';
  }

  scheme.extractionStatus = finalStatus;
  await scheme.save();

  return {
    scheme,
    benefit: savedBenefit,
    eligibility: savedEligibility,
    reviews: createdReviews,
    taxonomyProposals: createdProposals,
    metrics: {
      hasContradictions: (finalEligibilityData?.contradictions?.length || 0) > 0,
      unknownConceptsCount: taxonomyProposalsToCreate.length,
      pendingReviewsCount: reviewsToCreate.length
    }
  };
}
