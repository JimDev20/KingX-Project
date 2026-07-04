import './config/env'
import express from 'express'
import cors from 'cors'
import prisma from './config/prisma'
import authRoutes from './routes/authRoutes'
import teamRoutes from './routes/teamRoutes'
import websiteRoutes from './routes/websiteRoutes'
import alertRoutes from './routes/alertRoutes'
import adminRoutes from './routes/adminRoutes'
import maintenanceRoutes from './routes/maintenanceRoutes'
import incidentRoutes from './routes/incidentRoutes'
import settingsRoutes from './routes/settingsRoutes'
import publicRoutes from './routes/publicRoutes'
import oncallRoutes from './routes/oncallRoutes'
import { startMonitoring } from './services/scheduler'

const app = express()
const PORT = process.env.PORT || 8080
const corsOrigin = process.env.CORS_ORIGIN

const allowedOrigins = corsOrigin ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean) : []

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    if (origin.endsWith('.vercel.app')) return callback(null, true)
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) return callback(null, true)
    callback(null, true)
  },
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/websites', websiteRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/oncall', oncallRoutes)

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check database error:', error)

    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  startMonitoring()
})
