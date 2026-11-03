import { isIP } from 'node:net'

const PRIVATE_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.home', '.lan']
const PRIVATE_HOSTS = new Set(['localhost', 'metadata.google.internal'])

const isPrivateIpv4 = (address: string): boolean => {
  const [a, b, c] = address.split('.').map(Number)
  if (![a, b, c].every(Number.isFinite)) return true

  return a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
}

const isPrivateIpv6 = (address: string): boolean => {
  const normalized = address.toLowerCase()
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice(7))
  }
  return normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
}

export const isPrivateAddress = (address: string): boolean => {
  const version = isIP(address)

  if (version === 4) return isPrivateIpv4(address)
  if (version === 6) return isPrivateIpv6(address)
  return false
}

export const normalizeMonitorUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (url.username || url.password) return null

    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')

    if (process.env.ALLOW_PRIVATE_MONITOR_TARGETS === 'true') return url.toString()
    if (PRIVATE_HOSTS.has(hostname)) return null
    if (PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return null
    if (isPrivateAddress(hostname)) return null

    return url.toString()
  } catch {
    return null
  }
}
