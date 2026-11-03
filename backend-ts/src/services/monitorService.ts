import { lookup } from 'node:dns/promises'
import { CheckMethod, WebsiteStatus, KeywordCheckType } from '@prisma/client'
import { isPrivateAddress, normalizeMonitorUrl } from '../utils/url'

export interface MonitorResult {
  status: WebsiteStatus
  responseTime: number
  statusCode?: number
  error?: string
}

interface CheckOptions {
  url: string
  method: CheckMethod
  timeout: number
  keywordCheck?: string | null
  keywordType?: KeywordCheckType | null
}

export const checkWebsite = async (options: CheckOptions): Promise<MonitorResult> => {
  const { url, method, timeout, keywordCheck, keywordType } = options
  const startedAt = Date.now()
  const safeUrl = normalizeMonitorUrl(url)

  if (!safeUrl) {
    return { status: 'DOWN', responseTime: 0, error: 'URL is not allowed' }
  }

  if (process.env.ALLOW_PRIVATE_MONITOR_TARGETS !== 'true') {
    const hostname = new URL(safeUrl).hostname
    const addresses = await lookup(hostname, { all: true }).catch(() => [])
    if (addresses.some((entry) => isPrivateAddress(entry.address))) {
      return { status: 'DOWN', responseTime: Date.now() - startedAt, error: 'URL resolves to a private address' }
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(safeUrl, {
      method,
      signal: controller.signal,
      redirect: 'follow',
    })

    const responseTime = Date.now() - startedAt

    if (!response.ok) {
      return {
        status: 'DOWN',
        responseTime,
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      }
    }

    if (keywordCheck && keywordType) {
      const body = await response.text()
      const found = body.includes(keywordCheck)
      const passed = keywordType === 'CONTAINS' ? found : !found

      if (!passed) {
        return {
          status: 'DOWN',
          responseTime,
          statusCode: response.status,
          error: keywordType === 'CONTAINS'
            ? `Keyword "${keywordCheck}" not found in response`
            : `Keyword "${keywordCheck}" unexpectedly found in response`,
        }
      }
    }

    return {
      status: 'UP',
      responseTime,
      statusCode: response.status,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'

    return {
      status: 'DOWN',
      responseTime: Date.now() - startedAt,
      error: message,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
