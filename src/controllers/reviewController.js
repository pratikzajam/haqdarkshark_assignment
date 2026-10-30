import { Review } from '../models/Review.js';
import { getReviews, updateReviewStatus } from '../services/reviewService.js';
import { reviewPatchSchema } from '../validators/schemas.js';

/**
 * Get review records with optional status filter (defaults to pending)
 * GET /api/review
 */
export async function getReviewsHandler(req, res, next) {
  try {
    const { status, schemeId } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'pending';
    }
    if (schemeId) {
      filter.schemeId = schemeId;
    }

    const reviews = await getReviews(filter);

    res.status(200).json({
      success: true,
      data: reviews,
      meta: {
        count: reviews.length,
        statusFilter: filter.status
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve or reject a review record with comments
 * PATCH /api/review/:id
 */
export async function patchReviewHandler(req, res, next) {
  try {
    const { id } = req.params;
    const validated = reviewPatchSchema.parse(req.body);

    const updated = await updateReviewStatus(
      id,
      validated.status,
      validated.reviewerComment,
      validated.correctedValue
    );

    res.status(200).json({
      success: true,
      message: `Review record marked as ${validated.status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}
