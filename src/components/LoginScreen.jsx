import { useState } from 'react';
import { Check, MessageCircle, ArrowRight } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [contact, setContact] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin?.({ contact });
  };

  return (
    <div
      style={{
        '--color-accent': '#E50071',
        '--color-accent-glow': 'rgba(229,0,113,0.18)',
        '--color-ink': '#18181B',
        '--color-bg': '#FAFAFA',
        '--color-surface': '#FFFFFF',
        '--color-surface-2': '#F4F4F5',
        '--color-border': '#E4E4E7',
        '--color-muted': '#71717A',
        '--color-muted-foreground': '#A1A1AA',
      }}
      className="flex min-h-screen w-full font-sans antialiased"
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          animation: fadeUp .6s cubic-bezier(.21,1.02,.43,1) both;
        }
        .focus-ring {
          transition: box-shadow .2s ease, border-color .2s ease;
        }
        .focus-ring:focus {
          box-shadow: 0 0 0 4px var(--color-accent-glow);
          border-color: var(--color-accent);
          outline: none;
        }
        .shadow-card {
          box-shadow: 0 4px 24px rgba(24,24,27,0.06), 0 1px 4px rgba(24,24,27,0.04);
        }
        .shadow-card-hover:hover {
          box-shadow: 0 8px 32px rgba(24,24,27,0.10), 0 2px 8px rgba(24,24,27,0.06);
        }
      `}</style>

      {/* Левая панель — форма */}
      <aside
        className="fade-up flex w-full max-w-[480px] shrink-0 flex-col justify-center bg-[var(--color-surface)] px-10 py-12"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        {/* Логотип + бренд */}
        <div className="mb-8 flex items-center gap-3 select-none">
          <img
            src="/logo.png"
            alt="просто."
            className="h-10 w-10 rounded-[10px]"
            style={{ boxShadow: '0 2px 8px rgba(229,0,113,0.15)' }}
          />
          <div>
            <div className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              просто<span style={{ color: 'var(--color-accent)' }}>.</span>
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
              Поддержка Первого Бита
            </div>
          </div>
        </div>

        {/* Обещание */}
        <p
          className="mb-8 text-sm font-medium italic leading-relaxed"
          style={{ color: 'var(--color-accent)' }}
        >
          Сложное — нам. Вам — просто.
        </p>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Email или телефон
            </label>
            <div className="relative">
              <MessageCircle
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: 'var(--color-muted-foreground)' }}
              />
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="ivan@company.ru / +7 900 123-45-67"
                className="focus-ring w-full rounded-[12px] border bg-[var(--color-surface)] py-3.5 pl-11 pr-4 text-sm outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-ink)',
                  '--tw-placeholder-color': 'var(--color-muted-foreground)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="shadow-card-hover group flex items-center justify-center gap-2 rounded-[12px] py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <span>Просто спросить</span>
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </form>

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          Нажимая «Просто спросить», вы принимаете{' '}
          <button
            type="button"
            className="font-medium underline underline-offset-2 transition-colors hover:opacity-80"
            style={{ color: 'var(--color-accent)' }}
          >
            условия обработки данных
          </button>
        </p>
      </aside>

      {/* Правая панель — бренд-блок */}
      <section
        className="fade-up relative flex flex-1 flex-col justify-between overflow-hidden px-16 py-14"
        style={{
          background:
            'radial-gradient(ellipse at 25% 30%, rgba(229,0,113,0.10) 0%, rgba(229,0,113,0.02) 50%, var(--color-bg) 100%)',
        }}
      >
        {/* Декоративное пятно */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
          style={{ background: 'rgba(229,0,113,0.10)', filter: 'blur(100px)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full"
          style={{ background: 'rgba(229,0,113,0.06)', filter: 'blur(80px)' }}
        />

        {/* Контент */}
        <div className="relative z-10 flex flex-col justify-center min-h-full">
          <h1
            className="text-[42px] font-bold leading-[1.15] tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            Просто расскажи.
            <br />
            <span style={{ color: 'var(--color-accent)' }}>Дальше — мы.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Расскажите своими словами, что произошло. Мы разберёмся, подключим нужных
            специалистов и доведём вопрос до результата.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {[
              ['Один раз описали — дальше мы', 'Ваше обращение берём в работу без лишних уточнений и переводов'],
              ['Не нужно знать, к кому обратиться', 'Сами определим эксперта и распределим задачи внутри команды'],
              ['Контекст не теряется при передаче', 'Вся история вопроса доступна вам и специалистам в один клик'],
            ].map(([title, desc]) => (
              <li key={title} className="flex items-start gap-3.5">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: 'var(--color-accent-glow)' }}
                >
                  <Check size={16} style={{ color: 'var(--color-accent)' }} />
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {title}
                  </div>
                  <div className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {desc}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Слоган внизу */}
        <div className="relative z-10 mt-12 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
          Поддержка Первого Бита
        </div>
      </section>

      {/* Адаптив: на мобилке скрываем правый блок и растягиваем форму */}
      <style>{`
        @media (max-width: 900px) {
          aside { max-width: 100% !important; }
          section { display: none !important; }
        }
      `}</style>
    </div>
  );
}