import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, CheckCircle2, HelpCircle, Phone } from 'lucide-react';

/* ─── Метки статусов ─── */
const STATUS_LABELS = {
  new: 'Новый',
  in_progress: 'В работе',
  resolved: 'Решено',
  escalated: 'Эскалация',
};

/* ─── Цвета статуса ─── */
const STATUS_COLORS = {
  new:        { bg: 'rgba(230,0,126,0.12)', color: 'var(--bit-accent, #e6007e)' },
  in_progress: { bg: 'rgba(134,134,139,0.15)', color: 'var(--bit-muted, #86868b)' },
  resolved:   { bg: 'rgba(52,199,89,0.12)', color: '#34C759' },
  escalated:  { bg: 'rgba(26,26,31,0.08)', color: 'var(--bit-ink, #1a1a1f)' },
};

/* ================================================================
   ChatDetail
   ================================================================ */
export default function ChatDetail({
  request,
  onBack,
  onOpenManager,
  onUpdateRequest,
  onNavigate,
  showToast,
}) {
  const [composerText, setComposerText] = useState('');
  const [l0Loading, setL0Loading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const l0TimerRef = useRef(null);

  const status = request?.status || 'new';
  const channel = request?.channel || 'auto';
  const isResolved = status === 'resolved';
  const isSpecialist = channel === 'specialist' || status === 'escalated';
  const showL0Actions =
    channel === 'auto' &&
    !isResolved &&
    !isSpecialist &&
    messages.length > 0 &&
    messages[messages.length - 1]?.type === 'agent' &&
    !messages.some((m) => m.type === 'system');

  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.new;

  /* ─── Инициализация сообщений ─── */
  useEffect(() => {
    const initialMessages = [];

    if (channel === 'auto' && request?.l0Response) {
      initialMessages.push({ type: 'agent', text: request.l0Response });
    } else if (channel === 'auto' && !request?.l0Response) {
      initialMessages.push({ type: 'l0-loading' });
      setL0Loading(true);
      l0TimerRef.current = setTimeout(() => {
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.type === 'l0-loading');
          if (idx !== -1) {
            next[idx] = {
              type: 'agent',
              text: 'Здравствуйте! Я — автоответчик «просто.». Уточните, пожалуйста, версию 1С и конфигурацию — в чём именно проблема?',
            };
          }
          return next;
        });
        setL0Loading(false);
      }, 1800);
    }

    if (isSpecialist) {
      initialMessages.push({
        type: 'system',
        text: 'Подключаем специалиста. Повторно описывать не нужно.',
      });
      initialMessages.push({
        type: 'agent-specialist',
        text: 'Добрый день! Меня зовут Анна, я специалист поддержки. Изучаю ваш вопрос. Уточните, когда проблема впервые появилась?',
      });
    }

    setMessages(
      initialMessages.length
        ? initialMessages
        : [{ type: 'agent', text: 'Здравствуйте! Чем могу помочь?' }]
    );

    return () => {
      if (l0TimerRef.current) clearTimeout(l0TimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ─── «Да, всё работает» ─── */
  const handleHelpful = () => {
    onUpdateRequest(request.id, { status: 'resolved' });
    setMessages((prev) => [
      ...prev,
      { type: 'system', text: 'Вопрос решён. Спасибо за обратную связь!' },
    ]);
    showToast('Вопрос решён');
  };

  /* ─── «Нет, нужна помощь» ─── */
  const handleNotHelpful = () => {
    setMessages((prev) => [
      ...prev,
      {
        type: 'system',
        text: 'Подключаем специалиста. Повторно описывать не нужно.',
      },
      {
        type: 'agent-specialist',
        text: 'Здравствуйте! Я специалист поддержки. Изучаю детали вопроса. Уточните, когда проблема возникла?',
      },
    ]);
    onUpdateRequest(request.id, { status: 'escalated', channel: 'specialist' });
    showToast('Передано специалисту');
  };

  const handleSendComposer = () => {
    if (!composerText.trim()) return;
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: composerText.trim() },
    ]);
    setComposerText('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* ─── Верхняя панель ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--bit-border, #e5e5e7)',
          background: 'var(--bit-surface, #fff)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--bit-ink, #1a1a1f)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 8,
            transition: 'background .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bit-tab-bg, #ececee)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <ArrowLeft size={16} />
          Назад к вопросам
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* ═══ Мета-панель ═══ */}
        <aside
          className="chat-meta-panel"
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: '1px solid var(--bit-border, #e5e5e7)',
            background: 'var(--bit-surface, #fff)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--bit-muted, #86868b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Статус
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: 12,
                fontWeight: 600,
                background: statusStyle.bg,
                color: statusStyle.color,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.color }} />
              {STATUS_LABELS[status] || status}
            </span>
          </div>

          <MetaField
            label="Канал"
            value={channel === 'auto' ? 'Автоматический ответ' : 'Специалист'}
          />
          <MetaField label="Дата создания" value={request?.date || '—'} />
          <MetaField label="Тема" value={request?.title || '—'} />

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              onClick={onOpenManager}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--bit-border, #e5e5e7)',
                background: 'var(--bit-surface, #fff)',
                color: 'var(--bit-ink, #1a1a1f)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bit-tab-bg, #ececee)';
                e.currentTarget.style.borderColor = 'var(--bit-accent, #e6007e)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bit-surface, #fff)';
                e.currentTarget.style.borderColor = 'var(--bit-border, #e5e5e7)';
              }}
            >
              <Phone size={15} />
              Связаться с менеджером
            </button>
          </div>
        </aside>

        {/* ═══ Область чата ═══ */}
        <section
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bit-bg, #f7f7f8)',
          }}
        >
          {/* Шапка */}
          <div
            style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--bit-border, #e5e5e7)',
              background: 'var(--bit-surface, #fff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--bit-ink, #1a1a1f)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {request?.title || 'Вопрос'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--bit-muted, #86868b)', marginTop: 2 }}>
                {channel === 'auto' ? 'Автоматический ответ' : 'Специалист поддержки'}
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: 12,
                fontWeight: 600,
                background: channel === 'auto' ? 'rgba(230,0,126,0.1)' : 'rgba(26,26,31,0.08)',
                color: channel === 'auto' ? 'var(--bit-accent, #e6007e)' : 'var(--bit-ink, #1a1a1f)',
              }}
            >
              {channel === 'auto' ? 'Авто' : 'Специалист'}
            </span>
          </div>

          {/* Сообщения */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg, i) => {
              if (msg.type === 'l0-loading') {
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AgentAvatar variant="auto" />
                    <div style={{ background: 'var(--bit-surface, #fff)', border: '1px solid var(--bit-border, #e5e5e7)', borderRadius: '0 12px 12px 12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="l0-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bit-accent, #e6007e)' }} />
                      <span className="l0-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bit-accent, #e6007e)', animationDelay: '0.2s' }} />
                      <span className="l0-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bit-accent, #e6007e)', animationDelay: '0.4s' }} />
                      <span style={{ fontSize: 13, color: 'var(--bit-muted, #86868b)', marginLeft: 4 }}>Ищем решение…</span>
                    </div>
                  </div>
                );
              }
              if (msg.type === 'system') {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--bit-muted, #86868b)', background: 'var(--bit-tab-bg, #ececee)', padding: '6px 14px', borderRadius: '999px' }}>
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isUser = msg.type === 'user';
              const isSpecialistAgent = msg.type === 'agent-specialist';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10 }}>
                  {!isUser && <AgentAvatar variant={isSpecialistAgent ? 'specialist' : 'auto'} />}
                  <div style={{ maxWidth: '70%', background: isUser ? 'var(--bit-tab-bg, #ececee)' : 'var(--bit-surface, #fff)', border: '1px solid var(--bit-border, #e5e5e7)', borderRadius: isUser ? '12px 0 12px 12px' : '0 12px 12px 12px', padding: '12px 16px', fontSize: 14, lineHeight: 1.5, color: 'var(--bit-ink, #1a1a1f)' }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Футер: кнопки L0 / решено / композер */}
          {showL0Actions && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--bit-border, #e5e5e7)', background: 'var(--bit-surface, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexShrink: 0 }}>
              <button onClick={handleHelpful} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #34C759', background: 'rgba(52,199,89,0.08)', color: '#34C759', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52,199,89,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52,199,89,0.08)'; }}>
                <CheckCircle2 size={18} />
                Да, всё работает
              </button>
              <button onClick={handleNotHelpful} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid var(--bit-accent, #e6007e)', background: 'rgba(230,0,126,0.06)', color: 'var(--bit-accent, #e6007e)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(230,0,126,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(230,0,126,0.06)'; }}>
                <HelpCircle size={18} />
                Нет, нужна помощь
              </button>
            </div>
          )}

          {isResolved && !showL0Actions && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--bit-border, #e5e5e7)', background: 'var(--bit-surface, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#34C759', fontSize: 14, fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              Вопрос решён
            </div>
          )}

          {!isResolved && !showL0Actions && !l0Loading && (
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--bit-border, #e5e5e7)', background: 'var(--bit-surface, #fff)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComposer()}
                placeholder={isSpecialist ? 'Напишите специалисту…' : 'Напишите сообщение…'}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--bit-border, #e5e5e7)', background: 'var(--bit-bg, #f7f7f8)', fontSize: 14, color: 'var(--bit-ink, #1a1a1f)', outline: 'none', transition: 'border-color .15s ease' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bit-accent, #e6007e)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bit-border, #e5e5e7)'; }}
              />
              <button
                onClick={handleSendComposer}
                disabled={!composerText.trim()}
                style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: composerText.trim() ? 'var(--bit-accent, #e6007e)' : 'var(--bit-tab-bg, #ececee)', color: composerText.trim() ? '#fff' : 'var(--bit-muted, #86868b)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: composerText.trim() ? 'pointer' : 'default', transition: 'background .15s, transform .1s', boxShadow: composerText.trim() ? '0 2px 8px rgba(230,0,126,.3)' : 'none' }}
                onMouseEnter={(e) => { if (composerText.trim()) e.currentTarget.style.transform = 'scale(1.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Send size={17} />
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .l0-pulse-dot {
          animation: l0Pulse 1.2s ease-in-out infinite;
        }
        @keyframes l0Pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @media (max-width: 767px) {
          .chat-meta-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ================================================================
   Вспомогательные компоненты
   ================================================================ */
function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--bit-muted, #86868b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--bit-ink, #1a1a1f)', fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function AgentAvatar({ variant = 'auto' }) {
  const isSpec = variant === 'specialist';
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: isSpec ? 'linear-gradient(135deg, #1a1a1f, #3a3a40)' : 'linear-gradient(135deg, var(--bit-accent, #e6007e), #b0005a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
      {isSpec ? 'СП' : 'А'}
    </div>
  );
}
