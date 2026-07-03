import { Request, Response, Router } from 'express'
import prisma from '../config/prisma'

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

export default router
