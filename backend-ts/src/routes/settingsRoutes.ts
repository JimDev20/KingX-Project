import { Router } from 'express'
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  updateProfile,
  changePassword,
  updateSettings,
  getSettings,
} from '../controllers/settingsController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/api-keys', getApiKeys)
router.post('/api-keys', createApiKey)
router.delete('/api-keys/:id', revokeApiKey)
router.patch('/profile', updateProfile)
router.put('/password', changePassword)
router.patch('/', updateSettings)
router.get('/', getSettings)

export default router
