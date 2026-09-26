import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getPricing,
  updatePricingCap,
} from '../controllers/materialController';

const router = Router();

router.get('/', authenticate, listMaterials);
router.get('/pricing', authenticate, requireRole('admin'), getPricing);
router.put('/pricing/cap', authenticate, requireRole('admin'), updatePricingCap);
router.get('/:id', authenticate, getMaterial);
router.post('/', authenticate, requireRole('mentor', 'admin'), createMaterial);
router.put('/:id', authenticate, requireRole('mentor', 'admin'), updateMaterial);
router.delete('/:id', authenticate, requireRole('mentor', 'admin'), deleteMaterial);

export default router;
