import { useState } from 'react'
import { Bell, Building2, ChevronRight, Headphones, Info, LockKeyhole, LogOut, Mail, Pencil, Save, Settings2, UserRound } from 'lucide-react'
import { profileApi } from '../api.js'
import { MobileAvatar, MobileBadge, MobileButton } from './MobilePrimitives.jsx'
import { friendlyError } from './mobile-utils.js'

function Row({ icon: Icon, label, value, action }) {
  return <div className="m-profile-row"><span className="m-profile-row-icon"><Icon size={19} /></span><span><small>{label}</small><strong>{value || 'Не указано'}</strong></span>{action || null}</div>
}

export default function MobileProfile({ user, onUpdateUser, onNavigate, onLogout, showToast }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ activity_type: user.activity_type || '', software_product: user.software_product || '', product_version: user.product_version || '', config_type: user.config_type || '', customizations: user.customizations || '' })
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const serviceLabel = ({ active: 'Активно', paused: 'Приостановлено', no_regular_contract: 'Без регулярного договора' })[user.service_status] || 'Уточняется'
  const save = async () => {
    setSaving(true)
    try { const data = await profileApi.update(form); onUpdateUser(data.user); setEditing(false); showToast?.('Профиль сохранён') }
    catch (error) { showToast?.(friendlyError(error)) }
    finally { setSaving(false) }
  }

  return (
    <section className="m-screen m-profile" data-testid="mobile-profile">
      <div className="m-profile-hero"><MobileAvatar name={user.name || user.email} size="lg" /><div><h1>{user.name || 'Пользователь'}</h1><p>{user.email}</p></div></div>

      <section className="m-profile-section"><header><h2>Пользователь</h2></header><Row icon={UserRound} label="Имя" value={user.name} /><Row icon={Mail} label="Email" value={user.email} /></section>
      <section className="m-profile-section"><header><h2>Организация</h2><MobileBadge tone={user.membership_status === 'active' ? 'success' : 'warning'}>{user.membership_status === 'active' ? 'Подтверждена' : 'На проверке'}</MobileBadge></header><Row icon={Building2} label="Организация" value={user.organization_name || user.org_name} /><Row icon={Info} label="ИНН" value={user.inn} /></section>

      <section className="m-profile-section"><header><h2>Ваша 1С</h2>{!editing && <button type="button" onClick={() => setEditing(true)}><Pencil size={16} /> Изменить</button>}</header>
        {editing ? <div className="m-profile-form">
          <label>Вид деятельности<input value={form.activity_type} onChange={event => set('activity_type', event.target.value)} /></label>
          <label>Продукт 1С<input value={form.software_product} onChange={event => set('software_product', event.target.value)} /></label>
          <label>Версия<input value={form.product_version} onChange={event => set('product_version', event.target.value)} /></label>
          <label>Конфигурация<select value={form.config_type} onChange={event => set('config_type', event.target.value)}><option value="">Не указано</option><option value="Типовая">Типовая</option><option value="Нетиповая">Нетиповая</option></select></label>
          <label>Доработки<textarea rows={3} value={form.customizations} onChange={event => set('customizations', event.target.value)} /></label>
          <div><MobileButton onClick={save} disabled={saving}><Save size={17} /> {saving ? 'Сохраняем…' : 'Сохранить'}</MobileButton><MobileButton variant="ghost" onClick={() => setEditing(false)}>Отмена</MobileButton></div>
        </div> : <><Row icon={Settings2} label="Продукт" value={user.software_product} /><Row icon={Info} label="Версия" value={user.product_version} /><Row icon={Settings2} label="Конфигурация" value={user.config_type} /><Row icon={Pencil} label="Доработки" value={user.customizations} /></>}
      </section>

      <section className="m-profile-section"><header><h2>Поддержка</h2></header><Row icon={Info} label="Статус обслуживания" value={serviceLabel} /><button type="button" className="m-profile-link" onClick={() => onNavigate('manager-chat')}><span className="m-profile-row-icon"><Headphones size={19} /></span><span><small>Ваш менеджер</small><strong>{user.manager_name || (user.membership_status !== 'active' ? 'Доступ после проверки' : 'Написать сообщение')}</strong></span><ChevronRight size={19} /></button></section>
      <section className="m-profile-section"><header><h2>Настройки</h2></header><Row icon={Bell} label="Уведомления" value="Включены" action={<ChevronRight size={19} />} /><Row icon={LockKeyhole} label="Безопасность" value="Защищённый вход" action={<ChevronRight size={19} />} /><Row icon={Info} label="О приложении" value="просто. · Android 1.1" /></section>
      <MobileButton variant="danger" className="m-logout" onClick={onLogout}><LogOut size={18} /> Выйти из аккаунта</MobileButton>
    </section>
  )
}
