import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { paramId } from '../utils/helpers';

export async function createApiKey(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'API key name is required.' });
    return;
  }

  const key = `kx_${crypto.randomBytes(32).toString('hex')}`;

  const apiKey = await prisma.apiKey.create({
    data: { name, key, userId: req.user!.userId },
  });

  logger.info({ apiKeyId: apiKey.id }, 'API key created');
  res.status(201).json({ apiKey: { ...apiKey, key } });
}

export async function getApiKeys(req: AuthRequest, res: Response): Promise<void> {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.userId },
    select: { id: true, name: true, key: true, lastUsed: true, createdAt: true, enabled: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ apiKeys: keys });
}

export async function deleteApiKey(req: AuthRequest, res: Response): Promise<void> {
  const id = paramId(req);
  const key = await prisma.apiKey.findUnique({ where: { id } });

  if (!key || key.userId !== req.user!.userId) {
    res.status(404).json({ error: 'API key not found.' });
    return;
  }

  await prisma.apiKey.delete({ where: { id } });
  res.json({ message: 'API key deleted.' });
}

export async function authenticateApiKey(key: string): Promise<{ userId: string } | null> {
  try {
    const apiKey = await prisma.apiKey.findUnique({ where: { key } });
    if (!apiKey || !apiKey.enabled) return null;

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    return { userId: apiKey.userId };
  } catch {
    return null;
  }
}
