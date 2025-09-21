import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const api = process.env.NEXT_PUBLIC_API_URL;
const empty = { titulo:'', descripcion:'', xp_bonus:0, activo:true, regla_tipo:'FIRST_TEST', regla_min:'' };

// Si tu superadmin selecciona geriátrico por UI, lee ese id para enviarlo como header:
function getGeriatricoHeader() {
  try {
    const gId = localStorage.getItem('geriatrico_activo_id'); // ajusta al store que uses
    return gId ? { 'X-Geriatrico-Id': gId } : {};
  } catch { return {}; }
}

export default function LogrosPage(){
  const [autenticado,setAutenticado]=useState(false);
  const [verificando,setVerificando]=useState(true);
  const [isAdmin,setIsAdmin]=useState(false);

  const [items,setItems]=useState([]);
  const [q,setQ]=useState('');
  const [onlyActivos,setOnlyActivos]=useState(true);
  const [loading,setLoading]=useState(true);

  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState(empty);
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [editId,setEditId]=useState(null);

  // Verifica sesión + “probe” de admin como en Tienda
  useEffect(()=>{(async()=>{
    try{
      const r=await fetch(`${api}/usuarios/protegido`,{credentials:'include'});
      const ok=r.status===200||r.status===304;
      setAutenticado(ok);
      if(!ok) return;
      const p=await fetch(`${api}/movil/admin/logros?__probe=1`,{
        credentials:'include',
        headers: { ...getGeriatricoHeader(), 'Cache-Control':'no-cache' }
      });
      setIsAdmin(p.status===200);
    }finally{ setVerificando(false); }
  })();},[]);

  const load = async ()=>{
    setLoading(true);
    try{
      const url=new URL(`${api}/movil/admin/logros`);
      if(q) url.searchParams.set('q', q);
      url.searchParams.set('all', onlyActivos ? '0':'1');

      const r=await fetch(url.toString(),{
        credentials:'include',
        headers: { ...getGeriatricoHeader(), 'Cache-Control':'no-cache' }
      });
      if(!r.ok){ setItems([]); return; }
      const d=await r.json().catch(()=>[]);
      setItems(Array.isArray(d)?d:[]);
    }finally{ setLoading(false); }
  };
  useEffect(()=>{ if(autenticado&&isAdmin) load(); },[autenticado,isAdmin]);
  useEffect(()=>{ const t=setTimeout(()=>{ if(isAdmin) load(); },250); return ()=>clearTimeout(t); },[q,onlyActivos]);

  const onNew=()=>{ setForm(empty); setEditId(null); setFile(null); setPreview(null); setShowForm(true); };
  const onEdit=(it)=>{
    setForm({
      titulo:it.titulo, descripcion:it.descripcion||'', xp_bonus:it.xp_bonus||0, activo:!!it.activo,
      regla_tipo: it.regla?.tipo||'FIRST_TEST', regla_min: it.regla?.min ?? ''
    });
    setEditId(it.id_logro);
    setFile(null);
    setPreview(`${api}/movil/logros/${it.id_logro}/icon`);
    setShowForm(true);
  };
  const onDelete=async(it)=>{
    if(!confirm(`Desactivar "${it.titulo}"?`)) return;
    const r=await fetch(`${api}/movil/admin/logros/${it.id_logro}`,{
      method:'DELETE', credentials:'include', headers:getGeriatricoHeader()
    });
    if(r.ok) load();
  };

  const onSubmit=async(e)=>{
    e.preventDefault();
    const fd=new FormData();
    fd.append('titulo',form.titulo);
    fd.append('descripcion',form.descripcion);
    fd.append('xp_bonus',String(form.xp_bonus));
    fd.append('activo',String(!!form.activo));
    fd.append('regla_tipo',form.regla_tipo);
    if(form.regla_tipo!=='FIRST_TEST') fd.append('regla_min',String(form.regla_min||0));
    if(!editId && !file) return alert('Debes subir un icono para crear.');
    if(file) fd.append('icono_file',file);

    const url = editId ? `${api}/movil/admin/logros/${editId}` : `${api}/movil/admin/logros`;
    const r = await fetch(url,{
      method: editId ? 'PUT' : 'POST',
      credentials:'include',
      headers: getGeriatricoHeader(),
      body: fd
    });
    if(!r.ok){ let d={}; try{d=await r.json();}catch{}; alert(d?.error||`HTTP ${r.status}`); return; }
    setShowForm(false); load();
  };

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
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Logros (Administración)</h1>
            <button onClick={onNew} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">
              + Nuevo logro
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar…"
                   className="border rounded px-3 py-2 w-72" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!onlyActivos} onChange={e=>setOnlyActivos(!e.target.checked)} />
              <span>Mostrar inactivos</span>
            </label>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="text-gray-500">Cargando…</div>
          ) : (
            <div className="overflow-auto bg-white shadow rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Título</th>
                    <th className="p-3 text-left">XP</th>
                    <th className="p-3 text-left">Icono</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Min</th>
                    <th className="p-3 text-left">Activo</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it=>(
                    <tr key={it.id_logro} className="border-t">
                      <td className="p-3">{it.id_logro}</td>
                      <td className="p-3">{it.titulo}</td>
                      <td className="p-3">{it.xp_bonus}</td>
                      <td className="p-3">
                        <img src={`${api}/movil/logros/${it.id_logro}/icon`} alt=""
                             className="w-10 h-10 object-contain"
                             onError={(e)=>{e.currentTarget.style.visibility='hidden';}} />
                      </td>
                      <td className="p-3">{it.regla?.tipo || '—'}</td>
                      <td className="p-3">{it.regla?.min ?? '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${it.activo?'bg-green-100 text-green-700':'bg-gray-200 text-gray-600'}`}>
                          {it.activo ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={()=>onEdit(it)}>Editar</button>
                          <button className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700" onClick={()=>onDelete(it)}>Desactivar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr><td className="p-6 text-center text-gray-500" colSpan={8}>Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Form */}
          {showForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded shadow-lg w-full max-w-lg">
                <div className="px-5 py-3 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{editId?'Editar logro':'Nuevo logro'}</h2>
                  <button onClick={()=>setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <form onSubmit={onSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Título</label>
                    <input className="border rounded px-3 py-2 w-full"
                           value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} required/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <textarea className="border rounded px-3 py-2 w-full" rows="3"
                              value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">XP bonus</label>
                      <input type="number" className="border rounded px-3 py-2 w-full"
                             value={form.xp_bonus} onChange={e=>setForm({...form,xp_bonus:e.target.value})}/>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="activo" type="checkbox" checked={!!form.activo}
                             onChange={e=>setForm({...form,activo:e.target.checked})}/>
                      <label htmlFor="activo">Activo</label>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <label className="block text-sm font-medium">Regla</label>
                    <select className="border rounded px-3 py-2 w-full"
                            value={form.regla_tipo}
                            onChange={e=>setForm({...form,regla_tipo:e.target.value})}>
                      <option value="FIRST_TEST">Primer test completado</option>
                      <option value="SCORE_GTE">Puntaje ≥ mínimo</option>
                      <option value="PROGRESS_REACHED">Progreso alcanzado (umbral)</option>
                    </select>
                    {form.regla_tipo!=='FIRST_TEST' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium">Mínimo (%)</label>
                        <input type="number" min="0" max="100" className="border rounded px-3 py-2 w-full"
                               value={form.regla_min} onChange={e=>setForm({...form,regla_min:e.target.value})}/>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Icono {editId ? '(opcional para actualizar)' : '(obligatorio al crear)'}
                    </label>
                    <input type="file" accept="image/*"
                           onChange={(e)=>{const f=e.target.files?.[0]||null; setFile(f); setPreview(f?URL.createObjectURL(f):null);}}/>
                    {preview && <img src={preview} alt="preview" className="mt-2 w-24 h-24 object-contain border rounded" />}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" className="px-4 py-2 rounded border" onClick={()=>setShowForm(false)}>Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">Guardar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
