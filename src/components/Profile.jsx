import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Save,
  Building2,
  FileText,
  Briefcase,
  Shield,
  ChevronRight,
} from 'lucide-react';

// ------------------------------------------------------------------
// Вспомогательный блок-секция
// ------------------------------------------------------------------
function Section({ icon: Icon, title, children, noIcon }) {
  return (
    <div
      style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {!noIcon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <Icon size={18} color="var(--color-accent)" />
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--color-ink)',
            }}
          >
            {title}
          </h3>
        </div>
      )}
      {noIcon && (
        <h3
          style={{
            margin: '0 0 14px',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-ink)',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// Поле ввода
// ------------------------------------------------------------------
function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-ink-muted)',
          marginBottom: '4px',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          color: 'var(--color-ink)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
        }}
        className="focus:border-[var(--color-accent)]"
      />
    </div>
  );
}

// ------------------------------------------------------------------
// Основной компонент
// ------------------------------------------------------------------
export default function Profile({ onOpenManager, showToast }) {
  const [name, setName] = useState('Иванов Иван Иванович');
  const [email, setEmail] = useState('ivanov@example.ru');
  const [phone, setPhone] = useState('+7 (999) 123-45-67');

  const handleSave = () => {
    showToast?.('Данные сохранены');
  };

  return (
    <div>
      {/* ---------- КОНТАКТ ---------- */}
      <Section icon={User} title="Контакт">
        <Field label="ФИО" value={name} onChange={setName} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Телефон" value={phone} onChange={setPhone} type="tel" />

        <button
          type="button"
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: 'var(--color-accent)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          className="hover:opacity-90 active:opacity-80"
        >
          <Save size={16} />
          Сохранить
        </button>
      </Section>

      {/* ---------- ОРГАНИЗАЦИЯ ---------- */}
      <Section icon={Building2} title="Организация">
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}
              >
                ООО «Пример»
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '13px',
                  color: 'var(--color-ink-muted)',
                }}
              >
                ИНН 7712345678
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
            }}
          >
            <FileText size={16} color="var(--color-accent)" />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-ink)',
              }}
            >
              Договор ИТС ПРОФ
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-ink-muted)' }}>
              Действует
            </span>
          </div>
        </div>
      </Section>

      {/* ---------- ВАШ МЕНЕДЖЕР ---------- */}
      <Section icon={Briefcase} title="Ваш менеджер">
        <div
          onClick={onOpenManager}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'box-shadow 0.15s ease',
          }}
          className="hover:shadow-sm"
        >
          {/* Аватар с градиентом */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              background:
                'linear-gradient(135deg, var(--color-accent) 0%, #ff7eb3 50%, #ff758c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ИИ
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            >
              Иванов Иван Иванович
            </p>
            <p
              style={{
                margin: '2px 0 4px',
                fontSize: '13px',
                color: 'var(--color-ink-muted)',
              }}
            >
              Персональный менеджер
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href="tel:+79991234567"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '12px',
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                +7 (999) 123-45-67
              </a>
              <a
                href="mailto:manager@bit.ru"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '12px',
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                manager@bit.ru
              </a>
            </div>
          </div>

          <ChevronRight size={18} color="var(--color-ink-muted)" style={{ flexShrink: 0 }} />
        </div>
      </Section>

      {/* ---------- БЕЗОПАСНОСТЬ ---------- */}
      <Section icon={Shield} title="Безопасность">
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: '18px',
            color: 'var(--color-ink-muted)',
          }}
        >
          Ваши данные защищены. Для смены пароля или настройки двухфакторной
          аутентификации обратитесь к вашему менеджеру.
        </p>
      </Section>
    </div>
  );
}