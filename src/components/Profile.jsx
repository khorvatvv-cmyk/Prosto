import { ChevronRight, User, Mail, Phone, Lock, LogOut, Building } from 'lucide-react';

export default function Profile({ onOpenManager, showToast }) {
  const handleSave = () => showToast('Контактные данные сохранены');

  return (
    <div style={{ padding: '32px 24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink-muted)', marginBottom: '20px' }}>
        <span>Главная</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>Профиль</span>
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 28px 0' }}>Профиль</h1>

      {/* Contact section */}
      <Section title="Контакт">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FieldRow icon={User} label="ФИО" defaultValue="Иванова Мария Сергеевна" />
          <FieldRow icon={Mail} label="Email" defaultValue="maria.ivanova@example.com" />
          <FieldRow icon={Phone} label="Телефон" defaultValue="+7 (900) 123-45-67" />
          <div>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#E50071',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#B0005A')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#E50071')}
            >
              Сохранить
            </button>
          </div>
        </div>
      </Section>

      {/* Organization section */}
      <Section title="Организация">
        <div
          style={{
            background: 'var(--color-surface)',
            border: `1px solid var(--color-border)`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(229,0,113,0.08)',
                color: '#E50071',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>ООО «ТоргСервис»</div>
              <div style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>ИНН: 7701234567</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(229,0,113,0.1)',
                color: '#E50071',
              }}
            >
              ИТС ПРОФ
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
              Договор №ТС-2024/0156 · до 31.12.2026
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Активен</span>
          </div>
        </div>
      </Section>

      {/* Manager section */}
      <Section title="Ваш менеджер">
        <div
          style={{
            background: 'var(--color-surface)',
            border: `1px solid var(--color-border)`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #18181B, #E50071)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              АП
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>Анна Петрова</div>
              <div style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>Персональный менеджер</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href="tel:+74951234567"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid var(--color-border)`,
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Phone size={15} />
              +7 (495) 123-45-67
            </a>
            <a
              href="mailto:anna.petrova@1bit.ru"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid var(--color-border)`,
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Mail size={15} />
              anna.petrova@1bit.ru
            </a>
            <button
              onClick={onOpenManager}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#E50071',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Написать
            </button>
          </div>
        </div>
      </Section>

      {/* Security section */}
      <Section title="Безопасность">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => showToast('Ссылка на изменение пароля отправлена на email')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              border: `1px solid var(--color-border)`,
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Lock size={18} style={{ color: 'var(--color-ink-muted)' }} />
            Изменить пароль
          </button>
          <button
            onClick={() => showToast('Выполнен выход из всех устройств')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              border: `1px solid var(--color-border)`,
              background: 'var(--color-surface)',
              color: '#DC2626',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={18} />
            Выйти из всех устройств
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldRow({ icon: Icon, label, defaultValue }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted)', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-ink-muted)',
          }}
        />
        <input
          type="text"
          defaultValue={defaultValue}
          style={{
            width: '100%',
            padding: '11px 14px 11px 40px',
            borderRadius: '10px',
            border: `1px solid var(--color-border)`,
            background: 'var(--color-bg)',
            fontSize: '14px',
            color: 'var(--color-ink)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#E50071')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
      </div>
    </div>
  );
}
