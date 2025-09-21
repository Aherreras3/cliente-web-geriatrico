import React, { useEffect, useState } from 'react';
const api = process.env.NEXT_PUBLIC_API_URL;

export default function ReportCuidadores() {
  const [from, setFrom] = useState('2025-09-01');
  const [to, setTo] = useState('2025-09-30');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const url = new URL(`${api}/reportes/cuidadores`);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      const r = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRows(await r.json());
    } catch (e) {
      setErr(e?.message || 'Error cargando reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!rows.length) return;
    const cols = ['nombres','apellidos','adultos_distintos','tests_iniciados','tests_completados','promedio_puntaje','tasa_completado'];
    const withRate = rows.map(r => ({
      ...r,
      tasa_completado: r.tests_iniciados
        ? (100 * Number(r.tests_completados || 0) / Number(r.tests_iniciados)).toFixed(2) + '%'
        : '0%'
    }));
    const csv = [
      cols.join(','),
      ...withRate.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(',')),
    ].join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'reporte_cuidadores.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Desde</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-3 py-2"/>
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-3 py-2"/>
        </div>
        <button onClick={load} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">
          Aplicar
        </button>
        <button onClick={exportCSV} className="px-4 py-2 rounded border">
          Exportar CSV
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-gray-500">Cargando…</div>
      ) : err ? (
        <div className="p-4 bg-red-50 text-red-700 rounded">{err}</div>
      ) : (
        <div className="overflow-auto bg-white shadow rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Cuidador</th>
                <th className="p-3 text-left">Adultos asignados</th>
                <th className="p-3 text-left">Tests iniciados</th>
                <th className="p-3 text-left">Tests completados</th>
                <th className="p-3 text-left">% Completado</th>
                <th className="p-3 text-left">Promedio puntaje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rate = r.tests_iniciados
                  ? (100 * Number(r.tests_completados || 0) / Number(r.tests_iniciados))
                  : 0;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-3">{`${r.nombres ?? '—'} ${r.apellidos ?? ''}`.trim()}</td>
                    <td className="p-3">{r.adultos_distintos}</td>
                    <td className="p-3">{r.tests_iniciados}</td>
                    <td className="p-3">{r.tests_completados}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{rate.toFixed(2)}%</span>
                        <div className="h-2 w-28 bg-gray-200 rounded">
                          <div className="h-2 rounded"
                               style={{
                                 width: `${Math.min(rate,100)}%`,
                                 background: rate >= 80 ? '#16a34a' : rate >= 60 ? '#f59e0b' : '#dc2626'
                               }}/>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{Number(r.promedio_puntaje ?? 0).toFixed(2)}</td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
