import { Router } from 'express';
import { createTeam, getTeams, getTeam, updateTeam, deleteTeam, inviteMember, removeMember } from '../controllers/teamController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(createTeam));
router.get('/', asyncHandler(getTeams));
router.get('/:id', asyncHandler(getTeam));
router.patch('/:id', asyncHandler(updateTeam));
router.delete('/:id', asyncHandler(deleteTeam));
router.post('/:id/invite', asyncHandler(inviteMember));
router.delete('/:id/members/:memberId', asyncHandler(removeMember));

export default router;
