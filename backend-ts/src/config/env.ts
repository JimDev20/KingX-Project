import dotenv from 'dotenv';
dotenv.config();

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  PORT: parseInt(optionalEnv('PORT', '4000'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: requiredEnv('DATABASE_URL'),
  JWT_SECRET: requiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),
  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),
  SMTP_HOST: optionalEnv('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
  SMTP_USER: optionalEnv('SMTP_USER', ''),
  SMTP_PASS: optionalEnv('SMTP_PASS', ''),
  SMTP_FROM: optionalEnv('SMTP_FROM', 'noreply@kingx.app'),
  REDIS_URL: optionalEnv('REDIS_URL', ''),
} as const;

export function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'] as const;
  for (const key of required) {
    requiredEnv(key);
  }
}
