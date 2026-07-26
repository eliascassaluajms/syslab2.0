import React, { createContext, useContext, useState, ReactNode } from 'react';

type TipoToast = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

interface ToastContextType {
  mostrarToast: (mensaje: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrarToast = (mensaje: string, tipo: TipoToast = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all ${
              t.tipo === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
              t.tipo === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-300' :
              t.tipo === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-300' :
              'bg-blue-950/90 border-blue-500/30 text-blue-300'
            }`}
          >
            <span>
              {t.tipo === 'success' && '✅'}
              {t.tipo === 'error' && '❌'}
              {t.tipo === 'warning' && '⚠️'}
              {t.tipo === 'info' && 'ℹ️'}
            </span>
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
};