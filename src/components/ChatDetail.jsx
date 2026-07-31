import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Check, X, Star, Phone, Mail } from 'lucide-react';

const STATUS_LABELS = {
  new: 'Новое',
  in_progress: 'В работе',
  resolved: 'Решено',
  escalated: 'Эскалация',
};

const STATUS_COLORS = {
  new: { bg: 'rgba(229, 0, 113, 0.1)', color: '#E50071' },
  in_progress: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
  resolved: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' },
  escalated: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
};

export default function ChatDetail({
  request,
  onBack,
  onOpenManager,
  onUpdateRequest,
  onNavigate,
  showToast,
}) {
  const [rating, setRating] = useState(request?.rating || 0);
  const [composerText, setComposerText] = useState('');
  const [l0Loading, setL0Loading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const l0TimerRef = useRef(null);

  const status = request?.status || 'new';
  const channel = request?.channel || 'L0';
  const isResolved = status === 'resolved';
  const isEscalated = status === 'escalated' || channel === 'L1';

  useEffect(() => {
    const initialMessages = [];
    if (channel === 'L0' && request?.l0Response) {
      initialMessages.push({ type: 'agent', text: request.l0Response });
    } else if (channel === 'L0' && !request?.l0Response) {
      initialMessages.push({ type: 'l0-loading' });
      setL0Loading(true);
      l0TimerRef.current = setTimeout(() => {
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.type === 'l0-loading');
          if (idx !== -1) {
            next[idx] = {
              type: 'agent',
              text: 'Здравствуйте! Я — агент L0. Подскажите, в чём именно заключается вопрос? Уточните, пожалуйста, версию платформы 1С и конфигурацию.',
            };
          }
          return next;
        });
        setL0Loading(false);
      }, 1200);
    }
    if (isEscalated) {
      initialMessages.push({ type: 'system', text: 'Передано L1 — специалист подключится к диалогу' });
      initialMessages.push({
        type: 'agent-l1',
        text: 'Добрый день! Меня зовут Анна, я специалист группы поддержки L1. Изучаю ваше обращение, уточните, пожалуйста, когда проблема впервые проявилась?',
      });
    }
    setMessages(initialMessages.length ? initialMessages : [{ type: 'agent', text: 'Здравствуйте! Чем могу помочь?' }]);

    return () => {
      if (l0TimerRef.current) clearTimeout(l0TimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleHelpful = () => {
    setRating(5);
    onUpdateRequest(request.id, { status: 'resolved', rating: 5 });
    setMessages((prev) => [...prev, { type: 'system', text: 'Обращение закрыто. Спасибо за оценку!' }]);
    showToast('Спасибо за обратную связь!');
  };

  const handleNotHelpful = () => {
    setMessages((prev) => [
      ...prev,
      { type: 'system', text: 'Передано L1 — специалист подключится к диалогу' },
      {
        type: 'agent-l1',
        text: 'Здравствуйте! Я специалист группы L1. Изучаю детали обращения, уточните, когда проблема возникла?',
      },
    ]);
    onUpdateRequest(request.id, { status: 'escalated', channel: 'L1' });
    showToast('Передано специалисту L1');
  };

  const handleSendComposer = () => {
    if (!composerText.trim()) return;
    setMessages((prev) => [...prev, { type: 'user', text: composerText.trim() }]);
    setComposerText('');
  };

  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.new;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderBottom: `1px solid var(--color-border)`,
          background: 'var(--color-surface)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--color-ink)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <ArrowLeft size={16} />
          Назад к списку
        </button>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Meta panel */}
        <aside
          className="chat-meta-panel"
          style={{
            width: '260px',
            flexShrink: 0,
            borderRight: `1px solid var(--color-border)`,
            background: 'var(--color-surface)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Статус
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                background: statusStyle.bg,
                color: statusStyle.color,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.color }} />
              {STATUS_LABELS[status] || status}
            </span>
          </div>

          <MetaField label="Канал" value={channel === 'L0' ? 'L0 / Автоматический' : 'L1 / Специалист'} />
          <MetaField label="Дата создания" value={request?.date || '—'} />
          <MetaField label="Тема" value={request?.title || '—'} />

          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Оценка
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={16}
                  fill={n <= rating ? '#E50071' : 'none'}
                  color={n <= rating ? '#E50071' : 'var(--color-border)'}
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              onClick={onOpenManager}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid var(--color-border)`,
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Phone size={15} />
              Связаться с менеджером
            </button>
          </div>
        </aside>

        {/* Chat area */}
        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
          {/* Chat header */}
          <div
            style={{
              padding: '14px 24px',
              borderBottom: `1px solid var(--color-border)`,
              background: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {request?.title || 'Обращение'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                {channel === 'L0' ? 'L0 / Автоматический агент' : 'L1 / Специалист поддержки'}
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                background: channel === 'L0' ? 'rgba(229,0,113,0.08)' : 'rgba(59,130,246,0.08)',
                color: channel === 'L0' ? '#E50071' : '#3B82F6',
              }}
            >
              {channel}
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg, i) => {
              if (msg.type === 'l0-loading') {
                return (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AgentAvatar />
                    <div
                      style={{
                        background: 'var(--color-surface)',
                        border: `1px solid var(--color-border)`,
                        borderRadius: '0 12px 12px 12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span className="l0-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E50071' }} />
                      <span className="l0-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E50071', animationDelay: '0.2s' }} />
                      <span className="l0-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E50071', animationDelay: '0.4s' }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginLeft: '4px' }}>Агент L0 формирует ответ…</span>
                    </div>
                  </div>
                );
              }
              if (msg.type === 'system') {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-ink-muted)',
                        background: 'var(--color-surface-2)',
                        padding: '6px 14px',
                        borderRadius: '999px',
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isUser = msg.type === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: '10px' }}>
                  {!isUser && <AgentAvatar variant={msg.type === 'agent-l1' ? 'l1' : 'l0'} />}
                  <div
                    style={{
                      maxWidth: '70%',
                      background: isUser ? 'var(--color-surface-2)' : 'var(--color-surface)',
                      border: `1px solid ${isUser ? 'var(--color-border)' : 'var(--color-border)'}`,
                      borderRadius: isUser ? '12px 0 12px 12px' : '0 12px 12px 12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      color: 'var(--color-ink)',
                    }}
                  >
                    {msg.text}
                    {!isUser && !isResolved && !isEscalated && msg.type === 'agent' && i === messages.findIndex((m) => m.type === 'agent') && !messages.some((m) => m.type === 'system' && m.text.includes('закрыто')) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={handleHelpful}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `1px solid var(--color-border)`,
                            background: 'var(--color-surface)',
                            color: 'var(--color-ink)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          Помогло
                        </button>
                        <button
                          onClick={handleNotHelpful}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `1px solid var(--color-border)`,
                            background: 'var(--color-surface)',
                            color: 'var(--color-ink)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                          Не помогло
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer / closed */}
          {isResolved ? (
            <div
              style={{
                padding: '16px 24px',
                borderTop: `1px solid var(--color-border)`,
                background: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--color-ink-muted)',
                fontSize: '14px',
              }}
            >
              <Check size={16} style={{ color: '#22C55E' }} />
              Обращение закрыто
            </div>
          ) : (
            <div
              style={{
                padding: '12px 24px',
                borderTop: `1px solid var(--color-border)`,
                background: 'var(--color-surface)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComposer()}
                placeholder={isEscalated ? 'Напишите специалисту L1…' : 'Напишите сообщение…'}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid var(--color-border)`,
                  background: 'var(--color-bg)',
                  fontSize: '14px',
                  color: 'var(--color-ink)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSendComposer}
                disabled={!composerText.trim()}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  background: composerText.trim() ? '#E50071' : 'var(--color-surface-2)',
                  color: composerText.trim() ? '#fff' : 'var(--color-ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: composerText.trim() ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                <Send size={17} />
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .l0-pulse-dot {
          animation: l0Pulse 1s ease-in-out infinite;
        }
        @keyframes l0Pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @media (max-width: 767px) {
          .chat-meta-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--color-ink)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function AgentAvatar({ variant = 'l0' }) {
  const isL1 = variant === 'l1';
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        flexShrink: 0,
        background: isL1 ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'linear-gradient(135deg, #E50071, #B0005A)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {isL1 ? 'L1' : 'L0'}
    </div>
  );
}
