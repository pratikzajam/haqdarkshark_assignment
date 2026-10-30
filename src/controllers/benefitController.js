import { Benefit } from '../models/Benefit.js';

/**
 * Get structured benefit records
 * GET /api/benefits
 */
export async function getBenefitsHandler(req, res, next) {
  try {
    const { schemeId, category, frequency, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (schemeId) query.schemeId = schemeId;
    if (category) query.category = category;
    if (frequency) query.frequency = frequency;

    const [benefits, total] = await Promise.all([
      Benefit.find(query)
        .populate('schemeId', 'name extractionStatus')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10)),
      Benefit.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: benefits,
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
