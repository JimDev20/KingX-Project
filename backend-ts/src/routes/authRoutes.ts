import { Router } from 'express'
import { register, login, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.patch('/profile', authenticate, updateProfile)
router.put('/password', authenticate, changePassword)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
