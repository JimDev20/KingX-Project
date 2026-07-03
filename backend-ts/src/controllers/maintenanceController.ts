import { Response } from 'express'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'

const websiteAccessWhere = (userId: string) => ({
  OR: [
    { userId },
    {
      team: {
        members: { some: { userId } },
      },
    },
  ],
})

const ensureMaintenanceWindow = async (id: string, userId: string) => {
  return prisma.maintenanceWindow.findFirst({
    where: {
      id,
      website: websiteAccessWhere(userId),
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
      website: websiteAccessWhere(userId),
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
    const { websiteId, label, startsAt, endsAt } = req.body

    if (!websiteId || !label || !startsAt || !endsAt) {
      res.status(400).json({ error: 'websiteId, label, startsAt, and endsAt are required' })
      return
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, ...websiteAccessWhere(userId) },
    })

    if (!website) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const maintenanceWindow = await prisma.maintenanceWindow.create({
      data: {
        websiteId,
        label,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
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

    const data: Record<string, unknown> = {}

    if (req.body.label !== undefined) data.label = req.body.label
    if (req.body.startsAt !== undefined) data.startsAt = new Date(req.body.startsAt)
    if (req.body.endsAt !== undefined) data.endsAt = new Date(req.body.endsAt)
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive

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
