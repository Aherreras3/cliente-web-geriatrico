// src/components/CrearSeccionModal.jsx
import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { mapApiError } from '@/lib/api-error';

function getCtx() {
  try { return JSON.parse(localStorage.getItem('geriatrico_activo') || 'null'); }
  catch { return null; }
}
function isSuper() { return localStorage.getItem('is_superadmin') === '1'; }

const CrearSeccionModal = ({ isOpen, onClose, onCreated }) => {
  const { showError, showSuccess } = useToast();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);

  const submit = async () => {
    if (!nombre.trim()) { showError('El nombre es requerido'); return; }
    if (!descripcion.trim()) { showError('La descripción es requerido'); return; }

    const ctx = getCtx();
    if (isSuper() && !ctx?.id) {
      showError('Primero elige un geriátrico en el header.');
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(isSuper() && ctx?.id ? { 'X-Geriatrico-Id': String(ctx.id) } : {})
        },
        body: JSON.stringify({ nombre, descripcion }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(mapApiError(data?.error || `HTTP ${res.status}`));
        return;
      }

      setNombre(''); setDescripcion(''); 
      onCreated?.(data?.seccion || null);
      showSuccess('Sección creada con éxito');
      onClose?.();
    } catch (e) {
      console.error(e);
      showError('No se pudo crear la sección.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">Nueva Sección</h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e)=>setNombre(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e)=>setDescripcion(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded" disabled={cargando}>
            Cancelar
          </button>
          <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearSeccionModal;
