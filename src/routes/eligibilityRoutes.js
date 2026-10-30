import { Router } from 'express';
import { getEligibilityHandler } from '../controllers/eligibilityController.js';

const router = Router();

router.get('/', getEligibilityHandler);

export default router;
