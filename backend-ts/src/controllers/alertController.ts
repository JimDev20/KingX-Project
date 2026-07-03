import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { queryString, queryInt, paramId } from '../utils/helpers';

export async function getAlerts(req: AuthRequest, res: Response): Promise<void> {
  const websiteId = queryString(req, 'websiteId');
  const status = queryString(req, 'status');
  const type = queryString(req, 'type');
  const pageNum = queryInt(req, 'page', 1);
  const limitNum = queryInt(req, 'limit', 10);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (websiteId) where.websiteId = websiteId;
  if (status) where.status = status;
  if (type) where.type = type;

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { website: { select: { name: true, url: true } } },
    }),
    prisma.alert.count({ where }),
  ]);

  res.json({
    alerts,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}

export async function createAlertRule(req: AuthRequest, res: Response): Promise<void> {
  const { websiteId, type, target, condition } = req.body;

  if (!websiteId || !target) {
    res.status(400).json({ error: 'Website ID and target are required.' });
    return;
  }

  const website = await prisma.website.findUnique({ where: { id: websiteId } });
  if (!website) {
    res.status(404).json({ error: 'Website not found.' });
    return;
  }

  const rule = await prisma.alertRule.create({
    data: {
      websiteId,
      userId: req.user!.userId,
      type: type || 'email',
      target,
      condition: condition || 'down',
    },
  });

  logger.info({ ruleId: rule.id }, 'Alert rule created');
  res.status(201).json({ rule });
}

export async function getAlertRules(req: AuthRequest, res: Response): Promise<void> {
  const websiteId = queryString(req, 'websiteId');
  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (websiteId) where.websiteId = websiteId;

  const rules = await prisma.alertRule.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ rules });
}

export async function deleteAlertRule(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const rule = await prisma.alertRule.findUnique({ where: { id } });

  if (!rule) {
    res.status(404).json({ error: 'Alert rule not found.' });
    return;
  }
  if (rule.userId !== req.user!.userId) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  await prisma.alertRule.delete({ where: { id } });
  res.json({ message: 'Alert rule deleted.' });
}
