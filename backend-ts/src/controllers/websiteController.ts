import { Response } from 'express'
import { CheckMethod, KeywordCheckType, WebsiteStatus, Prisma } from '@prisma/client'
import prisma from '../config/prisma'
import { AuthRequest } from '../middleware/auth'
import { checkWebsite } from '../services/monitorService'
import { websiteReadWhere as websiteAccessWhere, websiteWriteWhere } from '../utils/access'
import { normalizeMonitorUrl } from '../utils/url'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

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

const parseKeywordCheck = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  return value.trim().slice(0, 200) || null
}

const parseKeywordType = (value: unknown): KeywordCheckType | null => {
  if (value === 'CONTAINS' || value === 'NOT_CONTAINS') return value as KeywordCheckType
  return null
}

const parseCheckInterval = (value: unknown): number => {
  const interval = Number(value)
  if (!Number.isFinite(interval)) return 300
  return Math.min(Math.max(Math.floor(interval), 60), 86400)
}

const parseTimeout = (value: unknown): number => {
  const timeout = Number(value)
  if (!Number.isFinite(timeout)) return 10000
  return Math.min(Math.max(Math.floor(timeout), 1000), 60000)
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

const ensureWebsite = async (websiteId: string, userId: string) => {
  return prisma.website.findFirst({
    where: {
      id: websiteId,
      ...websiteAccessWhere(userId),
    },
  })
}

const ensureWebsiteWrite = async (websiteId: string, userId: string) => {
  return prisma.website.findFirst({
    where: {
      id: websiteId,
      ...websiteWriteWhere(userId),
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
    const url = normalizeMonitorUrl(req.body.url)
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''

    if (!name || name.length > 100 || !url) {
      res.status(400).json({ error: 'A name of 100 characters or fewer and a valid public http/https URL are required' })
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

      if (!membership || membership.role === 'VIEWER') {
        res.status(403).json({ error: 'You must be a team owner, admin, or member to add shared websites' })
        return
      }
    }

    const keywordCheck = parseKeywordCheck(req.body.keywordCheck)

    const website = await prisma.website.create({
      data: {
        userId,
        teamId,
        name,
        url,
        method: parseMethod(req.body.method),
        checkInterval: parseCheckInterval(req.body.checkInterval),
        timeout: parseTimeout(req.body.timeout),
        tags: parseTags(req.body.tags),
        keywordCheck,
        keywordType: keywordCheck ? parseKeywordType(req.body.keywordType) ?? 'CONTAINS' : null,
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
    const existing = await ensureWebsiteWrite(getRouteId(req.params.id), req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const data: Prisma.WebsiteUpdateInput = {}

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      if (req.body.name.trim().length > 100) {
        res.status(400).json({ error: 'Name must be 100 characters or fewer' })
        return
      }
      data.name = req.body.name.trim()
    }
    if (req.body.url !== undefined) {
      const url = normalizeMonitorUrl(req.body.url)
      if (!url) {
        res.status(400).json({ error: 'A valid public http/https URL is required' })
        return
      }
      data.url = url
    }
    if (req.body.method !== undefined) data.method = parseMethod(req.body.method)
    if (req.body.checkInterval !== undefined) data.checkInterval = parseCheckInterval(req.body.checkInterval)
    if (req.body.timeout !== undefined) data.timeout = parseTimeout(req.body.timeout)
    if (req.body.tags !== undefined) data.tags = parseTags(req.body.tags)
    if (req.body.keywordCheck !== undefined) {
      data.keywordCheck = parseKeywordCheck(req.body.keywordCheck)
      if (!data.keywordCheck) data.keywordType = null
    }
    if (req.body.keywordType !== undefined) {
      const keywordType = parseKeywordType(req.body.keywordType)
      if (req.body.keywordType && !keywordType) {
        res.status(400).json({ error: 'Invalid keyword type' })
        return
      }
      data.keywordType = keywordType
    }

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
    const existing = await ensureWebsiteWrite(getRouteId(req.params.id), req.userId!)

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
    const existing = await ensureWebsiteWrite(getRouteId(req.params.id), req.userId!)

    if (!existing) {
      res.status(404).json({ error: 'Website not found' })
      return
    }

    const result = await checkWebsite({
      url: existing.url,
      method: existing.method,
      timeout: existing.timeout,
      keywordCheck: existing.keywordCheck,
      keywordType: existing.keywordType,
    })

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
