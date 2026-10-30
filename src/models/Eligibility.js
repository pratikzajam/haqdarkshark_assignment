import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema(
  {
    concept: {
      type: String,
      required: true,
      trim: true
    },
    operator: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    evidence: {
      type: String,
      default: ''
    },
    isApprovedConcept: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const eligibilitySchema = new mongoose.Schema(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: [true, 'schemeId reference is required'],
      index: true
    },
    logicalExpression: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    conditions: [conditionSchema],
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
    collection: 'eligibilities'
  }
);

eligibilitySchema.index({ schemeId: 1, createdAt: -1 });

export const Eligibility = mongoose.model('Eligibility', eligibilitySchema);
