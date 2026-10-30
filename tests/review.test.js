import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isApprovedConcept,
  getApprovedTaxonomy,
  addApprovedConcept,
  resetDynamicTaxonomy
} from '../src/data/taxonomy.js';
import { reviewPatchSchema, taxonomyProposalCreateSchema } from '../src/validators/schemas.js';

describe('Review & Taxonomy Governance Suite', () => {
  beforeEach(() => {
    resetDynamicTaxonomy();
  });

  describe('Taxonomy Protection & Governance', () => {
    it('should confirm initial approved concepts', () => {
      expect(isApprovedConcept('age')).toBe(true);
      expect(isApprovedConcept('income')).toBe(true);
      expect(isApprovedConcept('social_category')).toBe(true);
      expect(isApprovedConcept('state')).toBe(true);
    });

    it('should reject unknown concepts from approved taxonomy before approval', () => {
      expect(isApprovedConcept('disability')).toBe(false);
      expect(isApprovedConcept('gender')).toBe(false);
      expect(isApprovedConcept('residence_years')).toBe(false);
      expect(isApprovedConcept('economic_status')).toBe(false);
      expect(isApprovedConcept('land_holding')).toBe(false);
    });

    it('should dynamically approve a concept via governance workflow', () => {
      expect(isApprovedConcept('disability')).toBe(false);

      const success = addApprovedConcept('disability', {
        proposalId: 'prop-123',
        reason: 'Physical and mental disability criteria'
      });

      expect(success).toBe(true);
      expect(isApprovedConcept('disability')).toBe(true);

      const taxonomy = getApprovedTaxonomy();
      expect(taxonomy.concepts).toContain('disability');
    });

    it('should validate taxonomy proposal creation with Zod', () => {
      const valid = {
        proposedConcept: 'disability',
        originalText: 'Applicants with disabilities',
        reason: 'Detected criteria not in core taxonomy'
      };
      const res = taxonomyProposalCreateSchema.safeParse(valid);
      expect(res.success).toBe(true);
      expect(res.data.proposedConcept).toBe('disability');
    });

    it('should reject empty proposed concept name', () => {
      const invalid = {
        proposedConcept: '',
        originalText: 'text'
      };
      const res = taxonomyProposalCreateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe('Review Workflow Validation', () => {
    it('should validate review approval patch with comment', () => {
      const validPatch = {
        status: 'approved',
        reviewerComment: 'Verified with official gazette notification',
        correctedValue: 6000
      };
      const res = reviewPatchSchema.safeParse(validPatch);
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('approved');
    });

    it('should validate review rejection patch', () => {
      const validPatch = {
        status: 'rejected',
        reviewerComment: 'Insufficient documentation'
      };
      const res = reviewPatchSchema.safeParse(validPatch);
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('rejected');
    });

    it('should reject invalid review statuses (e.g. unknown status)', () => {
      const invalidPatch = {
        status: 'maybe_someday'
      };
      const res = reviewPatchSchema.safeParse(invalidPatch);
      expect(res.success).toBe(false);
    });
  });

  describe('Review Queue Conditions Triggering', () => {
    it('should identify that ambiguous text warrants review', () => {
      const ambiguousBenefit = {
        amount: null,
        frequency: null,
        text: 'Financial assistance to be decided later'
      };
      const shouldReview = ambiguousBenefit.amount === null || ambiguousBenefit.frequency === null;
      expect(shouldReview).toBe(true);
    });

    it('should identify that unknown concept warrants proposal generation', () => {
      const conceptsExtracted = ['age', 'income', 'disability'];
      const unapproved = conceptsExtracted.filter(c => !isApprovedConcept(c));

      expect(unapproved).toEqual(['disability']);
      expect(unapproved.length).toBe(1);
    });
  });
});
