import { Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../config/prisma'
import type { AuthRequest } from '../middleware/auth'

export const getApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyHash: true,
        lastUsed: true,
        createdAt: true,
      },
    })

    const items = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.keyHash.substring(0, 8),
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
    }))

    res.json({ items })
  } catch (error) {
    console.error('Get API keys error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''

    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }

    const key = crypto.randomBytes(32).toString('hex')
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')

    const apiKey = await prisma.apiKey.create({
      data: { userId, name, keyHash },
      select: { id: true, name: true, createdAt: true },
    })

    res.status(201).json({
      apiKey,
      key,
    })
  } catch (error) {
    console.error('Create API key error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const revokeApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!

    const existing = await prisma.apiKey.findFirst({
      where: { id: req.params.id as string, userId },
    })

    if (!existing) {
      res.status(404).json({ error: 'API key not found' })
      return
    }

    if (existing.revokedAt) {
      res.status(400).json({ error: 'API key is already revoked' })
      return
    }

    await prisma.apiKey.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    })

    res.json({ message: 'API key revoked successfully' })
  } catch (error) {
    console.error('Revoke API key error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : ''

    if (!fullName) {
      res.status(400).json({ error: 'Full name is required' })
      return
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName },
      select: { id: true, email: true, fullName: true, role: true, isVerified: true },
    })

    res.json({ user })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const currentPassword = typeof req.body.currentPassword === 'string'
      ? req.body.currentPassword
      : typeof req.body.oldPassword === 'string' ? req.body.oldPassword : ''
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : ''

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)

    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' })
      return
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!
    const settings = req.body

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Settings must be a JSON object' })
      return
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { settings },
      select: { settings: true },
    })

    res.json({ settings: user.settings })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    })

    res.json({ settings: user?.settings || {} })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
