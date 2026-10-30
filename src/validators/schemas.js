import { z } from 'zod';
import { SUPPORTED_OPERATORS, APPROVED_BENEFIT_CATEGORIES, FREQUENCIES } from '../data/taxonomy.js';

// Recursive logical expression schema
export const logicalExpressionSchema = z.lazy(() =>
  z.object({
    operator: z.enum(['AND', 'OR']).default('AND'),
    conditions: z.array(conditionSchema).optional(),
    expressions: z.array(logicalExpressionSchema).optional()
  })
);

export const conditionSchema = z.object({
  concept: z.string().min(1, 'Concept is required'),
  operator: z.string().refine((op) => SUPPORTED_OPERATORS.has(op.toUpperCase()), {
    message: 'Unsupported operator. Must be =, !=, <, <=, >, >=, BETWEEN, or IN'
  }),
  value: z.union([
    z.number(),
    z.string(),
    z.array(z.union([z.number(), z.string()])),
    z.boolean()
  ]),
  evidence: z.string().optional().default(''),
  isApprovedConcept: z.boolean().optional().default(true)
});

export const benefitExtractionSchema = z.object({
  category: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().default('INR'),
  frequency: z.string().nullable().optional().refine(
    (f) => f === null || f === undefined || FREQUENCIES.has(f.toLowerCase()),
    { message: 'Invalid frequency' }
  ),
  instalments: z.number().int().positive().nullable().optional(),
  originalText: z.string().optional(),
  extractionMethod: z.enum(['rule_based', 'gemini_ai', 'hybrid']).default('hybrid'),
  confidence: z.number().min(0).max(1).default(1.0)
});

export const eligibilityExtractionSchema = z.object({
  conditions: z.array(conditionSchema).default([]),
  logicalExpression: logicalExpressionSchema.default({ operator: 'AND', conditions: [] }),
  originalText: z.string().optional().default(''),
  extractionMethod: z.enum(['rule_based', 'gemini_ai', 'hybrid']).default('hybrid'),
  confidence: z.number().min(0).max(1).default(1.0),
  unknownConcepts: z.array(z.string()).optional().default([]),
  contradictions: z.array(z.string()).optional().default([])
});

export const extractSchemeRequestSchema = z.object({
  name: z.string().min(1, 'Scheme name is required').trim(),
  benefitText: z.string().optional().default(''),
  eligibilityText: z.string().optional().default(''),
  sourceDocument: z.string().nullable().optional()
});

export const reviewPatchSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be approved or rejected' })
  }),
  reviewerComment: z.string().optional(),
  correctedValue: z.any().optional()
});

export const taxonomyProposalCreateSchema = z.object({
  proposedConcept: z.string().min(1, 'Proposed concept name is required').trim().toLowerCase(),
  originalText: z.string().optional().default(''),
  reason: z.string().optional().default('Manually proposed concept')
});

export const taxonomyProposalPatchSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be approved or rejected' })
  })
});
