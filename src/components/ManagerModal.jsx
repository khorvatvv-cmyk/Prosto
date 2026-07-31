import React, { useState, useEffect, useCallback } from 'react';
import { X, Phone, Mail, MessageCircle, Send } from 'lucide-react';

export default function ManagerModal({ onClose, showToast }) {
  const [text, setText] = useState('');

  // Закрытие по ESC
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Блокировка прокрутки body
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleSend = () => {
    if (!text.trim()) return;
    showToast?.('Сообщение отправлено');
    onClose?.();
  };

  // Закрытие по клику на overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'toastFadeIn 0.2s ease',
      }}
    >
      {/* Модальное окно */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 16px 28px',
          animation: 'managerModalIn 0.3s ease',
          position: 'relative',
        }}
      >
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          className="hover:bg-[var(--color-border)]"
        >
          <X size={18} />
        </button>

        {/* Заголовок */}
        <h2
          style={{
            margin: '0 0 20px',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-ink)',
          }}
        >
          Ваш менеджер
        </h2>

        {/* Аватар + ФИО */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              flexShrink: 0,
              background:
                'linear-gradient(135deg, var(--color-accent) 0%, #ff7eb3 50%, #ff758c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            ИИ
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            >
              Иванов Иван Иванович
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '13px',
                color: 'var(--color-ink-muted)',
              }}
            >
              Персональный менеджер · Офис Кемерово
            </p>
          </div>
        </div>

        {/* Контакты */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <a
            href="tel:+79991234567"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-ink)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.15s ease',
            }}
            className="hover:bg-[var(--color-border)]"
          >
            <Phone size={16} color="var(--color-accent)" />
            +7 (999) 123-45-67
          </a>

          <a
            href="mailto:manager@bit.ru"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-ink)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.15s ease',
            }}
            className="hover:bg-[var(--color-border)]"
          >
            <Mail size={16} color="var(--color-accent)" />
            manager@bit.ru
          </a>

          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-ink)',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s ease',
            }}
            className="hover:bg-[var(--color-border)]"
          >
            <MessageCircle size={16} color="var(--color-accent)" />
            Написать сообщение
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите ваш вопрос менеджеру…"
          rows={4}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: '14px',
            lineHeight: '20px',
            color: 'var(--color-ink)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease',
          }}
          className="focus:border-[var(--color-accent)]"
        />

        {/* Кнопка Отправить */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            marginTop: '14px',
            padding: '12px 0',
            fontSize: '15px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: text.trim()
              ? 'var(--color-accent)'
              : 'var(--color-ink-light)',
            border: 'none',
            borderRadius: '12px',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.15s ease',
          }}
          className={text.trim() ? 'hover:opacity-90 active:opacity-80' : ''}
        >
          <Send size={16} />
          Отправить
        </button>
      </div>

      {/* CSS-анимации (вставляем один раз через style-тег) */}
      <style>{`
        @keyframes toastFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes managerModalIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}