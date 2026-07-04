import { Request, Response, Router } from 'express'
import prisma from '../config/prisma'
import { getBadgeSvg } from '../services/badgeService'

const router = Router()

router.get('/status/:slug', async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        websites: {
          select: { id: true, name: true, url: true, status: true, uptime: true, responseTime: true, lastChecked: true },
        },
      },
    })

    if (!team) {
      res.status(404).json({ error: 'Status page not found' })
      return
    }

    res.json({ teamName: team.name, items: team.websites })
  } catch (error) {
    console.error('Public status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/badge/:slug', async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        websites: { select: { id: true, name: true, url: true, status: true, uptime: true } },
      },
    })
    if (!team) { res.status(404).send('Team not found'); return }
    const svg = getBadgeSvg(team.name, team.websites)
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(svg)
  } catch (error) {
    console.error('Badge error:', error)
    res.status(500).send('Internal server error')
  }
})

router.get('/badge/:slug/json', async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        websites: { select: { id: true, name: true, url: true, status: true, uptime: true, responseTime: true, lastChecked: true } },
      },
    })
    if (!team) { res.status(404).json({ error: 'Team not found' }); return }
    const down = team.websites.filter(w => w.status === 'DOWN').length
    const up = team.websites.filter(w => w.status === 'UP').length
    const overallStatus = down > 0 ? 'DOWN' : up > 0 ? 'UP' : 'PENDING'
    res.json({ teamName: team.name, slug: team.slug, overallStatus, total: team.websites.length, up, down, sites: team.websites })
  } catch (error) {
    console.error('Badge JSON error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
