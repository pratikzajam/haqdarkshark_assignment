import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      index: true
    },
    originalBenefitText: {
      type: String,
      default: ''
    },
    originalEligibilityText: {
      type: String,
      default: ''
    },
    sourceDocument: {
      type: String,
      default: null
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'partially_completed', 'needs_review', 'failed'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'schemes'
  }
);

export const Scheme = mongoose.model('Scheme', schemeSchema);
