import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractBenefitRules } from '../src/services/benefitExtractor.js';
import { extractEligibilityRules } from '../src/services/eligibilityExtractor.js';
import { SAMPLE_SCHEMES } from '../src/data/sampleInputs.js';
import { isApprovedConcept, resetDynamicTaxonomy } from '../src/data/taxonomy.js';

describe('End-to-End Extraction Pipeline & Sample Dataset Verification', () => {
  beforeEach(() => {
    resetDynamicTaxonomy();
  });

  describe('Verification of 16 Realistic Sample Government Schemes', () => {
    it('SCHEME-001: PM-Kisan Samman Nidhi Yojana', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-001');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(6000);
      expect(bRes.data.currency).toBe('INR');
      expect(bRes.data.frequency).toBe('yearly');
      expect(bRes.data.instalments).toBe(3);

      expect(eRes.unknownConcepts.some(u => u.concept === 'land_holding')).toBe(true);
    });

    it('SCHEME-002: Indira Gandhi Old Age Pension', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-002');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(2000);
      expect(bRes.data.currency).toBe('INR');
      expect(bRes.data.frequency).toBe('monthly');

      const ageCond = eRes.conditions.find(c => c.concept === 'age');
      expect(ageCond.operator).toBe('>=');
      expect(ageCond.value).toBe(60);

      const incCond = eRes.conditions.find(c => c.concept === 'income');
      expect(incCond.operator).toBe('<=');
      expect(incCond.value).toBe(120000);
    });

    it('SCHEME-003: National Start-Up Seed Grant', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-003');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(15000);
      expect(bRes.data.frequency).toBe('one-time');
      expect(bRes.data.type).toBe('grant');

      const ageCond = eRes.conditions.find(c => c.concept === 'age');
      expect(ageCond.operator).toBe('BETWEEN');
      expect(ageCond.value).toEqual([18, 35]);

      const stateCond = eRes.conditions.find(c => c.concept === 'state');
      expect(stateCond.value).toBe('Maharashtra');
    });

    it('SCHEME-004: Post-Matric Scholarship Scheme', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-004');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(6000);
      expect(bRes.data.frequency).toBe('yearly');
      expect(bRes.data.category).toBe('education');

      const scCond = eRes.conditions.find(c => c.concept === 'social_category');
      expect(scCond.operator).toBe('IN');
      expect(scCond.value).toEqual(['SC', 'ST']);

      const incCond = eRes.conditions.find(c => c.concept === 'income');
      expect(incCond.operator).toBe('<');
      expect(incCond.value).toBe(250000);
    });

    it('SCHEME-005: Handloom Weaver Quarterly Support', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-005');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(5000);
      expect(bRes.data.frequency).toBe('quarterly');

      const obcCond = eRes.conditions.find(c => c.concept === 'social_category');
      expect(obcCond.value).toBe('OBC');

      const incCond = eRes.conditions.find(c => c.concept === 'income');
      expect(incCond.operator).toBe('<=');
      expect(incCond.value).toBe(300000);
    });

    it('SCHEME-006: Kanya Samriddhi Mahila Sahayata (Unknown Concept: Gender)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-006');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(25000);
      expect(bRes.data.frequency).toBe('one-time');

      expect(eRes.unknownConcepts.some(u => u.concept === 'gender')).toBe(true);
      const ageCond = eRes.conditions.find(c => c.concept === 'age');
      expect(ageCond.operator).toBe('>');
      expect(ageCond.value).toBe(21);
    });

    it('SCHEME-007: State Domicile Artisans Welfare (Unknown Concept: Residence Duration)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-007');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(10000);
      expect(bRes.data.frequency).toBe('yearly');
      expect(bRes.data.instalments).toBe(2);

      expect(eRes.unknownConcepts.some(u => u.concept === 'residence_years')).toBe(true);
      const stateCond = eRes.conditions.find(c => c.concept === 'state');
      expect(stateCond.value).toBe('Maharashtra');
    });

    it('SCHEME-008: EWS Housing Assistance (Lakh conversion + Unknown Concept EWS)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-008');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(150000);
      expect(bRes.data.instalments).toBe(4);
      expect(bRes.data.category).toBe('housing');

      expect(eRes.unknownConcepts.some(u => u.concept === 'economic_status')).toBe(true);
      const incCond = eRes.conditions.find(c => c.concept === 'income');
      expect(incCond.operator).toBe('<');
      expect(incCond.value).toBe(180000);
    });

    it('SCHEME-009: Divyangjan Assistive Device (Unknown Concept: Disability)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-009');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(8000);
      expect(eRes.unknownConcepts.some(u => u.concept === 'disability')).toBe(true);
      const stateCond = eRes.conditions.find(c => c.concept === 'state');
      expect(stateCond.value).toBe('Gujarat');
    });

    it('SCHEME-010: Backward Classes Fellowship', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-010');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(4500);
      expect(bRes.data.frequency).toBe('monthly');

      const scCond = eRes.conditions.find(c => c.concept === 'social_category');
      expect(scCond.value).toEqual(['SC', 'ST', 'OBC']);

      const incCond = eRes.conditions.find(c => c.concept === 'income');
      expect(incCond.operator).toBe('<');
      expect(incCond.value).toBe(200000);

      const ageCond = eRes.conditions.find(c => c.concept === 'age');
      expect(ageCond.operator).toBe('BETWEEN');
      expect(ageCond.value).toEqual([20, 28]);
    });

    it('SCHEME-011: Tribal Solar Pump (Multiple States IN)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-011');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(45000);
      expect(bRes.data.frequency).toBe('one-time');

      const stCond = eRes.conditions.find(c => c.concept === 'social_category');
      expect(stCond.value).toBe('ST');

      const stateCond = eRes.conditions.find(c => c.concept === 'state');
      expect(stateCond.operator).toBe('IN');
      expect(stateCond.value).toContain('Jharkhand');
      expect(stateCond.value).toContain('Odisha');
    });

    it('SCHEME-012: Ambiguous Medical Grant (Review Flag)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-012');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBeNull();
      expect(bRes.data.frequency).toBeNull();
      expect(bRes.reviewReasons.length).toBeGreaterThan(0);
      expect(eRes.unknownConcepts.some(u => u.concept === 'economic_status')).toBe(true);
    });

    it('SCHEME-013: Youth Pension Scheme (Contradictory Age Rule Flag)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-013');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(3000);
      expect(bRes.data.frequency).toBe('monthly');
      expect(eRes.contradictions.length).toBeGreaterThan(0);
      expect(eRes.contradictions[0]).toMatch(/contradictory age criteria/i);
    });

    it('SCHEME-014: Farmers Drought Relief (Contradictory Income Rule Flag)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-014');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(12000);
      expect(bRes.data.frequency).toBe('yearly');
      expect(eRes.contradictions.length).toBeGreaterThan(0);
      expect(eRes.contradictions[0]).toMatch(/contradictory income criteria/i);
    });

    it('SCHEME-015: Apprenticeship Allowance (Incomplete Flag)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-015');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBeNull();
      expect(bRes.data.frequency).toBeNull();
      expect(eRes.unknownConcepts.some(u => u.concept === 'educational_qualification')).toBe(true);
    });

    it('SCHEME-016: State Integrated Welfare (Complex Nested Logic)', () => {
      const scheme = SAMPLE_SCHEMES.find(s => s.id === 'SCHEME-016');
      const bRes = extractBenefitRules(scheme.benefitText);
      const eRes = extractEligibilityRules(scheme.eligibilityText);

      expect(bRes.data.amount).toBe(12000);
      expect(bRes.data.frequency).toBe('yearly');
      expect(bRes.data.instalments).toBe(4);

      expect(eRes.logicalExpression.operator).toBe('AND');
      expect(eRes.logicalExpression.expressions.length).toBe(1);
      expect(eRes.logicalExpression.expressions[0].operator).toBe('OR');
    });
  });
});
