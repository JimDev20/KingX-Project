import { Response } from 'express'
import { CheckMethod, WebsiteStatus, Prisma } from '@prisma/client'
import prisma from '../config/prisma'
import { AuthRequest } from '../middleware/auth'
import { checkWebsite } from '../services/monitorService'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

const normalizeUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

const parseMethod = (value: unknown): CheckMethod => {
  if (value === 'POST' || value === 'HEAD') return value as CheckMethod
  return 'GET'
}

const parseTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10)
}

const getRouteId = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? value[0] : value || ''
}

const calculateUptime = async (websiteId: string): Promise<number> => {
  const [total, up] = await Promise.all([
    prisma.websiteHistory.count({ where: { websiteId } }),
    prisma.websiteHistory.count({ where: { websiteId, status: 'UP' } }),
  ])

  if (total === 0) return 100
  return Number(((up / total) * 100).toFixed(2))
}

const websiteAccessWhere = (userId: string): Prisma.WebsiteWhereInput => ({
  OR: [
    { userId },
    {
      team: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  ],
})

const ensureWebsite = async (websiteId: string, userId: string) => {
  return prisma.website.findFirst({
    where: {
      id: websiteId,
      ...websiteAccessWhere(userId),
    },
  })
}

export const listWebsites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const status = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : ''

    const validStatuses: WebsiteStatus[] = ['UP', 'DOWN', 'PENDING', 'MAINTENANCE']

    const where: Prisma.WebsiteWhereInput = {
      ...websiteAccessWhere(userId),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { url: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(validStatuses.includes(status as WebsiteStatus) ? { status: status as WebsiteStatus } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.website.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.website.count({ where }),
    ])

    res.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('List websites error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createWebsite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const url = normalizeUrl(req.body.url)
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''

    if (!name || !url) {
      res.status(400).json({ error: 'Name and a valid http/https URL are required' })
      return
    }

    const teamId = typeof req.body.teamId === 'string' ? req.body.teamId : undefined

    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      })

      if (!membership) {
        res.status(403).json({ error: 'You must be a team member to add shared websites' })
        return
      }
    }

    const website = await prisma.website.create({
      data: {
        userId,
        teamId,
        name,
        url,
        method: parseMethod(req.body.method),
        checkInterval: Math.max(Number(req.body.checkInterval) || 300, 60),
        timeout: Math.max(Number(req.body.timeout) || 10000, 1000),
        tags: parseTags(req.body.tags),
      },
    })

    res.status(201).json({ website })
  } catch (error) {
    console.error('Create website error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getWebsite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const website = await ensureWebsite(getRouteId(req.params.id), req.userId!)

    if (!website) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    res.json({ website })
  } catch (error) {
    console.error('Get website error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateWebsite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await ensureWebsite(getRouteId(req.params.id), req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const data: Prisma.WebsiteUpdateInput = {}

    if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim()
    if (req.body.url !== undefined) {
      const url = normalizeUrl(req.body.url)
      if (!url) {
        res.status(400).json({ error: 'A valid http/https URL is required' })
        return
      }
      data.url = url
    }
    if (req.body.method !== undefined) data.method = parseMethod(req.body.method)
    if (req.body.checkInterval !== undefined) data.checkInterval = Math.max(Number(req.body.checkInterval) || 300, 60)
    if (req.body.timeout !== undefined) data.timeout = Math.max(Number(req.body.timeout) || 10000, 1000)
    if (req.body.tags !== undefined) data.tags = parseTags(req.body.tags)

    const website = await prisma.website.update({
      where: { id: existing.id },
      data,
    })

    res.json({ website })
  } catch (error) {
    console.error('Update website error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteWebsite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await ensureWebsite(getRouteId(req.params.id), req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    await prisma.website.delete({ where: { id: existing.id } })
    res.status(204).send()
  } catch (error) {
    console.error('Delete website error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const runWebsiteCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await ensureWebsite(getRouteId(req.params.id), req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const result = await checkWebsite(existing.url, existing.method, existing.timeout)

    const history = await prisma.websiteHistory.create({
      data: {
        websiteId: existing.id,
        status: result.status,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error,
      },
    })
    const uptime = await calculateUptime(existing.id)

    const website = await prisma.website.update({
      where: { id: existing.id },
      data: {
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: history.timestamp,
        uptime,
      },
    })

    res.json({ website, history })
  } catch (error) {
    console.error('Run website check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const listWebsiteHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await ensureWebsite(getRouteId(req.params.id), req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
    const history = await prisma.websiteHistory.findMany({
      where: { websiteId: existing.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    res.json({ history })
  } catch (error) {
    console.error('List website history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const [totalSites, upSites, downSites, pendingSites, responseAggregate] = await Promise.all([
      prisma.website.count({ where: websiteAccessWhere(userId) }),
      prisma.website.count({ where: { ...websiteAccessWhere(userId), status: 'UP' } }),
      prisma.website.count({ where: { ...websiteAccessWhere(userId), status: 'DOWN' } }),
      prisma.website.count({ where: { ...websiteAccessWhere(userId), status: 'PENDING' } }),
      prisma.website.aggregate({
        where: {
          ...websiteAccessWhere(userId),
          responseTime: { not: null },
        },
        _avg: { responseTime: true },
      }),
    ])

    const uptime = totalSites === 0 ? 100 : Number(((upSites / totalSites) * 100).toFixed(2))

    res.json({
      totalSites,
      upSites,
      downSites,
      pendingSites,
      uptime,
      averageResponseTime: Math.round(responseAggregate._avg.responseTime || 0),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
