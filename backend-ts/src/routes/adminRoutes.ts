import { Router } from 'express';
import { getAdminStats, getAllUsers, updateUserRole, deleteUser, getAuditLogs } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'superadmin'));

router.get('/stats', asyncHandler(getAdminStats));
router.get('/users', asyncHandler(getAllUsers));
router.patch('/users/:id/role', asyncHandler(updateUserRole));
router.delete('/users/:id', asyncHandler(deleteUser));
router.get('/logs', asyncHandler(getAuditLogs));

export default router;
