import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateEnv, env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { startMonitoring } from './services/monitorService';
import logger from './utils/logger';

import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import websiteRoutes from './routes/websiteRoutes';
import adminRoutes from './routes/adminRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';

validateEnv();

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/api-keys', apiKeyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
    startMonitoring();
  });
}

export default app;
