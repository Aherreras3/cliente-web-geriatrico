import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';

const GenerarEjerciciosModal = ({ isOpen, onClose, idSeccionDefault='', idNivelDefault='', onSaved }) => {
  const [tema, setTema] = useState('');
  const [cantidad, setCantidad] = useState(5);
  const [idSeccion, setIdSeccion] = useState(String(idSeccionDefault || ''));
  const [idNivel, setIdNivel] = useState(String(idNivelDefault || ''));
  const [secciones, setSecciones] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [sRes, nRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/niveles`, { credentials: 'include' })
        ]);
        const [sData, nData] = await Promise.all([
          sRes.json().catch(()=>[]), nRes.json().catch(()=>[])
        ]);
        setSecciones(Array.isArray(sData) ? sData : []);
        setNiveles(Array.isArray(nData) ? nData : []);
      } catch {}
    };
    load();
  }, [isOpen]);

  useEffect(() => {
    setIdSeccion(String(idSeccionDefault || ''));
    setIdNivel(String(idNivelDefault || ''));
  }, [idSeccionDefault, idNivelDefault]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!tema.trim() || !idSeccion || !idNivel) {
      setMsg('Completa tema, sección y nivel.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio/generar`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: tema.trim(),
          cantidad: Math.max(1, Math.min(10, Number(cantidad) || 1)),
          id_seccion: parseInt(idSeccion, 10),
          id_nivel: parseInt(idNivel, 10),
          tipo: 'texto'
        })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) {
        setMsg(data?.error || data?.mensaje || `HTTP ${res.status}`);
      } else {
        setMsg(data?.mensaje || 'Generado');
        onSaved?.();
        onClose?.();
      }
    } catch (e) {
      console.error(e);
      setMsg('Error al generar');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={isOpen} title="Generar ejercicios" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {msg && <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">{msg}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Tema</label>
          <input
            type="text"
            value={tema}
            onChange={(e)=>setTema(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="p. ej. colores, animales, frutas…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad (1–10)</label>
            <input
              type="number"
              min={1} max={10}
              value={cantidad}
              onChange={(e)=>setCantidad(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sección</label>
            <select
              value={idSeccion}
              onChange={(e)=>setIdSeccion(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Selecciona --</option>
              {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nivel</label>
            <select
              value={idNivel}
              onChange={(e)=>setIdNivel(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Selecciona --</option>
              {niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded" disabled={sending}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded" disabled={sending}>
            {sending ? 'Generando…' : 'Generar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerarEjerciciosModal;
