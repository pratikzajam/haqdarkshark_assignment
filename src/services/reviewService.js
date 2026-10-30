import { Review } from '../models/Review.js';
import { Scheme } from '../models/Scheme.js';
import { Benefit } from '../models/Benefit.js';
import { Eligibility } from '../models/Eligibility.js';

/**
 * Create a review record in the database
 * @param {object} reviewData
 * @returns {Promise<object>}
 */
export async function createReview(reviewData) {
  return await Review.create(reviewData);
}

/**
 * Get all reviews with optional status filter
 * @param {object} filter
 * @returns {Promise<Array<object>>}
 */
export async function getReviews(filter = {}) {
  return await Review.find(filter).populate('schemeId', 'name extractionStatus').sort({ createdAt: -1 });
}

/**
 * Update review status (approve/reject) with reviewer comment and optionally apply correction
 * @param {string} reviewId
 * @param {'approved'|'rejected'} status
 * @param {string} [reviewerComment]
 * @param {any} [correctedValue]
 * @returns {Promise<object>}
 */
export async function updateReviewStatus(reviewId, status, reviewerComment = '', correctedValue = undefined) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error(`Review record not found with id: ${reviewId}`);
  }

  review.status = status;
  if (reviewerComment) {
    review.reviewerComment = reviewerComment;
  }
  if (correctedValue !== undefined) {
    review.proposedValue = correctedValue;
  }

  await review.save();

  // If approved and a proposed value exists, optionally apply correction to target record
  if (status === 'approved' && review.proposedValue !== undefined) {
    if (review.field.startsWith('benefit.')) {
      const fieldKey = review.field.replace('benefit.', '');
      await Benefit.updateMany(
        { schemeId: review.schemeId },
        { $set: { [fieldKey]: review.proposedValue } }
      );
    }
  }

  // Check if all reviews for this scheme are resolved
  const pendingCount = await Review.countDocuments({
    schemeId: review.schemeId,
    status: 'pending'
  });

  if (pendingCount === 0) {
    // Check if scheme has benefits and eligibility
    const benefitCount = await Benefit.countDocuments({ schemeId: review.schemeId });
    const eligCount = await Eligibility.countDocuments({ schemeId: review.schemeId });

    if (benefitCount > 0 && eligCount > 0) {
      await Scheme.findByIdAndUpdate(review.schemeId, { extractionStatus: 'completed' });
    } else {
      await Scheme.findByIdAndUpdate(review.schemeId, { extractionStatus: 'partially_completed' });
    }
  }

  return review;
}
