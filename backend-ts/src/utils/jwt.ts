import jwt from 'jsonwebtoken'

const INSECURE_SECRETS = new Set(['your-super-secret-key', 'your-secret-key-change-in-production'])
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET || INSECURE_SECRETS.has(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be set to a unique value before the server starts')
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' })
}

export const verifyToken = (token: string): { id: string } => {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })

  if (typeof decoded !== 'object' || typeof decoded.id !== 'string') {
    throw new Error('Invalid token payload')
  }

  return { id: decoded.id }
}