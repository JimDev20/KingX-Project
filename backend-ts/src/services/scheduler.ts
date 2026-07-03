import prisma from '../config/prisma'
import { checkWebsite } from './monitorService'

const CHECK_INTERVAL = 5 * 60 * 1000

let intervalId: ReturnType<typeof setInterval> | null = null

async function checkAllWebsites() {
  try {
    const websites = await prisma.website.findMany({
      where: { status: { not: 'MAINTENANCE' } },
    })

    for (const site of websites) {
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
            lastChecked: new Date(),
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
  checkAllWebsites()
  intervalId = setInterval(checkAllWebsites, CHECK_INTERVAL)
}

export function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
