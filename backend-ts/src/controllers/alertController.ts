import { Response } from 'express'
import { AlertType } from '@prisma/client'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'
import { websiteReadWhere, websiteWriteWhere } from '../utils/access'

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

const ALERT_TYPES: AlertType[] = ['EMAIL', 'SMS', 'SLACK', 'DISCORD', 'TELEGRAM']
const MAX_RECIPIENTS = 10
const MAX_THRESHOLD = 100

const parseAlertType = (value: unknown): AlertType | null => {
  return typeof value === 'string' && ALERT_TYPES.includes(value as AlertType) ? value as AlertType : null
}

const parseRecipients = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_RECIPIENTS)
}

const parseThreshold = (value: unknown): number => {
  const threshold = Number(value)
  if (!Number.isFinite(threshold)) return 1
  return Math.min(Math.max(Math.floor(threshold), 1), MAX_THRESHOLD)
}

export const listAlertRules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const websiteId = typeof req.query.websiteId === 'string' ? req.query.websiteId : undefined
    const where = {
      website: {
        ...websiteReadWhere(req.userId!),
        ...(websiteId ? { id: websiteId } : {}),
      },
    }

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
    const websiteId = typeof req.body.websiteId === 'string' ? req.body.websiteId : ''
    const type = parseAlertType(req.body.type)
    const recipients = parseRecipients(req.body.recipients)
    const threshold = parseThreshold(req.body.threshold)

    if (!websiteId || !type || recipients.length === 0) {
      res.status(400).json({ error: 'websiteId, a valid type, and at least one recipient are required' })
      return
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, ...websiteWriteWhere(userId) },
    })

    if (!website) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const rule = await prisma.alertRule.create({
      data: {
        websiteId: website.id,
        type,
        recipients,
        threshold,
        isEnabled: true,
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
      where: { id: req.params.id as string, website: websiteWriteWhere(req.userId!) },
    })

    if (!existing) {
      res.status(404).json({ error: 'Alert rule not found' })
      return
    }

    const data: { type?: AlertType; recipients?: string[]; threshold?: number; isEnabled?: boolean } = {}

    if (req.body.type !== undefined) {
      const type = parseAlertType(req.body.type)
      if (!type) {
        res.status(400).json({ error: 'Invalid alert type' })
        return
      }
      data.type = type
    }
    if (req.body.recipients !== undefined) {
      const recipients = parseRecipients(req.body.recipients)
      if (recipients.length === 0) {
        res.status(400).json({ error: 'At least one recipient is required' })
        return
      }
      data.recipients = recipients
    }
    if (req.body.threshold !== undefined) data.threshold = parseThreshold(req.body.threshold)
    if (typeof req.body.isEnabled === 'boolean') data.isEnabled = req.body.isEnabled

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
      where: { id: req.params.id as string, website: websiteWriteWhere(req.userId!) },
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
