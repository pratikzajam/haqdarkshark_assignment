import { Router } from 'express';
import {
  getTaxonomyHandler,
  createTaxonomyProposalHandler,
  patchTaxonomyProposalHandler
} from '../controllers/taxonomyController.js';

const router = Router();

router.get('/', getTaxonomyHandler);
router.post('/proposals', createTaxonomyProposalHandler);
router.patch('/proposals/:id', patchTaxonomyProposalHandler);

export default router;
