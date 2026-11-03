import crypto from 'crypto'
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import prisma from '../config/prisma'
import { generateToken } from '../utils/jwt'
import { sendPasswordResetEmail } from '../services/emailService'
import type { AuthRequest } from '../middleware/auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6
const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

    if (!EMAIL_PATTERN.test(email) || !fullName || fullName.length > 100 || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `A valid email, name, and password of at least ${MIN_PASSWORD_LENGTH} characters are required` })
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({ error: 'Email already registered' })
      return
    }
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

    if (!EMAIL_PATTERN.test(email) || !password) {
      res.status(400).json({ error: 'A valid email and password are required' })
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
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : ''
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : ''

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' })
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''

    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent' })
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashResetToken(resetToken), resetExpires },
    })

    const sent = await sendPasswordResetEmail(email, resetToken)
    if (!sent && process.env.NODE_ENV !== 'production') {
      console.info('[auth] Password reset token (development only):', resetToken)
    }

    res.json({ message: 'If an account with that email exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : ''
    const newPassword = typeof req.body.newPassword === 'string'
      ? req.body.newPassword
      : typeof req.body.password === 'string' ? req.body.password : ''

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' })
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashResetToken(token),
        resetExpires: { gt: new Date() },
      },
    })

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' })
      return
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    })

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
