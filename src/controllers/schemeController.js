import { Scheme } from '../models/Scheme.js';
import { Benefit } from '../models/Benefit.js';
import { Eligibility } from '../models/Eligibility.js';
import { Review } from '../models/Review.js';
import { processSchemeExtraction } from '../services/extractionService.js';
import { extractSchemeRequestSchema } from '../validators/schemas.js';

/**
 * Extract and persist scheme data from natural language text
 * POST /api/schemes/extract
 */
export async function extractSchemeHandler(req, res, next) {
  try {
    const validatedBody = extractSchemeRequestSchema.parse(req.body);

    const result = await processSchemeExtraction(validatedBody);

    res.status(201).json({
      success: true,
      message: 'Scheme extraction processed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all schemes with pagination and optional status filter
 * GET /api/schemes
 */
export async function getSchemesHandler(req, res, next) {
  try {
    const { status, limit = 50, skip = 0, search } = req.query;

    const query = {};
    if (status) {
      query.extractionStatus = status;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [schemes, total] = await Promise.all([
      Scheme.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10)),
      Scheme.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: schemes,
      meta: {
        total,
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single scheme by ID with its benefits, eligibility, and reviews
 * GET /api/schemes/:id
 */
export async function getSchemeByIdHandler(req, res, next) {
  try {
    const { id } = req.params;

    const scheme = await Scheme.findById(id);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: `Scheme not found with id: ${id}`
      });
    }

    const [benefits, eligibility, reviews] = await Promise.all([
      Benefit.find({ schemeId: id }),
      Eligibility.findOne({ schemeId: id }),
      Review.find({ schemeId: id }).sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        scheme,
        benefits,
        eligibility,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
}
