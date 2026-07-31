import { Check } from 'lucide-react';

export default function Toast({ message }) {
  return (
    <>
      <div className="toast-container">
        <div className="toast-icon">
          <Check size={16} />
        </div>
        <span className="toast-text">{message}</span>
      </div>
      <style>{`
        .toast-container {
          position: fixed;
          bottom: 80px;
          right: 24px;
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px 12px 14px;
          background: #18181B;
          color: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          font-size: 14px;
          font-weight: 500;
          max-width: 90vw;
          animation: toastFadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #E50071;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .toast-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @keyframes toastFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 767px) {
          .toast-container {
            bottom: 72px;
            right: 50%;
            transform: translateX(50%);
            left: 50%;
          }
          @keyframes toastFadeUp {
            from {
              opacity: 0;
              transform: translate(-50%, 12px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        }
      `}</style>
    </>
  );
}
