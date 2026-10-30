import { Eligibility } from '../models/Eligibility.js';

/**
 * Get extracted eligibility records
 * GET /api/eligibility
 */
export async function getEligibilityHandler(req, res, next) {
  try {
    const { schemeId, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (schemeId) query.schemeId = schemeId;

    const [eligibilities, total] = await Promise.all([
      Eligibility.find(query)
        .populate('schemeId', 'name extractionStatus')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10)),
      Eligibility.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: eligibilities,
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
