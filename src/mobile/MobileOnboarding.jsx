import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { profileApi } from '../api.js'
import { MobileButton } from './MobilePrimitives.jsx'
import { friendlyError } from './mobile-utils.js'
import './mobile.css'

export default function MobileOnboarding({ onComplete, onUpdateUser }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ activity_type: '', software_product: '', product_version: '', config_type: '', customizations: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const save = async () => {
    setSaving(true); setError('')
    try { const data = await profileApi.update(form); onUpdateUser(data.user); onComplete() }
    catch (saveError) { setError(friendlyError(saveError)) }
    finally { setSaving(false) }
  }

  return (
    <div className="m-onboarding">
      <header><span>просто<i>.</i></span><small>{step + 1} из 2</small></header>
      <main>
        <span className="m-new-icon"><Sparkles size={23} /></span>
        {step === 0 ? <>
          <h1>Расскажите немного<br />о вашей 1С<span>.</span></h1>
          <p>Эти данные помогут отвечать точнее. ИНН и организацию повторно вводить не нужно.</p>
          <label>Продукт 1С<input value={form.software_product} onChange={event => set('software_product', event.target.value)} placeholder="Например: 1С:Бухгалтерия" /></label>
          <label>Версия<input value={form.product_version} onChange={event => set('product_version', event.target.value)} placeholder="Например: 3.0" /></label>
          <label>Конфигурация<select value={form.config_type} onChange={event => set('config_type', event.target.value)}><option value="">Не знаю</option><option value="Типовая">Типовая</option><option value="Нетиповая">Нетиповая</option></select></label>
          <MobileButton onClick={() => setStep(1)}>Продолжить <ArrowRight size={18} /></MobileButton>
        </> : <>
          <h1>И последнее<span>.</span></h1>
          <p>Если знаете — расскажите о доработках. Этот шаг можно пропустить.</p>
          <label>Вид деятельности<input value={form.activity_type} onChange={event => set('activity_type', event.target.value)} placeholder="Например: оптовая торговля" /></label>
          <label>Что доработано<textarea rows={5} value={form.customizations} onChange={event => set('customizations', event.target.value)} placeholder="Обмены, печатные формы, интеграции…" /></label>
          {error && <div className="m-field-error" role="alert">{error}</div>}
          <MobileButton onClick={save} disabled={saving}>{saving ? 'Сохраняем…' : 'Готово, начать'}</MobileButton>
          <MobileButton variant="ghost" onClick={onComplete} disabled={saving}>Заполнить позже</MobileButton>
        </>}
      </main>
    </div>
  )
}
