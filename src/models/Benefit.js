import mongoose from 'mongoose';

const benefitSchema = new mongoose.Schema(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: [true, 'schemeId reference is required'],
      index: true
    },
    category: {
      type: String,
      default: null,
      trim: true
    },
    type: {
      type: String,
      default: null,
      trim: true
    },
    amount: {
      type: Number,
      default: null
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true
    },
    frequency: {
      type: String,
      default: null,
      trim: true
    },
    instalments: {
      type: Number,
      default: null
    },
    originalText: {
      type: String,
      required: true
    },
    extractionMethod: {
      type: String,
      enum: ['rule_based', 'gemini_ai', 'hybrid'],
      default: 'hybrid'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    }
  },
  {
    timestamps: true,
    collection: 'benefits'
  }
);

benefitSchema.index({ schemeId: 1, createdAt: -1 });

export const Benefit = mongoose.model('Benefit', benefitSchema);
