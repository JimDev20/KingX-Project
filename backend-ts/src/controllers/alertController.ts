import { Response } from 'express'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'

export const listAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100)

    const [items, total] = await Promise.all([
      prisma.alert.findMany({
        where: { userId },
        include: { website: { select: { name: true, url: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.alert.count({ where: { userId } }),
    ])

    const onCallUserIds = [...new Set(items.filter(a => a.onCallUserId).map(a => a.onCallUserId!))]
    const onCallUsers = onCallUserIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: onCallUserIds } }, select: { id: true, fullName: true, email: true } })
      : []

    const enriched = items.map(a => ({
      ...a,
      onCallUser: a.onCallUserId ? onCallUsers.find(u => u.id === a.onCallUserId) || null : null,
    }))

    res.json({
      items: enriched,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('List alerts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alert = await prisma.alert.findFirst({
      where: { id: req.params.id as string, userId: req.userId! },
      include: { website: { select: { name: true, url: true } } },
    })

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' })
      return
    }

    res.json({ alert })
  } catch (error) {
    console.error('Get alert error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const listAlertRules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const websiteId = req.query.websiteId as string | undefined
    const where = websiteId
      ? { website: { userId: req.userId!, id: websiteId } }
      : { website: { userId: req.userId! } }

    const rules = await prisma.alertRule.findMany({
      where,
      include: { website: { select: { name: true, url: true } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ items: rules })
  } catch (error) {
    console.error('List alert rules error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const { websiteId, type, target, condition } = req.body

    if (!websiteId || !type) {
      res.status(400).json({ error: 'websiteId and type are required' })
      return
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId },
    })

    if (!website) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const rule = await prisma.alertRule.create({
      data: {
        websiteId,
        userId,
        type,
        target: typeof target === 'string' ? target : '',
        condition: typeof condition === 'string' ? condition : undefined,
        enabled: true,
      },
      include: { website: { select: { name: true, url: true } } },
    })

    res.status(201).json({ rule })
  } catch (error) {
    console.error('Create alert rule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.alertRule.findFirst({
      where: { id: req.params.id as string, website: { userId: req.userId! } },
    })

    if (!existing) {
      res.status(404).json({ error: 'Alert rule not found' })
      return
    }

    const data: Record<string, unknown> = {}

    if (req.body.type !== undefined) data.type = req.body.type
    if (req.body.target !== undefined) data.target = req.body.target
    if (req.body.enabled !== undefined) data.enabled = req.body.enabled
    if (req.body.condition !== undefined) data.condition = req.body.condition

    const rule = await prisma.alertRule.update({
      where: { id: existing.id },
      data,
      include: { website: { select: { name: true, url: true } } },
    })

    res.json({ rule })
  } catch (error) {
    console.error('Update alert rule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.alertRule.findFirst({
      where: { id: req.params.id as string, website: { userId: req.userId! } },
    })

    if (!existing) {
      res.status(404).json({ error: 'Alert rule not found' })
      return
    }

    await prisma.alertRule.delete({ where: { id: existing.id } })
    res.status(204).send()
  } catch (error) {
    console.error('Delete alert rule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
