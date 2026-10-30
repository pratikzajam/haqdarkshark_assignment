import { Router } from 'express';
import {
  getReviewsHandler,
  patchReviewHandler
} from '../controllers/reviewController.js';

const router = Router();

router.get('/', getReviewsHandler);
router.patch('/:id', patchReviewHandler);

export default router;
