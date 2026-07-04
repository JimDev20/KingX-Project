import { CheckMethod, WebsiteStatus, KeywordCheckType } from '@prisma/client'

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
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
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
