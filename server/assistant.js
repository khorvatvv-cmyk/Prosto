const ASSISTANT_ID = process.env.ASSISTANT_ID || '869836e7-7202-4217-a390-5569855d73eb'
const ASSISTANT_KEY = process.env.ASSISTANT_API_KEY || 'aipk_eZQG4U2MTxy3pdt-Sv2gBpiKhIwSv1terXk6Ot8OrjA'
const ASSISTANT_URL = `https://portarius.1bitai.ru/v1/assistants/${ASSISTANT_ID}/chat`

export async function askAssistant(message) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(ASSISTANT_URL, {
      method: 'POST',
      headers: {
        'X-Assistant-Key': ASSISTANT_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      console.error('Assistant API error:', res.status, err)
      return {
        text: 'Сервис временно недоступен. Мы уже работаем над этим. Ваш вопрос сохранён — специалист подключится в ближайшее время.',
        available: false,
      }
    }

    const data = await res.json()

    let responseText = ''
    if (typeof data === 'string') responseText = data
    else if (data.response) responseText = data.response
    else if (data.answer) responseText = data.answer
    else if (data.output) responseText = data.output
    else if (data.message) responseText = data.message
    else if (data.text) responseText = data.text
    else if (data.reply) responseText = data.reply
    else responseText = JSON.stringify(data)

    return { text: responseText, available: true }
  } catch (err) {
    console.error('Assistant fetch error:', err.message)
    return {
      text: 'Не удалось получить автоматический ответ. Ваш вопрос сохранён — мы подключим специалиста.',
      available: false,
    }
  }
}
