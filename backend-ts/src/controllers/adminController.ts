import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { queryString, queryInt, paramId } from '../utils/helpers';

export async function getAdminStats(req: AuthRequest, res: Response): Promise<void> {
  const [totalUsers, totalWebsites, totalTeams, totalAlerts, recentUsers, recentWebsites] = await Promise.all([
    prisma.user.count(),
    prisma.website.count(),
    prisma.team.count(),
    prisma.alert.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    }),
    prisma.website.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
  ]);

  res.json({ stats: { totalUsers, totalWebsites, totalTeams, totalAlerts }, recentUsers, recentWebsites });
}

export async function getAllUsers(req: AuthRequest, res: Response): Promise<void> {
  const search = queryString(req, 'search');
  const role = queryString(req, 'role');
  const pageNum = queryInt(req, 'page', 1);
  const limitNum = queryInt(req, 'limit', 10);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true,
        _count: { select: { websites: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}

export async function updateUserRole(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const { role } = req.body;

  if (!['user', 'admin', 'superadmin'].includes(role)) {
    res.status(400).json({ error: 'Invalid role.' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, fullName: true, role: true },
  });

  logger.info({ updatedUserId: id, newRole: role, byUserId: req.user!.userId }, 'User role updated');
  res.json({ user });
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);

  if (id === req.user!.userId) {
    res.status(400).json({ error: 'Cannot delete yourself.' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  logger.info({ deletedUserId: id, byUserId: req.user!.userId }, 'User deleted by admin');
  res.json({ message: 'User deleted.' });
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const userId = queryString(req, 'userId');
  const action = queryString(req, 'action');
  const pageNum = queryInt(req, 'page', 1);
  const limitNum = queryInt(req, 'limit', 20);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { email: true, fullName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    logs,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}
