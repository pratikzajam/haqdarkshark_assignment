import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  parseModelJsonResponse,
  extractBenefitWithGemini,
  extractEligibilityWithGemini
} from '../src/services/geminiService.js';
import * as geminiConfig from '../src/config/gemini.js';

describe('Gemini Integration & API Endpoints Suite', () => {
  const app = createApp();

  describe('Gemini API Integration with Mocks', () => {
    it('should handle clean JSON responses from Gemini', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          category: 'financial_assistance',
          type: 'grant',
          amount: 6000,
          currency: 'INR',
          frequency: 'yearly',
          instalments: 3,
          extractionMethod: 'gemini_ai',
          confidence: 0.95
        })
      });

      vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await extractBenefitWithGemini('Financial assistance of ₹6,000 a year in three instalments');
      expect(result).toBeDefined();
      expect(result.amount).toBe(6000);
      expect(result.frequency).toBe('yearly');
      expect(result.instalments).toBe(3);
    });

    it('should handle malformed non-JSON Gemini responses gracefully without throwing', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: 'Sorry, I cannot process this government scheme accurately.'
      });

      vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await extractBenefitWithGemini('Ambiguous text');
      expect(result).toBeNull();
    });

    it('should handle Gemini API network failure / rate limit error gracefully', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('RESOURCE_EXHAUSTED: Rate limit exceeded'));

      vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: { generateContent: mockGenerateContent }
      });

      const result = await extractEligibilityWithGemini('Some text');
      expect(result).toBeNull();
    });

    it('should return null when Gemini API key is not configured', async () => {
      vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue(null);

      const result = await extractBenefitWithGemini('Any benefit text');
      expect(result).toBeNull();
    });
  });

  describe('REST API Endpoints', () => {
    it('GET /api/health returns 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('government-scheme-extractor');
    });

    it('GET /api/samples returns all 16 sample dataset schemes', async () => {
      const res = await request(app).get('/api/samples');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(16);
      expect(res.body.data.length).toBe(16);
    });

    it('GET /api/taxonomy returns approved taxonomy definitions', async () => {
      const res = await request(app).get('/api/taxonomy');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvedTaxonomy.concepts).toContain('age');
      expect(res.body.data.approvedTaxonomy.concepts).toContain('income');
      expect(res.body.data.approvedTaxonomy.concepts).toContain('social_category');
      expect(res.body.data.approvedTaxonomy.concepts).toContain('state');
      expect(res.body.data.approvedTaxonomy.operators).toContain('BETWEEN');
    });

    it('POST /api/taxonomy/proposals validates missing concept name (400)', async () => {
      const res = await request(app)
        .post('/api/taxonomy/proposals')
        .send({ proposedConcept: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('POST /api/schemes/extract validates missing scheme name (400)', async () => {
      const res = await request(app)
        .post('/api/schemes/extract')
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('PATCH /api/review/:id validates invalid status value (400)', async () => {
      const res = await request(app)
        .patch('/api/review/507f1f77bcf86cd799439011')
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/unknown-endpoint returns 404', async () => {
      const res = await request(app).get('/api/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
