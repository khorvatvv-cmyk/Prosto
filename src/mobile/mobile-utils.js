export const MOBILE_BREAKPOINT = 768

export const statusMeta = (request = {}) => {
  if (request.status === 'done') return { label: 'Вопрос решён', tone: 'success', step: 4 }
  if (request.status === 'result_ready') return { label: 'Готово решение', tone: 'success', step: 4 }
  if (request.status === 'need_data') return { label: 'Нужна информация от вас', tone: 'warning', step: 3 }
  if (request.status === 'returned') return { label: 'Специалист продолжает работу', tone: 'info', step: 3 }
  if (request.level === 'l1' && request.status === 'waiting') return { label: 'Подключаем специалиста', tone: 'info', step: 2 }
  if (request.level === 'l1' && request.status === 'in_progress') return { label: 'Специалист отвечает', tone: 'info', step: 3 }
  if (request.level === 'l0') return { label: 'Ассистент готовит ответ', tone: 'accent', step: 1 }
  return { label: 'Ищем решение', tone: 'accent', step: 1 }
}

export const formatMobileDate = (value, withTime = true) => {
  if (!value) return ''
  const normalized = typeof value === 'string' && !value.includes('T') ? `${value.replace(' ', 'T')}Z` : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU', withTime
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' })
}

export const friendlyError = (error) => {
  if (String(error?.message || '').includes('Организация не определена')) {
    return 'Организация ещё проходит проверку. Чат с менеджером станет доступен после подтверждения.'
  }
  if (error?.status === 401) return 'Сессия истекла. Войдите в приложение ещё раз.'
  if (error?.code === 'timeout') return 'Сервер отвечает дольше обычного. Попробуйте ещё раз.'
  if (error?.code === 'network_error' || error?.message === 'Failed to fetch') {
    return 'Не удалось загрузить данные. Проверьте подключение и попробуйте ещё раз.'
  }
  return error?.message || 'Что-то пошло не так. Попробуйте ещё раз.'
}

export const isOpenRequest = (request) => request?.status !== 'done'
