import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timerRef.current);
  }, [toast, onDismiss]);

  const handleDismiss = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const iconMap = {
    success: (
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
        <svg className="w-3.5 h-3.5" style={{ color: 'var(--aurora-emerald)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(244, 63, 94, 0.15)' }}>
        <svg className="w-3.5 h-3.5" style={{ color: 'var(--aurora-rose)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
        <svg className="w-3.5 h-3.5" style={{ color: 'var(--aurora-violet)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
        <svg className="w-3.5 h-3.5" style={{ color: 'var(--aurora-amber)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
  };

  return (
    <div className={`toast-item ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="flex items-start gap-3">
        {iconMap[toast.type] || iconMap.info}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
          {toast.description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{toast.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {toast.undoAction && (
            <button
              onClick={() => { toast.undoAction(); handleDismiss(); }}
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--aurora-violet)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Undo
            </button>
          )}
          <button onClick={handleDismiss} className="btn-ghost p-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        <div className="h-full rounded-full"
          style={{
            background: toast.type === 'error' ? 'var(--aurora-rose)' :
                         toast.type === 'success' ? 'var(--aurora-emerald)' :
                         toast.type === 'warning' ? 'var(--aurora-amber)' : 'var(--aurora-violet)',
            animation: `toastProgress ${(toast.duration || 4000) / 1000}s linear forwards`,
          }} />
      </div>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const addToast = useCallback(({ message, description, type = 'info', duration = 4000, undoAction }) => {
    const id = ++idCounter.current;
    setToasts(prev => [...prev, { id, message, description, type, duration, undoAction }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
