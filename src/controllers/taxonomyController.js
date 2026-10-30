import mongoose from 'mongoose';
import { TaxonomyProposal } from '../models/TaxonomyProposal.js';
import { getApprovedTaxonomy, addApprovedConcept } from '../data/taxonomy.js';
import { taxonomyProposalCreateSchema, taxonomyProposalPatchSchema } from '../validators/schemas.js';

/**
 * Get approved concepts, benefit categories, and operators
 * GET /api/taxonomy
 */
export async function getTaxonomyHandler(req, res, next) {
  try {
    const taxonomy = getApprovedTaxonomy();

    // Only query database if MongoDB connection is active
    let pendingProposals = [];
    if (mongoose.connection.readyState === 1) {
      pendingProposals = await TaxonomyProposal.find({ status: 'pending_approval' });
    }

    res.status(200).json({
      success: true,
      data: {
        approvedTaxonomy: taxonomy,
        pendingProposals
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit a proposal for a missing concept
 * POST /api/taxonomy/proposals
 */
export async function createTaxonomyProposalHandler(req, res, next) {
  try {
    const validated = taxonomyProposalCreateSchema.parse(req.body);

    const existing = await TaxonomyProposal.findOne({
      proposedConcept: validated.proposedConcept,
      status: 'pending_approval'
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'A proposal for this concept is already pending approval',
        data: existing
      });
    }

    const proposal = await TaxonomyProposal.create({
      proposedConcept: validated.proposedConcept,
      originalText: validated.originalText,
      reason: validated.reason,
      status: 'pending_approval'
    });

    res.status(201).json({
      success: true,
      message: 'Taxonomy proposal submitted successfully',
      data: proposal
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve or reject a taxonomy proposal
 * PATCH /api/taxonomy/proposals/:id
 * Only approved proposals may be added to the approved taxonomy.
 */
export async function patchTaxonomyProposalHandler(req, res, next) {
  try {
    const { id } = req.params;
    const validated = taxonomyProposalPatchSchema.parse(req.body);

    const proposal = await TaxonomyProposal.findById(id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: `Taxonomy proposal not found with id: ${id}`
      });
    }

    proposal.status = validated.status;
    await proposal.save();

    // Strict governance: Only approved proposals may be added to approved taxonomy
    let taxonomyUpdated = false;
    if (validated.status === 'approved') {
      taxonomyUpdated = addApprovedConcept(proposal.proposedConcept, {
        proposalId: proposal._id,
        reason: proposal.reason
      });
    }

    res.status(200).json({
      success: true,
      message: `Taxonomy proposal has been ${validated.status}`,
      data: {
        proposal,
        taxonomyUpdated,
        currentTaxonomy: getApprovedTaxonomy()
      }
    });
  } catch (error) {
    next(error);
  }
}
