import React, { useEffect, useRef } from "react";

/**
 * ConfirmDialog
 *  - Reutilizable
 *  - Accesible (role="dialog", cierra con ESC y al hacer clic fuera)
 *  - Bloquea el scroll del body mientras está abierto
 *
 * Props:
 *  - open            : boolean
 *  - title           : string
 *  - message         : ReactNode
 *  - onCancel        : () => void
 *  - onConfirm       : () => void | Promise<void>
 *  - confirmLabel    : string (default: "Confirmar")
 *  - cancelLabel     : string (default: "Cancelar")
 *  - confirmLoading  : boolean (mientras confirmas)
 *  - tone            : "danger" | "default" (estilos del botón confirmar)
 */
export default function ConfirmDialog({
  open,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmLoading = false,
  tone = "danger",
}) {
  const backdropRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Bloquea scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Cerrar con tecla ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  // Enfocar botón confirmar al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-verde hover:bg-emerald-700 text-white";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === backdropRef.current) onCancel?.();
        }}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-xl border">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div id="confirm-desc" className="px-5 py-4 text-gray-700">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
            disabled={confirmLoading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading}
            className={`px-4 py-2 rounded ${confirmClasses} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {confirmLoading ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
