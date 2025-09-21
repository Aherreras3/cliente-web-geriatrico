// src/pages/dashboard/tienda.jsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const api = process.env.NEXT_PUBLIC_API_URL;
const emptyForm = { nombre: '', costo_xp: 1, categoria: '', descripcion: '', activo: true };

export default function TiendaPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) ¿Sesión válida?
        const res = await fetch(`${api}/usuarios/protegido`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const ok = res.status === 200 || res.status === 304;
        setAutenticado(ok);

        let data = {};
        try { data = await res.json(); } catch { data = {}; }
        setUsuario(data?.user || null);

        if (!ok) return;
        // 2) ¿Es admin? — probamos contra el endpoint protegido real
        const probe = await fetch(`${api}/movil/admin/tienda/items?all=0&__probe=1`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        setIsAdmin(probe.status === 200);
      } catch {
        setAutenticado(false);
        setIsAdmin(false);
        setUsuario(null);
      } finally {
        setVerificando(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      {verificando ? (
        <div className="p-6 text-center">Verificando acceso...</div>
      ) : !autenticado ? (
        <div className="p-6 text-center">No autenticado. Inicia sesión.</div>
      ) : !isAdmin ? (
        <div className="p-6 text-center">No autorizado. Solo administradores.</div>
      ) : (
        <div className="p-6">
          <TiendaAdmin />
        </div>
      )}
    </DashboardLayout>
  );
}



function TiendaAdmin() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [onlyActivos, setOnlyActivos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const url = new URL(`${api}/movil/admin/tienda/items`);
      if (q) url.searchParams.set('q', q);
      url.searchParams.set('all', onlyActivos ? '0' : '1');

      const r = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (r.status === 403) { setError('Solo administradores'); setItems([]); return; }
      if (!r.ok) {
        let d = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || `HTTP ${r.status}`);
      }
      const data = await r.json().catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Error cargando ítems');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, onlyActivos]);

  const onNew = () => { setForm(emptyForm); setEditId(null); setFile(null); setPreview(null); setShowForm(true); };
  const onEdit = (it) => {
    setForm({ nombre: it.nombre, costo_xp: it.costo_xp, categoria: it.categoria || '', descripcion: it.descripcion || '', activo: it.activo });
    setEditId(it.id_item);
    setFile(null);
    setPreview(`${api}/movil/tienda/items/${it.id_item}/icon`);
    setShowForm(true);
  };
  const onDelete = async (it) => {
    if (!confirm(`Desactivar "${it.nombre}"?`)) return;
    try {
      const r = await fetch(`${api}/movil/admin/tienda/items/${it.id_item}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!r.ok) {
        let d = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || `HTTP ${r.status}`);
      }
      load();
    } catch (e) {
      alert(e?.message || 'No se pudo desactivar');
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nombre', form.nombre);
      fd.append('costo_xp', String(form.costo_xp));
      if (form.categoria)   fd.append('categoria', form.categoria);
      if (form.descripcion) fd.append('descripcion', form.descripcion);
      fd.append('activo', String(!!form.activo));
      if (!editId && !file) { setSaving(false); return alert('Debes subir una imagen para crear el ítem.'); }
      if (file) fd.append('icono_file', file);

      const url = editId ? `${api}/movil/admin/tienda/items/${editId}` : `${api}/movil/admin/tienda/items`;
      const r = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!r.ok) {
        let d = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || `HTTP ${r.status}`);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Ítems de tienda</h2>
        <button onClick={onNew} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">
          + Nuevo ítem
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="border rounded px-3 py-2 w-72" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!onlyActivos} onChange={(e) => setOnlyActivos(!e.target.checked)} />
          <span>Mostrar inactivos</span>
        </label>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
      ) : (
        <div className="overflow-auto bg-white shadow rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Costo XP</th>
                <th className="text-left p-3">Imagen</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Activo</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id_item} className="border-t">
                  <td className="p-3">{it.id_item}</td>
                  <td className="p-3">{it.nombre}</td>
                  <td className="p-3">{it.costo_xp}</td>
                  <td className="p-3">
                    <img
                      src={`${api}/movil/tienda/items/${it.id_item}/icon`}
                      alt=""
                      className="w-10 h-10 object-contain"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                  </td>
                  <td className="p-3">{it.categoria || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${it.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {it.activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => onEdit(it)}>Editar</button>
                      <button className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700" onClick={() => onDelete(it)}>Desactivar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-lg">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId ? 'Editar ítem' : 'Nuevo ítem'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={onSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input className="border rounded px-3 py-2 w-full" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Costo XP</label>
                <input type="number" min="1" className="border rounded px-3 py-2 w-40" value={form.costo_xp} onChange={(e) => setForm({ ...form, costo_xp: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Imagen {editId ? '(opcional para actualizar)' : '(obligatoria al crear)'}
                </label>
                <input type="file" accept="image/*" onChange={onFile} className="block w-full" />
                {preview && <img src={preview} alt="preview" className="mt-2 w-24 h-24 object-contain border rounded" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Categoría</label>
                  <input className="border rounded px-3 py-2 w-full" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="activo" type="checkbox" checked={!!form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  <label htmlFor="activo">Activo</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Descripción</label>
                <textarea className="border rounded px-3 py-2 w-full" rows="3" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
