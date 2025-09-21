// src/components/InfoDialog.jsx
import React, { useEffect, useRef } from "react";

export default function InfoDialog({
  open,
  onClose,
  title = "Aviso",
  message,
  tone = "info",              // "info" | "danger" | "success" | "warning"
  // Botón principal (OK / Confirmar)
  actionLabel = "Entendido",
  onAction,
  // Botón secundario (Cancelar) -> si no envías label, no se muestra
  secondaryLabel,
  onSecondary,
  // UX extra
  loading = false,            // deshabilita botones y muestra spinner en el primario
  preventBackdropClose = false, // si true, no cierra al clickear fuera
  autoCloseMs,                // cierra solo después de N ms (opcional)
}) {
  const primaryBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // bloquear scroll del body
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // enfoque inicial
    const t = setTimeout(() => primaryBtnRef.current?.focus(), 30);

    // cerrar por teclado
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!loading) onClose?.();
      } else if (e.key === "Enter") {
        // Enter actúa como primario
        if (!loading) (onAction || onClose)?.();
      }
    };
    window.addEventListener("keydown", onKey);

    // autocierre
    let timer;
    if (autoCloseMs && Number(autoCloseMs) > 0) {
      timer = setTimeout(() => {
        if (!loading) onClose?.();
      }, Number(autoCloseMs));
    }

    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      if (timer) clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, loading, onAction, onClose, autoCloseMs]);

  if (!open) return null;

  const toneStyles =
    {
      info:    { iconBg: "bg-blue-100",    iconFg: "text-blue-700",    ring: "ring-blue-100",    btn: "bg-gray-900 hover:bg-black" },
      danger:  { iconBg: "bg-red-100",     iconFg: "text-red-700",     ring: "ring-red-100",     btn: "bg-red-600 hover:bg-red-700" },
      success: { iconBg: "bg-emerald-100", iconFg: "text-emerald-700", ring: "ring-emerald-100", btn: "bg-emerald-600 hover:bg-emerald-700" },
      warning: { iconBg: "bg-amber-100",   iconFg: "text-amber-700",   ring: "ring-amber-100",   btn: "bg-amber-600 hover:bg-amber-700" },
    }[tone] || { iconBg: "bg-blue-100", iconFg: "text-blue-700", ring: "ring-blue-100", btn: "bg-gray-900 hover:bg-black" };

  const Icon = () => {
    if (tone === "danger") {
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.594c.75 1.335-.213 3.007-1.742 3.007H3.48c-1.53 0-2.493-1.672-1.742-3.007L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
      );
    }
    if (tone === "success") {
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 10.435a1 1 0 111.414-1.414l3.01 3.01 6.657-6.657a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
      );
    }
    if (tone === "warning") {
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.594c.75 1.335-.213 3.007-1.742 3.007H3.48c-1.53 0-2.493-1.672-1.742-3.007L8.257 3.1zM11 14H9v2h2v-2zm0-7H9v5h2V7z"/>
        </svg>
      );
    }
    // info
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 9h2v6H9V9zm0-4h2v2H9V5z"/>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd"/>
      </svg>
    );
  };

  const handleBackdrop = () => {
    if (!preventBackdropClose && !loading) onClose?.();
  };

  const handleAction = () => {
    if (loading) return;
    (onAction || onClose)?.();
  };

  const handleSecondary = () => {
    if (loading) return;
    (onSecondary || onClose)?.();
  };

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={handleBackdrop}
        aria-hidden="true"
      />
      <div className="relative h-full w-full flex items-center justify-center p-4 sm:p-6">
        <div
          className={`bg-white w-full max-w-md rounded-2xl shadow-xl ring-1 ${toneStyles.ring} animate-[fadeIn_.15s_ease-out]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${toneStyles.iconBg} ${toneStyles.iconFg}`}>
                <Icon />
              </div>
              <div className="flex-1">
                <h3 id="dialog-title" className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
                {typeof message === "string" ? (
                  <p className="mt-1 text-sm text-gray-700">{message}</p>
                ) : (
                  <div className="mt-1 text-sm text-gray-700">{message}</div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-4 flex justify-end gap-2">
              {secondaryLabel && (
                <button
                  onClick={handleSecondary}
                  disabled={loading}
                  className="inline-flex items-center rounded-md bg-gray-100 text-gray-800 px-4 py-2 text-sm hover:bg-gray-200 transition disabled:opacity-60"
                >
                  {secondaryLabel}
                </button>
              )}
              <button
                ref={primaryBtnRef}
                onClick={handleAction}
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-md text-white px-4 py-2 text-sm transition disabled:opacity-60 ${toneStyles.btn}`}
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                )}
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
