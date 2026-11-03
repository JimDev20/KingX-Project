import nodemailer from 'nodemailer'

const port = Number(process.env.SMTP_PORT || 587)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null

export const sendPasswordResetEmail = async (to: string, token: string): Promise<boolean> => {
  if (!transporter) return false

  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'
  const from = process.env.SMTP_FROM || 'noreply@kingx.app'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your KingX password',
      text: [
        'Use the token below to reset your KingX password.',
        '',
        token,
        '',
        `Open ${appUrl}, choose Forgot password, and enter this token.`,
        'This token expires in one hour.',
      ].join('\n'),
    })
    return true
  } catch (error) {
    console.error('Password reset email error:', error)
    return false
  }
}
