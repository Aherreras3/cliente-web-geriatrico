import React, { useEffect, useState } from 'react';
const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export default function ReportAbandono(){
  const [from,setFrom]=useState('2025-09-01');
  const [to,setTo]=useState('2025-09-30');
  const [data,setData]=useState({por_adulto:[], por_test:[]});
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null);

  const load=async()=>{
    setLoading(true); setErr(null);
    try{
      const url=new URL(`${api}/reportes/abandono`);
      url.searchParams.set('from',from); url.searchParams.set('to',to);
      const r=await fetch(url.toString(),{credentials:'include', cache:'no-store'});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    }catch(e){ setErr(e.message);} finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const exportCSV=(arr, filename)=>{
    if(!arr?.length) return;
    const cols=Object.keys(arr[0]);
    const csv=[cols.join(','), ...arr.map(o=>cols.map(c=>JSON.stringify(o[c]??'')).join(','))].join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=filename; a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div><label className="block text-sm">Desde</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-3 py-2"/></div>
        <div><label className="block text-sm">Hasta</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-3 py-2"/></div>
        <button onClick={load} className="px-4 py-2 rounded bg-teal-600 text-white">Aplicar</button>
      </div>

      {loading? <div className="p-6 text-gray-500">Cargando…</div>
      : err? <div className="p-4 bg-red-50 text-red-700 rounded">{err}</div>
      : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top abandono por adulto</h2>
            <button onClick={()=>exportCSV(data.por_adulto,'abandono_por_adulto.csv')} className="px-3 py-1 rounded border">Exportar CSV</button>
          </div>
          <TablaAbandonoAdulto rows={data.por_adulto} />

          <div className="flex items-center justify-between mt-6">
            <h2 className="text-lg font-semibold">Top abandono por test</h2>
            <button onClick={()=>exportCSV(data.por_test,'abandono_por_test.csv')} className="px-3 py-1 rounded border">Exportar CSV</button>
          </div>
          <TablaAbandonoTest rows={data.por_test} />
        </>
      )}
    </div>
  );
}

function TablaAbandonoAdulto({rows=[]}){
  return (
    <div className="overflow-auto bg-white shadow rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Adulto</th>
            <th className="p-3 text-left">Abandonos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} className="border-t">
              <td className="p-3">{`${r.nombres ?? '—'} ${r.apellidos ?? ''}`.trim()}</td>
              <td className="p-3">{r.abandonos}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="2" className="p-6 text-center text-gray-500">Sin datos</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function TablaAbandonoTest({rows=[]}){
  return (
    <div className="overflow-auto bg-white shadow rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Test</th>
            <th className="p-3 text-left">Abandonos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} className="border-t">
              <td className="p-3">{r.titulo}</td>
              <td className="p-3">{r.abandonos}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="2" className="p-6 text-center text-gray-500">Sin datos</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
