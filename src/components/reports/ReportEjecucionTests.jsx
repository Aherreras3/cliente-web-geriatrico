import React, { useEffect, useMemo, useState } from 'react';
const api = process.env.NEXT_PUBLIC_API_URL;

export default function ReportEjecucionTests() {
  const [from, setFrom] = useState('2025-09-17');
  const [to, setTo] = useState('2025-09-19');
  const [data, setData] = useState({ resumen: [], detalle: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [openAdulto, setOpenAdulto] = useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const url = new URL(`${api}/reportes/ejecucion-tests-con-promedio`);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      const r = await fetch(url.toString(), {
        credentials: 'include', cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData({ resumen: json.resumen || [], detalle: json.detalle || [] });
    } catch (e) { setErr(e.message || 'Error cargando reporte'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => {
    const adultos = data.resumen.length;
    const testsComp = data.resumen.reduce((a, r) => a + (Number(r.tests_completados) || 0), 0);
    const prom = adultos ? (data.resumen.reduce((a, r) => a + (Number(r.promedio_puntaje) || 0), 0) / adultos) : 0;
    const dur = adultos ? (data.resumen.reduce((a, r) => a + (Number(r.duracion_prom_seg) || 0), 0) / adultos) : 0;
    return { adultos, testsComp, prom: prom.toFixed(2), dur: Math.round(dur) };
  }, [data]);

  const detallePorAdulto = useMemo(() => {
    const map = new Map();
    for (const d of data.detalle) {
      const arr = map.get(d.id_adulto) || [];
      arr.push(d);
      map.set(d.id_adulto, arr);
    }
    return map;
  }, [data]);

  const exportCSV = (rows, filename = 'reporte.csv') => {
    const cols = Object.keys(rows[0] || {});
    const csv = [
      cols.join(','),
      ...rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <button onClick={load} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">
          Aplicar
        </button>
        <button onClick={() => exportCSV(data.resumen, 'resumen_por_adulto.csv')} className="px-4 py-2 rounded border">
          Exportar resumen
        </button>
        <button onClick={() => exportCSV(data.detalle, 'detalle_ejecucion.csv')} className="px-4 py-2 rounded border">
          Exportar detalle
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-gray-500">Cargando…</div>
      ) : err ? (
        <div className="p-4 bg-red-50 text-red-700 rounded">{err}</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Adultos activos" value={kpis.adultos} />
            <KPI title="Tests completados" value={kpis.testsComp} />
            <KPI title="Promedio general" value={kpis.prom} />
            <KPI title="Duración prom. (seg)" value={kpis.dur} />
          </div>

          {/* Tabla resumen */}
          <div className="overflow-auto bg-white shadow rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Adulto</th>
                  <th className="p-3 text-left">Tests</th>
                  <th className="p-3 text-left">Promedio</th>
                  <th className="p-3 text-left">Última actividad</th>
                  <th className="p-3 text-left">Duración prom. (seg)</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.resumen.map(r => (
                  <React.Fragment key={r.id_adulto}>
                    <tr className="border-t">
                      <td className="p-3">{r.nombres} {r.apellidos}</td>
                      <td className="p-3">{r.tests_completados}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{Number(r.promedio_puntaje ?? 0).toFixed(2)}</span>
                          <div className="h-2 w-32 bg-gray-200 rounded">
                            <div
                              className="h-2 rounded"
                              style={{
                                width: `${Math.min(100, Number(r.promedio_puntaje || 0))}%`,
                                background: Number(r.promedio_puntaje || 0) >= 80 ? '#16a34a'
                                  : Number(r.promedio_puntaje || 0) >= 60 ? '#f59e0b' : '#dc2626',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{r.ultima_actividad ? new Date(r.ultima_actividad).toLocaleString() : '—'}</td>
                      <td className="p-3">{Math.round(Number(r.duracion_prom_seg || 0))}</td>
                      <td className="p-3">
                        <button
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => setOpenAdulto(openAdulto === r.id_adulto ? null : r.id_adulto)}
                        >
                          {openAdulto === r.id_adulto ? 'Ocultar' : 'Ver detalle'}
                        </button>
                      </td>
                    </tr>
                    {openAdulto === r.id_adulto && (
                      <tr className="border-t bg-gray-50">
                        <td colSpan="6" className="p-0">
                          <DetalleTabla rows={detallePorAdulto.get(r.id_adulto) || []} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!data.resumen.length && (
                  <tr><td colSpan="6" className="p-6 text-center text-gray-500">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function DetalleTabla({ rows }) {
  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-2">Detalle del adulto (últimos intentos por test)</div>
      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Fecha inicio</th>
              <th className="p-2 text-left">Fecha fin</th>
              <th className="p-2 text-left">Test</th>
              <th className="p-2 text-left">Completado</th>
              <th className="p-2 text-left">Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id_progreso} className="border-t">
                <td className="p-2">{r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleString() : '—'}</td>
                <td className="p-2">{r.fecha_fin ? new Date(r.fecha_fin).toLocaleString() : '—'}</td>
                <td className="p-2">{r.titulo || `Test ${r.id_test}`}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${r.completado ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {r.completado ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="p-2">{r.puntaje ?? '—'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan="5" className="p-3 text-center text-gray-500">Sin detalle</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
