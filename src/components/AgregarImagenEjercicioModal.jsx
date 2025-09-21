import { useState } from 'react';
import Modal from '@/components/Modal';

function getCtx() {
  try { return JSON.parse(localStorage.getItem('geriatrico_activo') || 'null'); }
  catch { return null; }
}

const AgregarImagenEjercicioModal = ({ open, onClose, idEjercicio, onSaved }) => {
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const toBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => {
        const parts = String(reader.result).split(',');
        resolve(parts[1] || '');
      };
      reader.onerror = reject;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!file) { setMsg('Selecciona una imagen'); return; }

    setSending(true);
    try {
      const b64 = await toBase64(file);
      const headers = { 'Content-Type': 'application/json' };
      const ctx = getCtx();
      if (ctx?.id) headers['X-Geriatrico-Id'] = String(ctx.id);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio/${idEjercicio}/imagen`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ contenido_binario_base64: b64 }),
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) {
        setMsg(data?.error || data?.mensaje || `HTTP ${res.status}`);
      } else {
        setMsg('Imagen guardada');
        onSaved?.();
        onClose?.();
      }
    } catch (err) {
      console.error(err);
      setMsg('Error al subir la imagen');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} title="Añadir imagen al ejercicio" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {msg && <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">{msg}</div>}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={sending}
          className="w-full"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded" disabled={sending}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={sending}>
            {sending ? 'Subiendo…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AgregarImagenEjercicioModal;
