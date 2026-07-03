import { Router } from 'express';
import { createWebsite, getWebsites, getWebsite, updateWebsite, deleteWebsite, checkWebsite, getWebsiteHistory, getDashboardStats } from '../controllers/websiteController';
import { getAlerts, createAlertRule, getAlertRules, deleteAlertRule } from '../controllers/alertController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncHandler(getDashboardStats));

router.post('/', asyncHandler(createWebsite));
router.get('/', asyncHandler(getWebsites));
router.get('/:id', asyncHandler(getWebsite));
router.patch('/:id', asyncHandler(updateWebsite));
router.delete('/:id', asyncHandler(deleteWebsite));
router.post('/:id/check', asyncHandler(checkWebsite));
router.get('/:id/history', asyncHandler(getWebsiteHistory));

router.get('/:id/alerts', asyncHandler(getAlerts));
router.post('/:websiteId/alerts/rules', asyncHandler(createAlertRule));
router.get('/:websiteId/alerts/rules', asyncHandler(getAlertRules));
router.delete('/alerts/rules/:id', asyncHandler(deleteAlertRule));

export default router;
