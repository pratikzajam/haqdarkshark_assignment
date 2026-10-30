import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: [true, 'schemeId reference is required'],
      index: true
    },
    field: {
      type: String,
      required: [true, 'Field name under review is required'],
      trim: true
    },
    originalText: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      required: [true, 'Review reason is required']
    },
    extractionMethod: {
      type: String,
      default: 'hybrid'
    },
    proposedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    reviewerComment: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'reviews'
  }
);

reviewSchema.index({ status: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
