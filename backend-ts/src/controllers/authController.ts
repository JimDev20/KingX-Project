import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/prisma'
import { generateToken } from '../utils/jwt'
import type { AuthRequest } from '../middleware/auth'

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, fullName } = req.body
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and fullName are required' })
      return
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    })

    const token = generateToken(user.id)

    res.status(201).json({
      token,
      user,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
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
    const { currentPassword, newPassword } = req.body

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
