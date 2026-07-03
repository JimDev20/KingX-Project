import { Router } from 'express'
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  removeTeamMember,
  updateTeamMember,
} from '../controllers/teamController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', listTeams)
router.post('/', createTeam)
router.get('/:id', getTeam)
router.delete('/:id', deleteTeam)
router.post('/:id/members', addTeamMember)
router.patch('/:id/members/:memberId', updateTeamMember)
router.delete('/:id/members/:memberId', removeTeamMember)

export default router
