import { Response } from 'express'
import { Prisma, TeamMemberRole } from '@prisma/client'
import prisma from '../config/prisma'
import { AuthRequest } from '../middleware/auth'

const slugify = (value: string) => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `team-${Date.now()}`
}

const getRouteId = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? value[0] : value || ''
}

const parseRole = (value: unknown): TeamMemberRole => {
  if (value === 'admin' || value === 'viewer') return value as TeamMemberRole
  return 'member'
}

const getMembership = async (teamId: string, userId: string) => {
  return prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  })
}

const requireTeamAdmin = async (teamId: string, userId: string) => {
  const [membership, team] = await Promise.all([
    getMembership(teamId, userId),
    prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } }),
  ])
  return team?.ownerId === userId || membership?.role === 'admin'
}

const teamInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  _count: {
    select: {
      websites: true,
    },
  },
} satisfies Prisma.TeamInclude

export const listTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: req.userId!,
          },
        },
      },
      include: teamInclude,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ teams })
  } catch (error) {
    console.error('List teams error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''

    if (!name) {
      res.status(400).json({ error: 'Team name is required' })
      return
    }

    const baseSlug = slugify(req.body.slug || name)
    const slug = `${baseSlug}-${Date.now().toString(36)}`

    const team = await prisma.team.create({
      data: {
        name,
        slug,
        ownerId: req.userId!,
        members: {
          create: {
            userId: req.userId!,
            role: 'admin',
          },
        },
      },
      include: teamInclude,
    })

    res.status(201).json({ team })
  } catch (error) {
    console.error('Create team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = getRouteId(req.params.id)
    const membership = await getMembership(teamId, req.userId!)

    if (!membership) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: teamInclude,
    })

    res.json({ team })
  } catch (error) {
    console.error('Get team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const addTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = getRouteId(req.params.id)
    const canManage = await requireTeamAdmin(teamId, req.userId!)

    if (!canManage) {
      res.status(403).json({ error: 'Only team owners and admins can manage members' })
      return
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const role = parseRole(req.body.role)

    if (!email) {
      res.status(400).json({ error: 'Member email is required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ error: 'User must register before being added to a team' })
      return
    }

    const member = await prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
      create: {
        teamId,
        userId: user.id,
        role,
      },
      update: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    })

    res.status(201).json({ member })
  } catch (error) {
    console.error('Add team member error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = getRouteId(req.params.id)
    const memberId = getRouteId(req.params.memberId)
    const canManage = await requireTeamAdmin(teamId, req.userId!)

    if (!canManage) {
      res.status(403).json({ error: 'Only team owners and admins can manage members' })
      return
    }

    const existing = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId,
      },
    })

    if (!existing) {
      res.status(404).json({ error: 'Team member not found' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } })
    if (existing.userId === team?.ownerId) {
      res.status(400).json({ error: 'Owner role cannot be changed from this endpoint' })
      return
    }

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: parseRole(req.body.role) },
    })

    res.json({ member })
  } catch (error) {
    console.error('Update team member error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = getRouteId(req.params.id)
    const memberId = getRouteId(req.params.memberId)
    const canManage = await requireTeamAdmin(teamId, req.userId!)

    if (!canManage) {
      res.status(403).json({ error: 'Only team owners and admins can manage members' })
      return
    }

    const existing = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId,
      },
    })

    if (!existing) {
      res.status(404).json({ error: 'Team member not found' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } })
    if (existing.userId === team?.ownerId) {
      res.status(400).json({ error: 'Team owner cannot be removed' })
      return
    }

    await prisma.teamMember.delete({ where: { id: memberId } })
    res.status(204).send()
  } catch (error) {
    console.error('Remove team member error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = getRouteId(req.params.id)
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: req.userId!,
      },
    })

    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    await prisma.team.delete({ where: { id: teamId } })
    res.status(204).send()
  } catch (error) {
    console.error('Delete team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
