"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export type ToastState = {
  message: string;
  visible: boolean;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast state={toast} onDismiss={() => setToast((t) => ({ ...t, visible: false }))} />
    </ToastContext.Provider>
  );
}

function Toast({ state, onDismiss }: { state: ToastState; onDismiss: () => void }) {
  if (!state.visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
      <span>{state.message}</span>
      <button
        onClick={onDismiss}
        className="text-zinc-400 hover:text-white transition-colors leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
