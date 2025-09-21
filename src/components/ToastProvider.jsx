import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider/>");
  return ctx;
}

export function ToastProvider({ children }) {
  const idRef = useRef(1);
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = idRef.current++;
    const t = {
      id,
      type: toast.type || "info",
      title: toast.title || "",
      message: toast.message || "",
      duration: toast.duration ?? 3500,
    };
    setToasts((arr) => [...arr, t]);
    if (t.duration > 0) {
      setTimeout(() => remove(id), t.duration);
    }
  }, [remove]);

  const api = useMemo(
    () => ({
      push,
      success: (message, title = "Listo") => push({ type: "success", title, message }),
      error:   (message, title = "Error") => push({ type: "error",   title, message }),
      warn:    (message, title = "Aviso") => push({ type: "warn",    title, message }),
      info:    (message, title = "Info")  => push({ type: "info",    title, message }),
      showError:   (message, title = "Error") => push({ type: "error",   title, message }),
      showSuccess: (message, title = "Listo") => push({ type: "success", title, message }),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Portal solo en cliente (después de montar) */}
      {mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

function iconFor(type) {
  if (type === "success") return "✅";
  if (type === "error")   return "⛔";
  if (type === "warn")    return "⚠️";
  return "ℹ️";
}

function colorFor(type) {
  if (type === "success") return "bg-green-600";
  if (type === "error")   return "bg-red-600";
  if (type === "warn")    return "bg-amber-500";
  return "bg-slate-600";
}

function ToastItem({ toast, onClose }) {
  return (
    <div
      className={`pointer-events-auto text-white shadow-lg rounded-lg px-4 py-3 min-w-[260px] max-w-[360px] animate-fade-in ${colorFor(
        toast.type
      )}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="text-xl leading-none">{iconFor(toast.type)}</div>
        <div className="flex-1">
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.message && <div className="text-sm opacity-95">{toast.message}</div>}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-white/90 hover:text-white transition"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
