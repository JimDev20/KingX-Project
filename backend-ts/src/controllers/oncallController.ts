import { Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'

const teamAccessWhere = (userId: string): Prisma.TeamWhereInput => ({
  OR: [
    { ownerId: userId },
    { members: { some: { userId } } },
  ],
})

const getRouteId = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? value[0] : value || ''
}

export const listSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const schedules = await prisma.onCallSchedule.findMany({
      where: { team: teamAccessWhere(userId) },
      include: { rotations: { orderBy: { priority: 'asc' } }, team: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ items: schedules })
  } catch (error) {
    console.error('List on-call schedules error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const { teamId, name, type, timezone } = req.body
    if (!teamId || !name) { res.status(400).json({ error: 'teamId and name are required' }); return }
    const member = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } })
    if (!member) { res.status(403).json({ error: 'Not a team member' }); return }
    const schedule = await prisma.onCallSchedule.create({
      data: { teamId, name, type: type || 'WEEKLY', timezone: timezone || 'UTC' },
      include: { rotations: true },
    })
    res.status(201).json({ data: schedule })
  } catch (error) {
    console.error('Create on-call schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, timezone } = req.body
    const schedule = await prisma.onCallSchedule.findUnique({ where: { id: getRouteId(req.params.id) } })
    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return }
    const updated = await prisma.onCallSchedule.update({
      where: { id: getRouteId(req.params.id) },
      data: { ...(name && { name }), ...(type && { type }), ...(timezone && { timezone }) },
      include: { rotations: { orderBy: { priority: 'asc' } } },
    })
    res.json({ data: updated })
  } catch (error) {
    console.error('Update on-call schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedule = await prisma.onCallSchedule.findUnique({ where: { id: getRouteId(req.params.id) } })
    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return }
    await prisma.onCallSchedule.delete({ where: { id: getRouteId(req.params.id) } })
    res.status(204).send()
  } catch (error) {
    console.error('Delete on-call schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const addRotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, startTime, endTime, dayOfWeek, priority } = req.body
    const scheduleId = getRouteId(req.params.id)
    const schedule = await prisma.onCallSchedule.findUnique({ where: { id: scheduleId } })
    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return }
    if (!userId) { res.status(400).json({ error: 'userId is required' }); return }
    const rotation = await prisma.onCallRotation.create({
      data: { scheduleId, userId, startTime: startTime || '00:00', endTime: endTime || '23:59', dayOfWeek, priority: priority || 0 },
    })
    res.status(201).json({ data: rotation })
  } catch (error) {
    console.error('Add rotation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const removeRotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rotation = await prisma.onCallRotation.findUnique({ where: { id: getRouteId(req.params.rotationId) } })
    if (!rotation) { res.status(404).json({ error: 'Rotation not found' }); return }
    await prisma.onCallRotation.delete({ where: { id: getRouteId(req.params.rotationId) } })
    res.status(204).send()
  } catch (error) {
    console.error('Remove rotation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateRotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, startTime, endTime, dayOfWeek, priority } = req.body
    const rotation = await prisma.onCallRotation.findUnique({ where: { id: getRouteId(req.params.rotationId) } })
    if (!rotation) { res.status(404).json({ error: 'Rotation not found' }); return }
    const updated = await prisma.onCallRotation.update({
      where: { id: getRouteId(req.params.rotationId) },
      data: { ...(userId && { userId }), ...(startTime && { startTime }), ...(endTime && { endTime }), ...(dayOfWeek !== undefined && { dayOfWeek }), ...(priority !== undefined && { priority }) },
    })
    res.json({ data: updated })
  } catch (error) {
    console.error('Update rotation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
