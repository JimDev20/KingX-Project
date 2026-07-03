import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';
import { sendEmail } from '../services/emailService';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: 'Email already registered.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: fullName || null,
      settings: { notifications: { email: true, browser: true } },
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  logger.info({ userId: user.id }, 'User registered successfully');

  res.status(201).json({
    message: 'User registered successfully.',
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    token,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  logger.info({ userId: user.id }, 'User logged in');

  res.json({
    message: 'Login successful.',
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    token,
  });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, avatar: true, role: true, isVerified: true, settings: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ user });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.userId;
  const { fullName, avatar, settings } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(avatar !== undefined && { avatar }),
      ...(settings !== undefined && { settings }),
    },
    select: { id: true, email: true, fullName: true, avatar: true, role: true, settings: true },
  });

  logger.info({ userId }, 'Profile updated');
  res.json({ message: 'Profile updated.', user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: 'No user with that email.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = await bcrypt.hash(resetToken, 10);
  const resetExpires = new Date(Date.now() + 3600000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      settings: {
        ...((user.settings as any) || {}),
        resetToken: resetTokenHash,
        resetExpires: resetExpires.toISOString(),
      },
    },
  });

  const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

  try {
    await sendEmail({
      to: email,
      subject: 'Password Reset - KingX Uptime Monitor',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  } catch {
    logger.warn({ email }, 'Failed to send password reset email (SMTP not configured)');
  }

  logger.info({ userId: user.id }, 'Password reset email sent');
  res.json({ message: 'Password reset link sent to your email.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    res.status(400).json({ error: 'Email, token, and new password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: 'Invalid reset request.' });
    return;
  }

  const settings = user.settings as any;
  if (!settings?.resetToken || !settings?.resetExpires) {
    res.status(400).json({ error: 'No reset token found. Request a new one.' });
    return;
  }

  const isTokenValid = await bcrypt.compare(token, settings.resetToken);
  if (!isTokenValid || new Date(settings.resetExpires) < new Date()) {
    res.status(400).json({ error: 'Invalid or expired reset token.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const { resetToken: _, resetExpires: __, ...restSettings } = settings;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      settings: restSettings,
    },
  });

  logger.info({ userId: user.id }, 'Password reset successfully');
  res.json({ message: 'Password reset successfully.' });
}
