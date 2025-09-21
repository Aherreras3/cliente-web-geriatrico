// pages/dashboard/index.jsx (o donde tengas el dashboard)
import React, { useEffect, useMemo, useState } from "react";
import { FaUserNurse, FaUser, FaBrain, FaChartBar } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "";

function getCtx() {
  try { return JSON.parse(localStorage.getItem("geriatrico_activo") || "null"); }
  catch { return null; }
}

const ResumenDashboard = () => {
  const [top, setTop] = useState([]);                 // [{ id_seccion, nombre, usos }]
  const [adultosEval, setAdultosEval] = useState(0);  // adultos evaluados (DISTINCT)
  const [testsOk, setTestsOk] = useState(0);          // tests realizados
  const [testsNew, setTestsNew] = useState(0);        // tests creados sin evaluar
  const [cuidadores, setCuidadores] = useState(0);    // cuidadores registrados
  const [adultosTot, setAdultosTot] = useState(0);    // adultos mayores
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setErr("");
      try {
        const headers = {};
        const ctx = getCtx();
        if (ctx?.id) headers["X-Geriatrico-Id"] = String(ctx.id);

        const r = await fetch(`${API}/dashboard/metrics`, {
          credentials: "include",
          headers,
          signal: ctrl.signal,
        });
        if (r.status === 401) { window.location.href = "/login"; return; }
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Respuesta no JSON");

        const d = await r.json();
        setTop(Array.isArray(d.top_secciones) ? d.top_secciones : []);
        setAdultosEval(Number(d.adultos_evaluados || 0));
        setTestsOk(Number(d.tests_realizados_intentos || 0));      // Tests realizados (intentos)
        - setTestsNew(Number(d.tests_no_evaluados || 0));
        + setTestsNew(Number(d.tests_pendientes_intentos || 0));    // <<< ahora muestra intentos 'active'
        setCuidadores(Number(d.cuidadores_registrados || 0));
        setAdultosTot(Number(d.adultos_mayores || 0));


      } catch (e) {
        setErr(e.message || "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const chartData = useMemo(
    () => top.map(s => ({ name: s.nombre, uso: Number(s.usos || 0) })),
    [top]
  );
  const seccionTop = top?.[0]?.nombre || "—";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-darkblue mb-6">Panel de Control</h1>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card icon={<FaUserNurse />} title="Cuidadores Registrados" value={loading ? "…" : cuidadores} />
        <Card icon={<FaUser />} title="Adultos Mayores" value={loading ? "…" : adultosTot} />
        <Card icon={<FaBrain />} title="Adultos Evaluados" value={loading ? "…" : adultosEval} />
        <Card icon={<FaChartBar />} title="Sección más utilizada" value={loading ? "…" : seccionTop} />
      </div>

      {/* Top 5 Secciones más utilizadas */}
      <div className="bg-white p-6 rounded shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-darkblue">Secciones más utilizadas (Top 5)</h2>
          {!loading && !err && (
            <span className="text-xs text-gray-500">Total: {chartData.length}</span>
          )}
        </div>

        {err ? (
          <div className="text-red-600 text-sm">{err}</div>
        ) : loading ? (
          <div className="text-gray-500 text-sm">Cargando…</div>
        ) : chartData.length === 0 ? (
          <div className="text-gray-500 text-sm">Sin datos</div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="uso" fill="#0ba27f" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Segunda hilera: Tests realizados vs no evaluados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-lg font-semibold text-darkblue mb-2">Tests realizados</h2>
          <p className="text-3xl font-bold text-darkblue">{loading ? "…" : testsOk}</p>
          <p className="text-sm text-gray-600 mt-1">Total de intentos completados</p>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-verde rounded-full"
              style={{ width: `${testsOk ? 100 : 5}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-lg font-semibold text-darkblue mb-2">Tests creados sin evaluar</h2>
          <p className="text-3xl font-bold text-darkblue">{loading ? "…" : testsNew}</p>
          <p className="text-sm text-gray-600 mt-1">Tests que aún no tienen ningún progreso completado</p>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-gray-400 rounded-full"
              style={{ width: `${testsNew ? 100 : 5}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ icon, title, value }) => (
  <div className="bg-white rounded shadow-md p-4 flex items-center gap-4">
    <div className="text-verde text-3xl">{icon}</div>
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xl font-bold text-darkblue">{String(value)}</p>
    </div>
  </div>
);

export default ResumenDashboard;
