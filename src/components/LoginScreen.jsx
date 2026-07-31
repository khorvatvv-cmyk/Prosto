import { useState } from 'react';
import { Check, Mail, Building } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ email: '', password: '', inn: '' });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin?.(loginForm);
  };

  const handleRegSubmit = (e) => {
    e.preventDefault();
    onLogin?.(regForm);
  };

  return (
    <div
      style={{
        '--color-accent': '#E50071',
        '--color-accent-glow': 'rgba(229,0,113,0.18)',
        '--color-text': '#18181B',
        '--color-bg': '#FAFAFA',
        '--color-surface': '#FFFFFF',
        '--color-surface-2': '#F4F4F5',
        '--color-border': '#E4E4E7',
      }}
      className="flex min-h-screen w-full font-sans antialiased"
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0) translateX(0); }
          50%     { transform: translateY(-32px) translateX(16px); }
        }
        .fade-up { animation: fadeUp .6s cubic-bezier(.21,1.02,.43,1) both; }
        .float-anim { animation: float 8s ease-in-out infinite; }
        .focus-ring:focus { box-shadow: 0 0 0 4px var(--color-accent-glow); }
        .focus-ring { transition: box-shadow .2s ease, border-color .2s ease; }
        .focus-ring:focus { border-color: var(--color-accent); }
        .tab-active { color: #fff; background: var(--color-accent); }
      `}</style>

      {/* Left panel — form */}
      <aside
        className="fade-up flex w-full max-w-[480px] shrink-0 flex-col justify-center bg-[var(--color-surface)] px-10 py-12"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        {/* Logo */}
        <div className="mb-10 select-none text-[28px] font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          <span className="lowercase">первый</span>
          <span style={{ color: 'var(--color-accent)' }}>.</span>
          <span className="capitalize">Бит</span>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-[12px] bg-[var(--color-surface-2)] p-1">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === 'login' ? 'tab-active' : 'text-[#71717A] hover:text-[var(--color-text)]'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setTab('registration')}
            className={`flex-1 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === 'registration' ? 'tab-active' : 'text-[#71717A] hover:text-[var(--color-text)]'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="fade-up flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={18} />
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="focus-ring w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none placeholder:text-[#A1A1AA]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Пароль</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                className="focus-ring w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[#A1A1AA]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-[10px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Войти
            </button>

            <button
              type="button"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              Войти через 1С:ИТС
            </button>

            <p className="mt-2 text-center text-sm text-[#71717A]">
              Нет аккаунта?{' '}
              <button type="button" onClick={() => setTab('registration')} className="font-semibold" style={{ color: 'var(--color-accent)' }}>
                Зарегистрироваться
              </button>
            </p>
          </form>
        )}

        {/* Registration form */}
        {tab === 'registration' && (
          <form onSubmit={handleRegSubmit} className="fade-up flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={18} />
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="focus-ring w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none placeholder:text-[#A1A1AA]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Пароль</label>
              <input
                type="password"
                required
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                placeholder="••••••••"
                className="focus-ring w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[#A1A1AA]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">ИНН</label>
              <div className="relative">
                <Building className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={18} />
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={regForm.inn}
                  onChange={(e) => setRegForm({ ...regForm, inn: e.target.value.replace(/\D/g, '') })}
                  placeholder="7707083893"
                  className="focus-ring w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none placeholder:text-[#A1A1AA]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-[10px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Создать аккаунт
            </button>

            <button
              type="button"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              Продолжить с Google
            </button>
          </form>
        )}
      </aside>

      {/* Right panel — brand block */}
      <section
        className="fade-up relative flex flex-1 flex-col justify-center overflow-hidden px-16 py-12"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(229,0,113,0.10) 0%, rgba(229,0,113,0.02) 40%, var(--color-bg) 100%)',
        }}
      >
        {/* Floating blur circle */}
        <div
          className="float-anim pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full"
          style={{ background: 'rgba(229,0,113,0.12)', filter: 'blur(80px)' }}
        />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-[44px] font-bold leading-[1.1] tracking-tight" style={{ color: 'var(--color-text)' }}>
            БИТ.<span style={{ color: 'var(--color-accent)' }}>ПОДДЕРЖКА</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#52525B]">
            Единая точка входа для обращения в техподдержку, отслеживания заявок и получения помощи от экспертов 1С.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {[
              'Быстрое создание и отслеживание заявок в реальном времени',
              'Прямой доступ к экспертам 1С и базе знаний',
              'Сервисные соглашения и история обращений в одном месте',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: 'var(--color-accent-glow)' }}
                >
                  <Check size={15} style={{ color: 'var(--color-accent)' }} />
                </span>
                <span className="text-sm leading-relaxed text-[#3F3F46]">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-lg font-semibold italic" style={{ color: 'var(--color-accent)' }}>
            Первыми — делают люди!
          </p>
        </div>
      </section>

      {/* Mobile: hide brand block */}
      <style>{`
        @media (max-width: 900px) {
          aside { max-width: 100% !important; }
          section.brand-block { display: none !important; }
        }
      `}</style>
    </div>
  );
}
