import { Router } from 'express';
import { createApiKey, getApiKeys, deleteApiKey } from '../controllers/apiKeyController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(createApiKey));
router.get('/', asyncHandler(getApiKeys));
router.delete('/:id', asyncHandler(deleteApiKey));

export default router;
