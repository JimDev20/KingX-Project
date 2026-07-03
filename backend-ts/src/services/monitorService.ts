import { CheckMethod, WebsiteStatus } from '@prisma/client'

export interface MonitorResult {
  status: WebsiteStatus
  responseTime: number
  statusCode?: number
  error?: string
}

export const checkWebsite = async (
  url: string,
  method: CheckMethod,
  timeout: number,
): Promise<MonitorResult> => {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
    })

    return {
      status: response.ok ? 'UP' : 'DOWN',
      responseTime: Date.now() - startedAt,
      statusCode: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
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
