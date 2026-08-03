import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Info, Send, Sparkles } from 'lucide-react'
import { MobileButton } from './MobilePrimitives.jsx'

export default function MobileNewRequest({ onBack, onSubmit }) {
  const [text, setText] = useState(() => sessionStorage.getItem('prosto_new_question_draft') || '')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const fieldRef = useRef(null)

  useEffect(() => { sessionStorage.setItem('prosto_new_question_draft', text) }, [text])

  const submit = async () => {
    const value = text.trim()
    if (value.length < 5) {
      setError('Расскажите немного подробнее, что не получается.')
      fieldRef.current?.focus()
      return
    }
    setSending(true)
    setError('')
    const firstLine = value.split('\n')[0].trim()
    const title = firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine
    const ok = await onSubmit(title, value)
    if (ok) {
      sessionStorage.removeItem('prosto_new_question_draft')
      setText('')
    } else setError('Не удалось отправить вопрос. Проверьте подключение и попробуйте ещё раз.')
    setSending(false)
  }

  return (
    <section className="m-focus-screen" data-testid="mobile-new-request">
      <header className="m-focus-header"><button type="button" aria-label="Назад" onClick={onBack}><ArrowLeft size={23} /></button><span>Новый вопрос</span><i /></header>
      <div className="m-new-body">
        <span className="m-new-icon"><Sparkles size={24} /></span>
        <h1>Просто расскажите,<br />что не получается<span>.</span></h1>
        <p>Опишите проблему своими словами. Чем подробнее описание, тем быстрее получится помочь.</p>
        <label className={`m-question-field ${error ? 'has-error' : ''}`}>
          <span>Ваш вопрос</span>
          <textarea ref={fieldRef} value={text} onChange={event => { setText(event.target.value); setError('') }}
            placeholder="Например: в 1С не проводится документ реализации, появляется ошибка…" rows={8} />
          <small>{text.length} символов</small>
        </label>
        {error && <div className="m-field-error" role="alert">{error}</div>}
        <div className="m-info-note"><Info size={19} /><p>Сначала вопрос посмотрит ассистент «Просто». Если потребуется, подключим специалиста и передадим ему всю переписку.</p></div>
      </div>
      <footer className="m-focus-footer"><MobileButton disabled={sending || !text.trim()} onClick={submit}>{sending ? 'Отправляем…' : <><Send size={19} /> Отправить вопрос</>}</MobileButton></footer>
    </section>
  )
}
