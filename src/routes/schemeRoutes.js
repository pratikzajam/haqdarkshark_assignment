import { Router } from 'express';
import {
  extractSchemeHandler,
  getSchemesHandler,
  getSchemeByIdHandler
} from '../controllers/schemeController.js';

const router = Router();

router.post('/extract', extractSchemeHandler);
router.get('/', getSchemesHandler);
router.get('/:id', getSchemeByIdHandler);

export default router;
