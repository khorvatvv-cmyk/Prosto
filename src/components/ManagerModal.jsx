import { useState, useEffect } from 'react';
import { X, Phone, Mail, Send } from 'lucide-react';

export default function ManagerModal({ onClose, showToast }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSend = () => {
    onClose();
    showToast('Сообщение отправлено менеджеру');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(24, 24, 27, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="manager-modal-inner"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--color-surface)',
          borderRadius: '16px',
          border: `1px solid var(--color-border)`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid var(--color-border)`,
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Ваш менеджер</h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-surface-2)',
              color: 'var(--color-ink-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-2)';
              e.currentTarget.style.color = 'var(--color-ink-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Manager block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #18181B, #E50071)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              АП
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>Анна Петрова</div>
              <div style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>Персональный менеджер</div>
            </div>
          </div>

          {/* Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="tel:+74951234567"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid var(--color-border)`,
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Phone size={16} style={{ color: '#E50071' }} />
              +7 (495) 123-45-67
            </a>
            <a
              href="mailto:anna.petrova@1bit.ru"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid var(--color-border)`,
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Mail size={16} style={{ color: '#E50071' }} />
              anna.petrova@1bit.ru
            </a>
          </div>

          {/* Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-ink-muted)', marginBottom: '6px' }}>
              Сообщение
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Опишите ваш вопрос или предложение…"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: `1px solid var(--color-border)`,
                background: 'var(--color-bg)',
                fontSize: '14px',
                color: 'var(--color-ink)',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#E50071')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 20px',
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
            <Send size={16} />
            Отправить сообщение
          </button>
        </div>
      </div>

      <style>{`
        .manager-modal-inner {
          animation: modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalScaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
