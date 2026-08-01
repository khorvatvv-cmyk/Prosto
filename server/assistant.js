const ASSISTANT_ID = process.env.ASSISTANT_ID?.trim()
const ASSISTANT_KEY = process.env.ASSISTANT_API_KEY?.trim()
const ASSISTANT_BASE_URL = (process.env.ASSISTANT_BASE_URL || 'https://portarius.1bitai.ru').replace(/\/$/, '')

const TEMPORARY_UNAVAILABLE_TEXT =
  'Сервис временно недоступен. Ваш вопрос сохранён — специалист подключится в ближайшее время.'

export function isAssistantConfigured() {
  return Boolean(ASSISTANT_ID && ASSISTANT_KEY)
}

export function extractAssistantText(data) {
  if (typeof data === 'string') return data.trim()
  if (!data || typeof data !== 'object') return ''

  const candidates = [
    data.reply,
    data.response,
    data.answer,
    data.output,
    data.message,
    data.text,
    data.data?.reply,
    data.data?.response,
  ]

  return candidates.find(value => typeof value === 'string' && value.trim())?.trim() || ''
}

export async function askAssistant(message, threadId = null) {
  if (!isAssistantConfigured()) {
    console.error('Assistant is not configured: ASSISTANT_ID or ASSISTANT_API_KEY is missing')
    return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId: null }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)

  try {
    const response = await fetch(`${ASSISTANT_BASE_URL}/v1/assistants/${ASSISTANT_ID}/chat`, {
      method: 'POST',
      headers: {
        'X-Assistant-Key': ASSISTANT_KEY,
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        message,
        ...(threadId ? { thread_id: threadId } : {}),
      }),
      signal: controller.signal,
    })

    const responseBody = await response.text()
    let data = null
    try {
      data = responseBody ? JSON.parse(responseBody) : null
    } catch {
      data = responseBody
    }

    if (!response.ok) {
      console.error(`Assistant API returned HTTP ${response.status}`)
      return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId }
    }

    const text = extractAssistantText(data)
    if (!text) {
      console.error('Assistant API returned an empty response')
      return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId }
    }

    return {
      text,
      available: true,
      threadId: data?.thread_id || threadId || null,
    }
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'request timed out' : error.message
    console.error(`Assistant request failed: ${reason}`)
    return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId }
  } finally {
    clearTimeout(timeout)
  }
}
