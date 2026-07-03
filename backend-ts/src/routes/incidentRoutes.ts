import { Router } from 'express'
import { list, get, resolve } from '../controllers/incidentController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', list)
router.get('/:id', get)
router.patch('/:id/resolve', resolve)

export default router
