import { useState } from 'react';

const CrearTestModal = ({ isOpen, onClose, onSubmit }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // CrearTestModal.jsx
  const handleSubmit = async () => {
    setCargando(true);
    setError('');
    try {
      const isSuper = localStorage.getItem('is_superadmin') === '1';
      let ctx = null;
      if (isSuper) {
        try { ctx = JSON.parse(localStorage.getItem('geriatrico_activo') || 'null'); } catch { }
        if (!ctx?.id) { setError('Primero selecciona un geriátrico.'); setCargando(false); return; }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(isSuper && ctx?.id ? { 'X-Geriatrico-Id': String(ctx.id) } : {}),
        },
        body: JSON.stringify({ titulo, descripcion }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Error HTTP ${res.status}`);
        return;
      }

      onSubmit(data);
      onClose();
      setTitulo(''); setDescripcion('');
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el test.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-[#0F766E]">Crear nuevo Test</h2>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" disabled={cargando}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-[#0F766E] text-white rounded hover:bg-[#0d5e57]" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearTestModal;
