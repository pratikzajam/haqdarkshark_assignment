import { describe, it, expect } from 'vitest';
import {
  extractAgeConditions,
  extractIncomeConditions,
  extractSocialCategoryConditions,
  extractStateConditions,
  detectUnknownConcepts,
  detectContradictions,
  buildLogicalExpression,
  extractEligibilityRules
} from '../src/services/eligibilityExtractor.js';
import { eligibilityExtractionSchema } from '../src/validators/schemas.js';

describe('Eligibility Extraction Suite', () => {
  describe('Operator Distinctions: Under (<) vs Not Exceeding (<=)', () => {
    it('should assign operator < for "under ₹2.5 lakh"', () => {
      const conds = extractIncomeConditions('SC/ST families with annual income under ₹2.5 lakh');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('income');
      expect(conds[0].operator).toBe('<');
      expect(conds[0].value).toBe(250000);
    });

    it('should assign operator <= for "does not exceed Rs. 3 lakhs"', () => {
      const conds = extractIncomeConditions('OBC applicants whose family income does not exceed Rs. 3 lakhs');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('income');
      expect(conds[0].operator).toBe('<=');
      expect(conds[0].value).toBe(300000);
    });

    it('should assign operator <= for "not exceeding 1.5 lakhs"', () => {
      const conds = extractIncomeConditions('annual family income not exceeding 1.5 lakhs');
      expect(conds.length).toBe(1);
      expect(conds[0].operator).toBe('<=');
      expect(conds[0].value).toBe(150000);
    });
  });

  describe('Operator Distinctions: Above (>) vs At Least (>=)', () => {
    it('should assign operator > for "above 21 years"', () => {
      const conds = extractAgeConditions('Women above 21 years');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('age');
      expect(conds[0].operator).toBe('>');
      expect(conds[0].value).toBe(21);
    });

    it('should assign operator >= for "at least 60 years"', () => {
      const conds = extractAgeConditions('Applicants aged at least 60 years');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('age');
      expect(conds[0].operator).toBe('>=');
      expect(conds[0].value).toBe(60);
    });

    it('should assign operator >= for "60 years and above"', () => {
      const conds = extractAgeConditions('Citizens 60 years and above');
      expect(conds.length).toBe(1);
      expect(conds[0].operator).toBe('>=');
      expect(conds[0].value).toBe(60);
    });
  });

  describe('Age Ranges (BETWEEN)', () => {
    it('should assign operator BETWEEN and value array for "aged between 18 and 35 years"', () => {
      const conds = extractAgeConditions('Applicants aged between 18 and 35 years residing in Maharashtra');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('age');
      expect(conds[0].operator).toBe('BETWEEN');
      expect(conds[0].value).toEqual([18, 35]);
    });

    it('should parse "between 20 and 28 years"', () => {
      const conds = extractAgeConditions('age is between 20 and 28 years');
      expect(conds.length).toBe(1);
      expect(conds[0].operator).toBe('BETWEEN');
      expect(conds[0].value).toEqual([20, 28]);
    });
  });

  describe('Social Category & State Parsing', () => {
    it('should parse SC/ST into operator IN with ["SC", "ST"]', () => {
      const conds = extractSocialCategoryConditions('SC/ST families with annual income under ₹2.5 lakh');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('social_category');
      expect(conds[0].operator).toBe('IN');
      expect(conds[0].value).toEqual(['SC', 'ST']);
    });

    it('should parse OBC applicants', () => {
      const conds = extractSocialCategoryConditions('OBC applicants whose family income does not exceed Rs. 3 lakhs');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('social_category');
      expect(conds[0].value).toBe('OBC');
    });

    it('should parse SC, ST or OBC combined categories', () => {
      const conds = extractSocialCategoryConditions('SC, ST or OBC candidates');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('social_category');
      expect(conds[0].operator).toBe('IN');
      expect(conds[0].value).toEqual(['SC', 'ST', 'OBC']);
    });

    it('should extract Indian states', () => {
      const conds = extractStateConditions('Permanent residents of Maharashtra');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('state');
      expect(conds[0].operator).toBe('=');
      expect(conds[0].value).toBe('Maharashtra');
    });

    it('should extract multiple states joined with OR', () => {
      const conds = extractStateConditions('ST candidates residing in Jharkhand or Odisha');
      expect(conds.length).toBe(1);
      expect(conds[0].concept).toBe('state');
      expect(conds[0].operator).toBe('IN');
      expect(conds[0].value).toEqual(['Jharkhand', 'Odisha']);
    });
  });

  describe('Nested Logical Expressions (No Flattening)', () => {
    it('should construct nested boolean tree without flattening mixed AND/OR operations', () => {
      const text = 'Residents of Karnataka who are either (SC/ST with income under ₹2.5 lakh) OR (OBC with income under ₹1.5 lakh) and aged between 21 and 45 years.';
      const res = extractEligibilityRules(text);

      expect(res.logicalExpression).toBeDefined();
      expect(res.logicalExpression.operator).toBe('AND');
      expect(res.logicalExpression.expressions).toBeDefined();
      expect(res.logicalExpression.expressions.length).toBe(1);

      const orBranch = res.logicalExpression.expressions[0];
      expect(orBranch.operator).toBe('OR');
      expect(orBranch.expressions.length).toBe(2);
      expect(orBranch.expressions[0].operator).toBe('AND');
      expect(orBranch.expressions[1].operator).toBe('AND');
    });
  });

  describe('Unknown Concept Detection & Taxonomy Protection', () => {
    it('should detect disability concept and not invent approved concept', () => {
      const unknowns = detectUnknownConcepts('Applicants with disabilities aged above 18 years');
      expect(unknowns.length).toBe(1);
      expect(unknowns[0].concept).toBe('disability');
    });

    it('should detect gender concept for women', () => {
      const unknowns = detectUnknownConcepts('Women above 21 years who are permanent residents of Uttar Pradesh');
      expect(unknowns.some(u => u.concept === 'gender')).toBe(true);
    });

    it('should detect residence duration concept', () => {
      const unknowns = detectUnknownConcepts('Residents of Maharashtra for at least five years');
      expect(unknowns.some(u => u.concept === 'residence_years')).toBe(true);
    });

    it('should detect economic status (EWS / economically weaker)', () => {
      const unknowns = detectUnknownConcepts('Economically weaker families having household income under ₹1.8 lakh');
      expect(unknowns.some(u => u.concept === 'economic_status')).toBe(true);
    });
  });

  describe('Contradictory Eligibility Detection', () => {
    it('should detect contradictory age rules (age > 60 AND age < 25)', () => {
      const text = 'Applicant must be aged above 60 years and under 25 years with annual income under ₹1 lakh.';
      const res = extractEligibilityRules(text);

      expect(res.contradictions.length).toBeGreaterThan(0);
      expect(res.contradictions[0]).toMatch(/contradictory age criteria/i);
    });

    it('should detect contradictory income rules (income > 5L AND income <= 2L)', () => {
      const text = 'Family income must exceed ₹5,00,000 while total family income does not exceed Rs. 2,00,000.';
      const res = extractEligibilityRules(text);

      expect(res.contradictions.length).toBeGreaterThan(0);
      expect(res.contradictions[0]).toMatch(/contradictory income criteria/i);
    });
  });

  describe('Zod Validation for Eligibility', () => {
    it('should successfully validate eligibility condition with Zod', () => {
      const validEligibility = {
        conditions: [
          {
            concept: 'social_category',
            operator: 'IN',
            value: ['SC', 'ST'],
            evidence: 'SC/ST',
            isApprovedConcept: true
          },
          {
            concept: 'income',
            operator: '<',
            value: 250000,
            evidence: 'annual income under ₹2.5 lakh',
            isApprovedConcept: true
          }
        ],
        logicalExpression: {
          operator: 'AND',
          conditions: []
        },
        originalText: 'SC/ST families with annual income under ₹2.5 lakh',
        extractionMethod: 'rule_based',
        confidence: 0.95,
        unknownConcepts: [],
        contradictions: []
      };

      const parsed = eligibilityExtractionSchema.safeParse(validEligibility);
      expect(parsed.success).toBe(true);
    });
  });
});
