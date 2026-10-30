import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractAmountAndCurrency,
  extractFrequency,
  extractInstalments,
  wordsToNumber
} from '../src/services/numberParser.js';
import {
  extractBenefitRules,
  inferBenefitCategory,
  inferBenefitType
} from '../src/services/benefitExtractor.js';
import { parseModelJsonResponse } from '../src/services/geminiService.js';
import { benefitExtractionSchema } from '../src/validators/schemas.js';

describe('Benefit Extraction Suite', () => {
  describe('Currency & Number Parsing', () => {
    it('should correctly parse standard rupee symbol (₹)', () => {
      const res = extractAmountAndCurrency('Financial assistance of ₹6,000');
      expect(res.amount).toBe(6000);
      expect(res.currency).toBe('INR');
    });

    it('should correctly parse Rs. and trailing /- notation', () => {
      const res = extractAmountAndCurrency('Rs. 2,000/- per month');
      expect(res.amount).toBe(2000);
      expect(res.currency).toBe('INR');
    });

    it('should correctly parse INR prefix notation', () => {
      const res = extractAmountAndCurrency('INR 15000 as a one-time grant');
      expect(res.amount).toBe(15000);
      expect(res.currency).toBe('INR');
    });

    it('should convert lakh representations accurately (2.5 lakh -> 250000)', () => {
      const res = extractAmountAndCurrency('annual income under ₹2.5 lakh');
      expect(res.amount).toBe(250000);
      expect(res.currency).toBe('INR');
    });

    it('should convert plural lakhs accurately (3 lakhs -> 300000)', () => {
      const res = extractAmountAndCurrency('does not exceed Rs. 3 lakhs');
      expect(res.amount).toBe(300000);
      expect(res.currency).toBe('INR');
    });

    it('should convert decimal lakhs accurately (1.8 lakh -> 180000)', () => {
      const res = extractAmountAndCurrency('household income under ₹1.8 lakh');
      expect(res.amount).toBe(180000);
      expect(res.currency).toBe('INR');
    });

    it('should parse Indian comma notation (2,00,000 -> 200000)', () => {
      const res = extractAmountAndCurrency('income below ₹2,00,000');
      expect(res.amount).toBe(200000);
      expect(res.currency).toBe('INR');
    });

    it('should parse written English numbers into numeric values', () => {
      expect(wordsToNumber('six thousand')).toBe(6000);
      expect(wordsToNumber('twenty five thousand')).toBe(25000);
      expect(wordsToNumber('three')).toBe(3);
    });

    it('should parse "Six thousand rupees" using written number conversion', () => {
      const res = extractAmountAndCurrency('Six thousand rupees annually');
      expect(res.amount).toBe(6000);
      expect(res.currency).toBe('INR');
    });
  });

  describe('Frequency Parsing', () => {
    it('should recognize monthly frequency variants', () => {
      expect(extractFrequency('Rs. 2,000/- per month')).toBe('monthly');
      expect(extractFrequency('Monthly stipend of Rs. 4,500/-')).toBe('monthly');
      expect(extractFrequency('every month')).toBe('monthly');
    });

    it('should recognize yearly frequency variants', () => {
      expect(extractFrequency('₹6,000 a year')).toBe('yearly');
      expect(extractFrequency('Six thousand rupees annually')).toBe('yearly');
      expect(extractFrequency('per annum in two instalments')).toBe('yearly');
      expect(extractFrequency('Rs 10000 per year')).toBe('yearly');
    });

    it('should recognize quarterly frequency variants', () => {
      expect(extractFrequency('₹5000 quarterly')).toBe('quarterly');
      expect(extractFrequency('every 3 months')).toBe('quarterly');
      expect(extractFrequency('four quarterly instalments')).toBe('quarterly');
    });

    it('should recognize one-time grants', () => {
      expect(extractFrequency('INR 15000 as a one-time grant')).toBe('one-time');
      expect(extractFrequency('One-time transfer of ₹25,000')).toBe('one-time');
      expect(extractFrequency('single payment grant')).toBe('one-time');
    });

    it('should return null when frequency is missing or unspecified', () => {
      expect(extractFrequency('Financial support of INR 8,000')).toBeNull();
      expect(extractFrequency('Stipend provided for training period')).toBeNull();
    });
  });

  describe('Instalment Extraction & Distinction', () => {
    it('should parse numeric instalment count', () => {
      expect(extractInstalments('in 3 instalments')).toBe(3);
      expect(extractInstalments('4 quarterly instalments')).toBe(4);
    });

    it('should parse written word instalment counts', () => {
      expect(extractInstalments('in three instalments')).toBe(3);
      expect(extractInstalments('in two equal instalments')).toBe(2);
      expect(extractInstalments('single instalment')).toBe(1);
    });

    it('should distinguish total benefit from per-instalment count', () => {
      const res = extractBenefitRules('Financial assistance of ₹6,000 a year in three instalments.');
      expect(res.data.amount).toBe(6000);
      expect(res.data.frequency).toBe('yearly');
      expect(res.data.instalments).toBe(3);
      expect(res.data.currency).toBe('INR');
      expect(res.isComplete).toBe(true);
    });
  });

  describe('Missing & Ambiguous Data Handling', () => {
    it('should return null for missing amount and raise review reasons', () => {
      const res = extractBenefitRules(
        'Substantial financial assistance will be provided to eligible patients periodically as decided by the state medical board.'
      );
      expect(res.data.amount).toBeNull();
      expect(res.data.frequency).toBeNull();
      expect(res.isComplete).toBe(false);
      expect(res.reviewReasons.length).toBeGreaterThan(0);
      expect(res.reviewReasons[0]).toMatch(/missing or ambiguous/i);
    });

    it('should never invent missing values', () => {
      const res = extractBenefitRules('Stipend provided for training period.');
      expect(res.data.amount).toBeNull();
      expect(res.data.frequency).toBeNull();
      expect(res.data.instalments).toBeNull();
    });

    it('should preserve original source text', () => {
      const input = 'INR 15000 as a one-time grant';
      const res = extractBenefitRules(input);
      expect(res.data.originalText).toBe(input);
    });
  });

  describe('Category & Type Inference', () => {
    it('should infer education category for scholarships', () => {
      expect(inferBenefitCategory('Post-Matric Scholarship Scheme for tuition and living support')).toBe('education');
    });

    it('should infer housing category for construction subsidies', () => {
      expect(inferBenefitCategory('Subsidy of ₹1.5 lakh for house construction')).toBe('housing');
    });

    it('should infer healthcare category for medical assistance', () => {
      expect(inferBenefitCategory('Emergency medical treatment grant for hospital patients')).toBe('healthcare');
    });

    it('should infer employment category for apprenticeships and jobs', () => {
      expect(inferBenefitCategory('Vocational apprenticeship training stipend for workers')).toBe('employment');
    });
  });

  describe('Model Response Parsing & Zod Validation', () => {
    it('should clean and parse markdown-wrapped JSON from Gemini', () => {
      const raw = '```json\n{"category": "education", "amount": 6000, "frequency": "yearly"}\n```';
      const parsed = parseModelJsonResponse(raw);
      expect(parsed).toEqual({
        category: 'education',
        amount: 6000,
        frequency: 'yearly'
      });
    });

    it('should validate benefit extraction output with Zod', () => {
      const validData = {
        category: 'financial_assistance',
        type: 'grant',
        amount: 15000,
        currency: 'INR',
        frequency: 'one-time',
        instalments: null,
        originalText: 'INR 15000 as a one-time grant',
        extractionMethod: 'rule_based',
        confidence: 0.95
      };
      const result = benefitExtractionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid frequency via Zod', () => {
      const invalidData = {
        amount: 5000,
        frequency: 'daily_every_second_hour' // Invalid
      };
      const result = benefitExtractionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
