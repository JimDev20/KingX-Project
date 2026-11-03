import { Response } from 'express'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'
import { websiteReadWhere, websiteWriteWhere } from '../utils/access'

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100)

    const where = {
      website: websiteReadWhere(userId),
    }

    const [items, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: { website: { select: { name: true, url: true } } },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.incident.count({ where }),
    ])

    res.json({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('List incidents error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const get = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findFirst({
      where: {
        id: req.params.id as string,
        website: websiteReadWhere(req.userId!),
      },
      include: { website: { select: { name: true, url: true } } },
    })

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' })
      return
    }

    res.json({ incident })
  } catch (error) {
    console.error('Get incident error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const resolve = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findFirst({
      where: {
        id: req.params.id as string,
        website: websiteWriteWhere(req.userId!),
      },
    })

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' })
      return
    }

    if (incident.endedAt) {
      res.status(400).json({ error: 'Incident is already resolved' })
      return
    }

    const endedAt = new Date()
    const duration = Math.floor((endedAt.getTime() - incident.startedAt.getTime()) / 1000)

    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: { endedAt, duration },
      include: { website: { select: { name: true, url: true } } },
    })

    res.json({ incident: updated })
  } catch (error) {
    console.error('Resolve incident error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const addUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findFirst({
      where: {
        id: req.params.id as string,
        website: websiteWriteWhere(req.userId!),
      },
    })

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' })
      return
    }

    const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''

    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId: incident.id,
        message,
        status: req.body.status || 'UPDATED',
      },
    })

    res.status(201).json({ update })
  } catch (error) {
    console.error('Add incident update error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getUpdates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await prisma.incident.findFirst({
      where: {
        id: req.params.id as string,
        website: websiteReadWhere(req.userId!),
      },
    })

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' })
      return
    }

    const updates = await prisma.incidentUpdate.findMany({
      where: { incidentId: incident.id },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ updates })
  } catch (error) {
    console.error('Get incident updates error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
