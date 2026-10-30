import mongoose from 'mongoose';

const taxonomyProposalSchema = new mongoose.Schema(
  {
    proposedConcept: {
      type: String,
      required: [true, 'Proposed concept is required'],
      trim: true,
      lowercase: true,
      index: true
    },
    originalText: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      default: 'Unknown concept detected in scheme eligibility text that is not in approved taxonomy'
    },
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'pending_approval',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'taxonomyproposals'
  }
);

taxonomyProposalSchema.index({ status: 1, createdAt: -1 });

export const TaxonomyProposal = mongoose.model('TaxonomyProposal', taxonomyProposalSchema);
