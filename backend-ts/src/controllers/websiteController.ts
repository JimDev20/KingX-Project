import { Response } from 'express';
import axios from 'axios';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { queryString, queryInt, paramId } from '../utils/helpers';

export async function createWebsite(req: AuthRequest, res: Response): Promise<void> {
  const { name, url, method, checkInterval, timeout, tags, teamId } = req.body;

  if (!name || !url) {
    res.status(400).json({ error: 'Name and URL are required.' });
    return;
  }

  if (teamId) {
    const isMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: req.user!.userId } },
    });
    if (!isMember) {
      res.status(403).json({ error: 'You are not a member of this team.' });
      return;
    }
  }

  const website = await prisma.website.create({
    data: {
      name,
      url,
      method: method || 'GET',
      checkInterval: checkInterval || 300,
      timeout: timeout || 30000,
      tags: tags || [],
      userId: req.user!.userId,
      ...(teamId && { teamId }),
    },
  });

  logger.info({ websiteId: website.id, url }, 'Website created');
  res.status(201).json({ website });
}

export async function getWebsites(req: AuthRequest, res: Response): Promise<void> {
  const search = queryString(req, 'search');
  const status = queryString(req, 'status');
  const tag = queryString(req, 'tag');
  const teamId = queryString(req, 'teamId');
  const pageNum = queryInt(req, 'page', 1);
  const limitNum = queryInt(req, 'limit', 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    OR: [
      { userId: req.user!.userId },
      { team: { members: { some: { userId: req.user!.userId } } } },
    ],
  };

  if (teamId) where.teamId = teamId;
  if (status) where.status = status;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { url: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [websites, total] = await Promise.all([
    prisma.website.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { history: true, alerts: true } },
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.website.count({ where }),
  ]);

  res.json({
    websites,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function getWebsite(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);

  const website = await prisma.website.findUnique({
    where: { id },
    include: {
      _count: { select: { history: true, alerts: true } },
      team: { select: { id: true, name: true } },
      alertRules: true,
    },
  });

  if (!website) {
    res.status(404).json({ error: 'Website not found.' });
    return;
  }

  const isOwner = website.userId === req.user!.userId;
  const isTeamMember = website.teamId
    ? await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: website.teamId, userId: req.user!.userId } },
      })
    : null;

  if (!isOwner && !isTeamMember) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  res.json({ website });
}

export async function updateWebsite(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const { name, url, method, checkInterval, timeout, tags, status } = req.body;

  const website = await prisma.website.findUnique({ where: { id } });
  if (!website) {
    res.status(404).json({ error: 'Website not found.' });
    return;
  }

  const isOwner = website.userId === req.user!.userId;
  const isTeamAdmin = website.teamId
    ? await prisma.teamMember.findFirst({
        where: { teamId: website.teamId, userId: req.user!.userId, role: 'admin' },
      })
    : null;

  if (!isOwner && !isTeamAdmin) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const updated = await prisma.website.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(url && { url }),
      ...(method && { method }),
      ...(checkInterval && { checkInterval }),
      ...(timeout && { timeout }),
      ...(tags && { tags }),
      ...(status && { status }),
    },
  });

  res.json({ website: updated });
}

export async function deleteWebsite(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const website = await prisma.website.findUnique({ where: { id } });

  if (!website) {
    res.status(404).json({ error: 'Website not found.' });
    return;
  }

  const isOwner = website.userId === req.user!.userId;
  const isTeamAdmin = website.teamId
    ? await prisma.teamMember.findFirst({
        where: { teamId: website.teamId, userId: req.user!.userId, role: 'admin' },
      })
    : null;

  if (!isOwner && !isTeamAdmin) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  await prisma.website.delete({ where: { id } });
  logger.info({ websiteId: id }, 'Website deleted');
  res.json({ message: 'Website deleted.' });
}

export async function checkWebsite(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const website = await prisma.website.findUnique({ where: { id } });

  if (!website) {
    res.status(404).json({ error: 'Website not found.' });
    return;
  }

  const startTime = Date.now();
  let statusCode = 0;
  let errorMsg: string | null = null;

  try {
    const response = await axios({
      method: website.method.toLowerCase() as 'get' | 'post' | 'head',
      url: website.url,
      timeout: website.timeout,
      validateStatus: () => true,
      headers: { 'User-Agent': 'KingX-Uptime-Monitor/1.0' },
    });
    statusCode = response.status;
  } catch (err: any) {
    errorMsg = err.message;
    statusCode = err.response?.status || 0;
  }

  const responseTime = Date.now() - startTime;
  const newStatus = statusCode >= 200 && statusCode < 400 ? 'up' : 'down';

  const [history] = await Promise.all([
    prisma.websiteHistory.create({
      data: {
        websiteId: id,
        status: newStatus,
        responseTime,
        statusCode,
        error: errorMsg,
        duration: newStatus === 'down' ? website.checkInterval : 0,
      },
    }),
    prisma.website.update({
      where: { id },
      data: {
        status: newStatus,
        lastChecked: new Date(),
        responseTime,
      },
    }),
  ]);

  res.json({ history, status: newStatus, responseTime, statusCode });
}

export async function getWebsiteHistory(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const days = queryInt(req, 'days', 7);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const history = await prisma.websiteHistory.findMany({
    where: {
      websiteId: id,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });

  const uptimeEntries = history.filter((h) => h.status === 'up').length;
  const totalEntries = history.length;
  const uptimePercentage = totalEntries > 0 ? ((uptimeEntries / totalEntries) * 100).toFixed(2) : '100.00';
  const avgResponseTime = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + (h.responseTime || 0), 0) / history.length)
    : 0;
  const downtimeCount = history.filter((h) => h.status === 'down').length;

  res.json({
    history,
    stats: { uptimePercentage, averageResponseTime: avgResponseTime, downtimeCount, totalChecks: totalEntries },
  });
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const [totalSites, upSites, downSites, recentAlerts] = await Promise.all([
    prisma.website.count({
      where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
    }),
    prisma.website.count({
      where: { status: 'up', OR: [{ userId }, { team: { members: { some: { userId } } } }] },
    }),
    prisma.website.count({
      where: { status: 'down', OR: [{ userId }, { team: { members: { some: { userId } } } }] },
    }),
    prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { website: { select: { name: true, url: true } } },
    }),
  ]);

  const allWebsites = await prisma.website.findMany({
    where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
    select: { uptime: true, responseTime: true },
  });

  const avgUptime = allWebsites.length > 0
    ? (allWebsites.reduce((sum, w) => sum + Number(w.uptime || 0), 0) / allWebsites.length).toFixed(2)
    : '100.00';
  const avgResponseTime = allWebsites.length > 0
    ? Math.round(allWebsites.reduce((sum, w) => sum + (w.responseTime || 0), 0) / allWebsites.length)
    : 0;

  res.json({
    stats: {
      totalSites,
      upSites,
      downSites,
      pendingSites: totalSites - upSites - downSites,
      averageUptime: avgUptime,
      averageResponseTime: avgResponseTime,
    },
    recentAlerts,
  });
}
