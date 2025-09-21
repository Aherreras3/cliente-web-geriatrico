import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';

const EditarEjercicioModal = ({ open, onClose, idEjercicio, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]  = useState(false);
  const [msg, setMsg] = useState('');

  const [secciones, setSecciones] = useState([]);
  const [niveles, setNiveles] = useState([]);

  const [form, setForm] = useState({
    id_test: null,
    tipo: 'texto',
    estado: true,
    contenido: '',
    id_nivel: '',
    id_seccion: '',
    eliminar_imagen: false,
    contenido_binario_base64: ''
  });

  useEffect(() => {
    if (!open || !idEjercicio) return;

    const fetchAll = async () => {
      setLoading(true); setMsg('');
      try {
        const [sRes, nRes, dRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/niveles`,   { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio/${idEjercicio}`, { credentials: 'include' })
        ]);
        const [sData, nData, dData] = await Promise.all([
          sRes.json().catch(()=>[]), nRes.json().catch(()=>[]), dRes.json().catch(()=> ({}))
        ]);

        setSecciones(Array.isArray(sData) ? sData : []);
        setNiveles(Array.isArray(nData) ? nData : []);

        if (dRes.ok && dData?.id_ejercicio) {
          setForm(f => ({
            ...f,
            id_test: dData.id_test ?? null,
            tipo: dData.tipo || 'texto',
            estado: !!dData.estado,
            contenido: dData.contenido || '',
            id_nivel: String(dData.id_nivel || ''),
            id_seccion: String(dData.id_seccion || ''),
            eliminar_imagen: false,
            contenido_binario_base64: ''
          }));
        } else {
          setMsg(dData?.error || 'No se pudo cargar el ejercicio.');
        }
      } catch (e) {
        console.error(e);
        setMsg('Error al cargar datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [open, idEjercicio]);

  const onChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    if (name === 'contenido_binario_base64' && files?.[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onload = () => {
        const parts = String(reader.result).split(',');
        setForm(prev => ({ ...prev, contenido_binario_base64: parts[1] || '' }));
      };
      return;
    }
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!form.id_seccion || !form.id_nivel || !form.tipo) {
      setMsg('Faltan campos obligatorios'); return;
    }
    setSaving(true);
    try {
      const body = {
        id_test: form.id_test ?? null,
        tipo: form.tipo,
        estado: !!form.estado,
        contenido: form.contenido || null,
        id_nivel: parseInt(form.id_nivel, 10),
        id_seccion: parseInt(form.id_seccion, 10),
      };

      // manejar imagen solo si el usuario la tocó
      if (form.eliminar_imagen === true) body.eliminar_imagen = true;
      else if (form.contenido_binario_base64) body.contenido_binario_base64 = form.contenido_binario_base64;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio/${idEjercicio}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) {
        setMsg(data?.error || data?.mensaje || `HTTP ${res.status}`);
      } else {
        onSaved?.();
        onClose?.();
      }
    } catch (e) {
      console.error(e);
      setMsg('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Editar ejercicio" onClose={onClose}>
      {loading ? (
        <div className="text-gray-500">Cargando…</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {msg && <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">{msg}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Contenido</label>
            <input
              type="text"
              name="contenido"
              value={form.contenido}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sección</label>
              <select
                name="id_seccion"
                value={form.id_seccion}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Selecciona --</option>
                {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nivel</label>
              <select
                name="id_nivel"
                value={form.id_nivel}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Selecciona --</option>
                {niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="texto">Texto</option>
                <option value="imagen">Imagen</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="estado"
                type="checkbox"
                name="estado"
                checked={!!form.estado}
                onChange={onChange}
              />
              <label htmlFor="estado" className="text-sm">Activo</label>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                id="eliminar_imagen"
                type="checkbox"
                name="eliminar_imagen"
                checked={form.eliminar_imagen}
                onChange={onChange}
              />
              <label htmlFor="eliminar_imagen" className="text-sm">Eliminar imagen actual</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reemplazar imagen (opcional)</label>
              <input
                type="file"
                accept="image/*"
                name="contenido_binario_base64"
                onChange={onChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditarEjercicioModal;
