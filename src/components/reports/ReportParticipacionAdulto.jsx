import React, {useEffect,useState} from 'react';
const api = process.env.NEXT_PUBLIC_API_URL;

export default function ReportParticipacionAdulto(){
  const [from,setFrom]=useState('2025-09-01');
  const [to,setTo]=useState('2025-09-30');
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(false); const [err,setErr]=useState(null);

  const load=async()=>{
    setLoading(true); setErr(null);
    try{
      const url = new URL(`${api}/reportes/participacion-adulto`);
      url.searchParams.set('from',from); url.searchParams.set('to',to);
      const r = await fetch(url,{credentials:'include'});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      setRows(await r.json());
    }catch(e){ setErr(e.message);} finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  return (
    <div className="space-y-4">
      <Filtros from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={load}/>
      {loading? <div>Cargando…</div> : err? <Error msg={err}/> : (
        <div className="overflow-auto bg-white shadow rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Adulto</th>
                <th className="p-3 text-left">Iniciados</th>
                <th className="p-3 text-left">Completados</th>
                <th className="p-3 text-left">% Participación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id_adulto} className="border-t">
                  <td className="p-3">{r.nombres} {r.apellidos}</td>
                  <td className="p-3">{r.tests_iniciados}</td>
                  <td className="p-3">{r.tests_completados}</td>
                  <td className="p-3">{Number(r.porcentaje_participacion||0).toFixed(2)}%</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="4" className="p-6 text-center">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function Filtros({from,to,setFrom,setTo,onApply}){
  return (
    <div className="flex gap-3 items-end">
      <div><label className="block text-sm">Desde</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-3 py-2"/></div>
      <div><label className="block text-sm">Hasta</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-3 py-2"/></div>
      <button onClick={onApply} className="px-4 py-2 rounded bg-teal-600 text-white">Aplicar</button>
    </div>
  );
}
function Error({msg}){ return <div className="p-3 bg-red-50 text-red-700 rounded">{msg}</div>; }
