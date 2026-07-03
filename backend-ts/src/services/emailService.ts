import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
    } else {
      logger.warn('SMTP not configured. Using ethereal fake email.');
      nodemailer.createTestAccount().then((account) => {
        transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
        });
      });
    }
  }
  return transporter!;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const t = getTransporter();
    if (!t) {
      logger.warn('SMTP transporter not ready yet. Skipping email.');
      return;
    }
    const info = await t.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info({ previewUrl }, 'Preview email URL');
      }
    }

    logger.info({ to: options.to, subject: options.subject }, 'Email sent');
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    throw error;
  }
}
