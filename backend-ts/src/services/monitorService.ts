import axios from 'axios';
import prisma from '../config/prisma';
import logger from '../utils/logger';
import { sendEmail } from './emailService';

let monitoringInterval: ReturnType<typeof setInterval> | null = null;

export async function checkSingleWebsite(websiteId: string): Promise<void> {
  try {
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website || website.status === 'maintenance') return;

    const startTime = Date.now();
    let statusCode = 0;
    let errorMsg: string | null = null;

    try {
      const response = await axios({
        method: website.method.toLowerCase() as any,
        url: website.url,
        timeout: website.timeout,
        validateStatus: () => true,
        headers: { 'User-Agent': 'KingX-Uptime-Monitor/1.0' },
      });
      statusCode = response.status;
    } catch (err: any) {
      errorMsg = err.message;
      statusCode = err.response?.status || 0;
    }

    const responseTime = Date.now() - startTime;
    const newStatus = statusCode >= 200 && statusCode < 400 ? 'up' : 'down';
    const previousStatus = website.status;

    await prisma.websiteHistory.create({
      data: {
        websiteId,
        status: newStatus,
        responseTime,
        statusCode,
        error: errorMsg,
        duration: newStatus === 'down' ? website.checkInterval : 0,
      },
    });

    await prisma.website.update({
      where: { id: websiteId },
      data: { status: newStatus, lastChecked: new Date(), responseTime },
    });

    if (newStatus === 'down' && previousStatus !== 'down') {
      await handleDowntimeAlert(website);
    }
  } catch (error) {
    logger.error({ error, websiteId }, 'Monitor check failed');
  }
}

async function handleDowntimeAlert(website: { id: string; name: string; url: string; userId: string }): Promise<void> {
  try {
    const rules = await prisma.alertRule.findMany({ where: { websiteId: website.id, enabled: true } });

    for (const rule of rules) {
      const alert = await prisma.alert.create({
        data: {
          websiteId: website.id,
          userId: website.userId,
          type: rule.type,
          severity: 'critical',
          status: 'pending',
          message: `Website "${website.name}" (${website.url}) is DOWN.`,
        },
      });

      if (rule.type === 'email') {
        try {
          await sendEmail({
            to: rule.target,
            subject: `DOWN: ${website.name} is unreachable`,
            html: `<h2>Website Down</h2><p><strong>${website.name}</strong> (${website.url}) is currently unreachable.</p><p>Time: ${new Date().toISOString()}</p>`,
          });
          await prisma.alert.update({ where: { id: alert.id }, data: { status: 'sent', sentAt: new Date() } });
        } catch {
          await prisma.alert.update({ where: { id: alert.id }, data: { status: 'failed' } });
        }
      } else {
        logger.info({ ruleId: rule.id, type: rule.type }, 'Non-email alert triggered (webhook integration pending)');
      }
    }
  } catch (error) {
    logger.error({ error, websiteId: website.id }, 'Handle downtime alert failed');
  }
}

export async function checkAllWebsites(): Promise<void> {
  const websites = await prisma.website.findMany({
    where: { status: { not: 'maintenance' } },
  });

  logger.info({ count: websites.length }, 'Checking all websites');

  const results = await Promise.allSettled(websites.map((w) => checkSingleWebsite(w.id)));
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    logger.warn({ failed, total: websites.length }, 'Some website checks failed');
  }
}

export function startMonitoring(intervalMs: number = 60000): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  logger.info({ intervalMs }, 'Starting monitoring service');

  checkAllWebsites();

  monitoringInterval = setInterval(checkAllWebsites, intervalMs);
}

export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info('Monitoring service stopped');
  }
}
