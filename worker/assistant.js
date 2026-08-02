const TEMPORARY_UNAVAILABLE_TEXT =
  'Сервис временно недоступен. Ваш вопрос сохранён — специалист подключится в ближайшее время.'

export function isAssistantConfigured(env) {
  return Boolean(env.ASSISTANT_ID?.trim() && env.ASSISTANT_API_KEY?.trim())
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

export async function askAssistant(message, threadId, env) {
  if (!isAssistantConfigured(env)) {
    console.error('Assistant is not configured')
    return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId: threadId || null }
  }

  const baseUrl = String(env.ASSISTANT_BASE_URL || 'https://portarius.1bitai.ru').replace(/\/$/, '')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 75_000)
  try {
    const response = await fetch(`${baseUrl}/v1/assistants/${env.ASSISTANT_ID.trim()}/chat`, {
      method: 'POST',
      headers: {
        'X-Assistant-Key': env.ASSISTANT_API_KEY.trim(),
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({ message, ...(threadId ? { thread_id: threadId } : {}) }),
      signal: controller.signal,
    })

    const responseBody = await response.text()
    let data = responseBody
    try {
      data = responseBody ? JSON.parse(responseBody) : null
    } catch {
      // Text responses are supported by the current assistant gateway.
    }
    if (!response.ok) {
      console.error(`Assistant API returned HTTP ${response.status}`)
      return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId: threadId || null }
    }

    const text = extractAssistantText(data)
    if (!text) return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId: threadId || null }
    return { text, available: true, threadId: data?.thread_id || threadId || null }
  } catch (error) {
    console.error(`Assistant request failed: ${error.name === 'AbortError' ? 'timeout' : error.message}`)
    return { text: TEMPORARY_UNAVAILABLE_TEXT, available: false, threadId: threadId || null }
  } finally {
    clearTimeout(timeout)
  }
}
