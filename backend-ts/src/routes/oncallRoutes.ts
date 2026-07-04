import { Router } from 'express'
import { listSchedules, createSchedule, updateSchedule, deleteSchedule, addRotation, removeRotation, updateRotation } from '../controllers/oncallController'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', listSchedules)
router.post('/', createSchedule)
router.patch('/:id', updateSchedule)
router.delete('/:id', deleteSchedule)
router.post('/:id/rotations', addRotation)
router.patch('/:id/rotations/:rotationId', updateRotation)
router.delete('/:id/rotations/:rotationId', removeRotation)

export default router
