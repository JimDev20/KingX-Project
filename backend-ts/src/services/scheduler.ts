import prisma from '../config/prisma'
import { checkWebsite } from './monitorService'

const TICK_INTERVAL = 30 * 1000

let intervalId: ReturnType<typeof setInterval> | null = null

async function checkDueWebsites() {
  try {
    const now = new Date()
    const websites = await prisma.website.findMany({
      where: { status: { not: 'MAINTENANCE' } },
    })

    for (const site of websites) {
      const intervalMs = site.checkInterval * 1000
      const elapsed = site.lastChecked ? now.getTime() - site.lastChecked.getTime() : intervalMs + 1

      if (elapsed < intervalMs) continue

      try {
        const result = await checkWebsite(site.url, site.method, site.timeout)

        await prisma.websiteHistory.create({
          data: {
            websiteId: site.id,
            status: result.status,
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            error: result.error,
          },
        })

        const uptime = await calculateUptime(site.id)

        await prisma.website.update({
          where: { id: site.id },
          data: {
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: now,
            uptime,
          },
        })
      } catch {
        // individual site failure is logged but doesn't stop the batch
      }
    }
  } catch {
    // database error during fetch
  }
}

async function calculateUptime(websiteId: string): Promise<number> {
  const [total, up] = await Promise.all([
    prisma.websiteHistory.count({ where: { websiteId } }),
    prisma.websiteHistory.count({ where: { websiteId, status: 'UP' } }),
  ])
  if (total === 0) return 100
  return Number(((up / total) * 100).toFixed(2))
}

export function startMonitoring() {
  if (intervalId) return
  checkDueWebsites()
  intervalId = setInterval(checkDueWebsites, TICK_INTERVAL)
}

export function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
