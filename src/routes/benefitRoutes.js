import { Router } from 'express';
import { getBenefitsHandler } from '../controllers/benefitController.js';

const router = Router();

router.get('/', getBenefitsHandler);

export default router;
