import { Router } from 'express'
import {
  createWebsite,
  deleteWebsite,
  getDashboardStats,
  getWebsite,
  listWebsiteHistory,
  listWebsites,
  runWebsiteCheck,
  updateWebsite,
} from '../controllers/websiteController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/stats', getDashboardStats)
router.get('/', listWebsites)
router.post('/', createWebsite)
router.get('/:id', getWebsite)
router.patch('/:id', updateWebsite)
router.delete('/:id', deleteWebsite)
router.post('/:id/check', runWebsiteCheck)
router.get('/:id/history', listWebsiteHistory)

export default router
