import { Response } from 'express'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'
import { websiteReadWhere, websiteWriteWhere } from '../utils/access'

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const ensureMaintenanceWindow = async (id: string, userId: string) => {
  return prisma.maintenanceWindow.findFirst({
    where: {
      id,
      website: websiteWriteWhere(userId),
    },
    include: { website: { select: { name: true, url: true } } },
  })
}

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100)

    const where = {
      website: websiteReadWhere(userId),
    }

    const [items, total] = await Promise.all([
      prisma.maintenanceWindow.findMany({
        where,
        include: { website: { select: { name: true, url: true } } },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenanceWindow.count({ where }),
    ])

    res.json({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('List maintenance windows error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const websiteId = typeof req.body.websiteId === 'string' ? req.body.websiteId : ''
    const label = typeof req.body.label === 'string' ? req.body.label.trim() : ''
    const startsAt = parseDate(req.body.startsAt)
    const endsAt = parseDate(req.body.endsAt)

    if (!websiteId || !label || label.length > 120 || !startsAt || !endsAt || startsAt >= endsAt) {
      res.status(400).json({ error: 'A website, label, and valid start/end times are required' })
      return
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, ...websiteWriteWhere(userId) },
    })

    if (!website) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const maintenanceWindow = await prisma.maintenanceWindow.create({
      data: {
        websiteId,
        label,
        startsAt,
        endsAt,
      },
      include: { website: { select: { name: true, url: true } } },
    })

    res.status(201).json({ maintenanceWindow })
  } catch (error) {
    console.error('Create maintenance window error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await ensureMaintenanceWindow(req.params.id as string, req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Maintenance window not found' })
      return
    }

    const startsAt = req.body.startsAt !== undefined ? parseDate(req.body.startsAt) : existing.startsAt
    const endsAt = req.body.endsAt !== undefined ? parseDate(req.body.endsAt) : existing.endsAt

    if (!startsAt || !endsAt || startsAt >= endsAt) {
      res.status(400).json({ error: 'A valid start time before the end time is required' })
      return
    }

    const data: { label?: string; startsAt?: Date; endsAt?: Date; isActive?: boolean } = {}

    if (req.body.label !== undefined) {
      const label = typeof req.body.label === 'string' ? req.body.label.trim() : ''
      if (!label || label.length > 120) {
        res.status(400).json({ error: 'A label of 120 characters or fewer is required' })
        return
      }
      data.label = label
    }
    data.startsAt = startsAt
    data.endsAt = endsAt
    if (typeof req.body.isActive === 'boolean') data.isActive = req.body.isActive

    const maintenanceWindow = await prisma.maintenanceWindow.update({
      where: { id: existing.id },
      data,
      include: { website: { select: { name: true, url: true } } },
    })

    res.json({ maintenanceWindow })
  } catch (error) {
    console.error('Update maintenance window error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await ensureMaintenanceWindow(req.params.id as string, req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Maintenance window not found' })
      return
    }

    await prisma.maintenanceWindow.delete({ where: { id: existing.id } })
    res.status(204).send()
  } catch (error) {
    console.error('Delete maintenance window error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
