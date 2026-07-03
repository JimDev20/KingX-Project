import { Router } from 'express'
import {
  listAlerts, getAlert, listAlertRules, createAlertRule,
  updateAlertRule, deleteAlertRule,
} from '../controllers/alertController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', listAlerts)
router.get('/rules', listAlertRules)
router.post('/rules', createAlertRule)
router.patch('/rules/:id', updateAlertRule)
router.delete('/rules/:id', deleteAlertRule)
router.get('/:id', getAlert)

export default router
