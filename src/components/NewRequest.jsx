import { useState } from 'react';
import { Upload, X, Paperclip, MessageCirclePlus } from 'lucide-react';

export default function NewRequest({ onSubmit = () => {}, onCancel = () => {} }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Укажите тему вопроса');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), desc.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bit-bg, #f7f7f8)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* ─── Breadcrumb ─── */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 28,
            fontSize: 13,
          }}
        >
          <span
            style={{
              color: 'var(--bit-muted, #86868b)',
              cursor: 'pointer',
              transition: 'color .15s',
            }}
            onClick={onCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--bit-accent, #e6007e)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--bit-muted, #86868b)';
            }}
          >
            Вопросы
          </span>
          <span style={{ color: 'var(--bit-muted, #86868b)' }}>/</span>
          <span
            style={{
              color: 'var(--bit-ink, #1a1a1f)',
              fontWeight: 600,
            }}
          >
            Новый вопрос
          </span>
        </nav>

        {/* ─── Заголовок ─── */}
        <h1
          className="gradient-text"
          style={{
            fontSize: 34,
            fontWeight: 800,
            margin: '0 0 10px',
            background:
              'linear-gradient(90deg, var(--bit-ink, #1a1a1f) 0%, var(--bit-accent, #e6007e) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Что случилось?
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--bit-muted, #86868b)',
            marginBottom: 32,
            lineHeight: 1.5,
            maxWidth: 520,
          }}
        >
          Не нужно определять тип проблемы или искать специалиста. Просто
          опишите ситуацию.
        </p>

        {/* ─── Форма ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Тема */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--bit-ink, #1a1a1f)',
                marginBottom: 8,
              }}
            >
              О чём речь
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Например: не проводится документ в 1С"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                border: `1px solid ${
                  error
                    ? 'var(--bit-danger, #ff3b30)'
                    : 'var(--bit-border, #e5e5e7)'
                }`,
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .15s ease, box-shadow .15s ease',
                backgroundColor: 'var(--bit-surface, #fff)',
              }}
              onFocus={(e) => {
                if (!error) {
                  e.currentTarget.style.borderColor = 'var(--bit-accent, #e6007e)';
                  e.currentTarget.style.boxShadow =
                    '0 0 0 3px rgba(230,0,126,.12)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error
                  ? 'var(--bit-danger, #ff3b30)'
                  : 'var(--bit-border, #e5e5e7)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--bit-danger, #ff3b30)',
                  margin: '6px 0 0',
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--bit-ink, #1a1a1f)',
                marginBottom: 8,
              }}
            >
              Расскажите подробнее
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Что произошло? Какие действия выполняли? Что ожидали увидеть?"
              style={{
                width: '100%',
                height: 130,
                padding: '12px 16px',
                fontSize: 15,
                border: '1px solid var(--bit-border, #e5e5e7)',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                transition: 'border-color .15s ease, box-shadow .15s ease',
                backgroundColor: 'var(--bit-surface, #fff)',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--bit-accent, #e6007e)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(230,0,126,.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--bit-border, #e5e5e7)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* ─── Вложения ─── */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--bit-ink, #1a1a1f)',
                marginBottom: 8,
              }}
            >
              Вложения
            </label>

            {files.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      border: '1px solid var(--bit-border, #e5e5e7)',
                      borderRadius: 8,
                      backgroundColor: 'var(--bit-surface, #fff)',
                    }}
                  >
                    <Paperclip
                      size={16}
                      style={{ color: 'var(--bit-muted, #86868b)' }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        color: 'var(--bit-muted, #86868b)',
                        transition: 'color .15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--bit-danger, #ff3b30)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--bit-muted, #86868b)';
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '32px 24px',
                border: '2px dashed var(--bit-border, #d5d5d8)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'border-color .15s ease, background-color .15s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--bit-accent, #e6007e)';
                e.currentTarget.style.backgroundColor =
                  'rgba(230,0,126,.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--bit-border, #d5d5d8)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Upload
                size={24}
                style={{ color: 'var(--bit-muted, #86868b)' }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: 'var(--bit-ink, #1a1a1f)',
                  fontWeight: 500,
                }}
              >
                Перетащите файлы или нажмите для выбора
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--bit-muted, #86868b)',
                }}
              >
                PNG, JPG, PDF — до 10 МБ
              </span>
              <input
                type="file"
                multiple
                onChange={handleFiles}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* ─── Кнопки ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid var(--bit-border, #e5e5e7)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              border: '1px solid var(--bit-border, #e5e5e7)',
              background: 'transparent',
              color: 'var(--bit-muted, #86868b)',
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              padding: '12px 20px',
              borderRadius: 10,
              transition: 'all .15s ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.borderColor = 'var(--bit-muted, #86868b)';
                e.currentTarget.style.color = 'var(--bit-ink, #1a1a1f)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--bit-border, #e5e5e7)';
              e.currentTarget.style.color = 'var(--bit-muted, #86868b)';
            }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              backgroundColor: submitting
                ? 'rgba(230,0,126,.65)'
                : 'var(--bit-accent, #e6007e)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(230,0,126,.25)',
              transition: 'transform .15s ease, box-shadow .15s ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 8px 22px rgba(230,0,126,.35)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 14px rgba(230,0,126,.25)';
            }}
          >
            <MessageCirclePlus size={20} />
            {submitting ? 'Отправка…' : 'Просто спросить'}
          </button>
        </div>
      </div>
    </div>
  );
}