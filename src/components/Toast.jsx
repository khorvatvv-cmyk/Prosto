import React, { useEffect, useState } from 'react';
import { CircleCheckBig } from 'lucide-react';

export default function Toast({ message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88, // выше таббара на мобилке
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px',
        borderRadius: '14px',
        backgroundColor: 'var(--color-ink)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '18px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        maxWidth: 'calc(100vw - 32px)',
        whiteSpace: 'nowrap',
        animation: 'toastFadeUp 0.35s ease',
        userSelect: 'none',
      }}
    >
      <CircleCheckBig size={18} color="#4ade80" style={{ flexShrink: 0 }} />
      <span>{message}</span>

      {/* CSS-анимация */}
      <style>{`
        @keyframes toastFadeUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}