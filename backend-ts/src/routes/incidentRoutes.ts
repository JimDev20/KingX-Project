import { Router } from 'express'
import { list, get, resolve, addUpdate, getUpdates } from '../controllers/incidentController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', list)
router.get('/:id', get)
router.patch('/:id/resolve', resolve)
router.get('/:id/updates', getUpdates)
router.post('/:id/updates', addUpdate)

export default router
