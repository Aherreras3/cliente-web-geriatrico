import React, { useEffect, useState } from 'react';

// Base de la API sin la barra final
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// Helper: muestra solo fecha legible (DD/MM/YYYY). Cambia la locale si quieres.
const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export default function ReportProgresoTiempo() {
  const [from, setFrom] = useState('2025-09-01');
  const [to, setTo] = useState('2025-09-30');
  const [bucket, setBucket] = useState('week'); // 'day' | 'week' | 'month'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const url = new URL(`${apiBase}/reportes/progreso-tiempo`);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      url.searchParams.set('bucket', bucket);
      const r = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRows(await r.json());
    } catch (e) {
      setErr(e.message || 'Error cargando reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // carga inicial

  const exportCSV = () => {
    if (!rows.length) return;
    const cols = ['periodo', 'tests_iniciados', 'tests_completados', 'promedio_puntaje'];
    const csv = [
      cols.join(','),
      ...rows.map(x => [
        fmtDate(x.periodo),
        x.tests_iniciados ?? '',
        x.tests_completados ?? '',
        (x.promedio_puntaje ?? '').toString()
      ].map(v => JSON.stringify(v)).join(','))
    ].join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'progreso_tiempo.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Bucket</label>
          <select value={bucket} onChange={e => setBucket(e.target.value)} className="border rounded px-3 py-2">
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
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
                <th className="p-3 text-left">Periodo</th>
                <th className="p-3 text-left">Iniciados</th>
                <th className="p-3 text-left">Completados</th>
                <th className="p-3 text-left">Promedio puntaje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{fmtDate(r.periodo)}</td>
                  <td className="p-3">{r.tests_iniciados}</td>
                  <td className="p-3">{r.tests_completados}</td>
                  <td className="p-3">{Number(r.promedio_puntaje ?? 0).toFixed(2)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
