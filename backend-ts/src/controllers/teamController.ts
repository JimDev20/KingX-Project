import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { paramId, paramStr } from '../utils/helpers';

export async function createTeam(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Team name is required.' });
    return;
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

  const team = await prisma.team.create({
    data: { name, slug, ownerId: req.user!.userId },
  });

  await prisma.teamMember.create({
    data: { teamId: team.id, userId: req.user!.userId, role: 'admin' },
  });

  logger.info({ teamId: team.id, userId: req.user!.userId }, 'Team created');
  res.status(201).json({ team });
}

export async function getTeams(req: AuthRequest, res: Response): Promise<void> {
  const teams = await prisma.team.findMany({
    where: {
      members: { some: { userId: req.user!.userId } },
    },
    include: {
      _count: { select: { members: true, websites: true } },
      owner: { select: { id: true, email: true, fullName: true } },
    },
  });

  res.json({ teams });
}

export async function getTeam(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, fullName: true, avatar: true } } },
      },
      websites: { include: { _count: { select: { history: true } } } },
      owner: { select: { id: true, email: true, fullName: true } },
    },
  });

  if (!team) {
    res.status(404).json({ error: 'Team not found.' });
    return;
  }

  const isMember = team.members.some((m: { userId: string }) => m.userId === req.user!.userId);
  if (!isMember) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  res.json({ team });
}

export async function updateTeam(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const { name, logo } = req.body;

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ error: 'Team not found.' });
    return;
  }
  if (team.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Only the team owner can update the team.' });
    return;
  }

  const updated = await prisma.team.update({
    where: { id },
    data: { ...(name && { name }), ...(logo !== undefined && { logo }) },
  });

  res.json({ team: updated });
}

export async function deleteTeam(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ error: 'Team not found.' });
    return;
  }
  if (team.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Only the team owner can delete the team.' });
    return;
  }

  await prisma.team.delete({ where: { id } });
  logger.info({ teamId: id }, 'Team deleted');
  res.json({ message: 'Team deleted.' });
}

export async function inviteMember(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const { email, role } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ error: 'Team not found.' });
    return;
  }

  const isOwner = team.ownerId === req.user!.userId;
  const isAdmin = await prisma.teamMember.findFirst({
    where: { teamId: id, userId: req.user!.userId, role: 'admin' },
  });

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Only admins can invite members.' });
    return;
  }

  const userToInvite = await prisma.user.findUnique({ where: { email } });
  if (!userToInvite) {
    res.status(404).json({ error: 'No user with that email.' });
    return;
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: userToInvite.id } },
  });
  if (existingMember) {
    res.status(409).json({ error: 'User is already a team member.' });
    return;
  }

  const member = await prisma.teamMember.create({
    data: { teamId: id, userId: userToInvite.id, role: role || 'member' },
  });

  logger.info({ teamId: id, invitedUserId: userToInvite.id }, 'Member invited');
  res.status(201).json({ member });
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const memberId = paramStr(req, 'memberId');

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ error: 'Team not found.' });
    return;
  }

  const isOwner = team.ownerId === req.user!.userId;
  const isAdmin = await prisma.teamMember.findFirst({
    where: { teamId: id, userId: req.user!.userId, role: 'admin' },
  });

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Only admins can remove members.' });
    return;
  }

  if (memberId === team.ownerId) {
    res.status(400).json({ error: 'Cannot remove the team owner.' });
    return;
  }

  await prisma.teamMember.delete({ where: { id: memberId } });

  logger.info({ teamId: id, removedMemberId: memberId }, 'Member removed');
  res.json({ message: 'Member removed.' });
}
