import { Router, Response, NextFunction } from 'express'
import { getDashboard, listUsers, updateUserRole } from '../controllers/adminController'
import { authenticate, AuthRequest } from '../middleware/auth'
import prisma from '../config/prisma'

const requireSuperadmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { role: true },
    })

    if (!user || user.role !== 'SUPERADMIN') {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    next()
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}

const router = Router()

router.use(authenticate)
router.use(requireSuperadmin)

router.get('/dashboard', getDashboard)
router.get('/users', listUsers)
router.patch('/users/:id/role', updateUserRole)

export default router
