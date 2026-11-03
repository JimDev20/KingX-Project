import { Response } from 'express'
import { UserRole } from '@prisma/client'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'

const VALID_ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPERADMIN']

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalSites, totalTeams, totalChecks] = await Promise.all([
      prisma.user.count(),
      prisma.website.count(),
      prisma.team.count(),
      prisma.websiteHistory.count(),
    ])

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    })

    res.json({
      stats: { totalUsers, totalSites, totalTeams, totalChecks },
      recentUsers,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100)

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count(),
    ])

    res.json({
      users,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.body.role as UserRole

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (user.role === 'SUPERADMIN' && role !== 'SUPERADMIN') {
      const superadminCount = await prisma.user.count({ where: { role: 'SUPERADMIN' } })
      if (superadminCount <= 1) {
        res.status(400).json({ error: 'At least one superadmin is required' })
        return
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true },
    })

    res.json({ user: updated })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
