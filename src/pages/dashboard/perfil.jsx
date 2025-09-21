import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiHash,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL || "";

function Badge({ children, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700",
    teal: "bg-teal-100 text-teal-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

function Row({ icon: Icon, label, value }) {
  const IconSafe = Icon || (() => <span className="inline-block h-4 w-4 rounded bg-emerald-600/30" />);
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
      <div className="mt-0.5 shrink-0">
        <IconSafe className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value ?? "—"}</div>
      </div>
    </div>
  );
}

export default function Perfil() {
  const [rows, setRows] = useState([]); // puede haber varias filas (uno por geriátrico)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API}/usuarios/perfil`, { credentials: "include", signal: ctrl.signal });
        if (res.status === 401) { window.location.href = "/login"; return; }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Respuesta no JSON");
        const d = await res.json();
        const list = Array.isArray(d?.data) ? d.data : [];
        setRows(list);
      } catch (e) {
        setErr(e.message || "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  // Tomamos la primera fila como “principal”
  const u = rows[0] || {};
  const nombreCompleto = [u?.nombres, u?.apellidos].filter(Boolean).join(" ");
  const initials = useMemo(() => {
    const a = (u?.nombres || "").trim().charAt(0).toUpperCase();
    const b = (u?.apellidos || "").trim().charAt(0).toUpperCase();
    return (a + b) || "?";
  }, [u]);

  const sexoMap = (s) =>
    !s ? "—" : String(s).toUpperCase() === "M" ? "Masculino"
        : String(s).toUpperCase() === "F" ? "Femenino"
        : s;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* HERO */}
        <div className="relative mb-6">
          <div className="h-32 sm:h-36 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 -mt-16">
            {/* Tarjeta del usuario */}
            <div className="rounded-2xl bg-white shadow-sm p-6">
              {loading ? (
                <div className="animate-pulse flex items-start gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-emerald-100" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ) : err ? (
                <div className="text-sm text-red-600">{err}</div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center ring-4 ring-white shadow-md text-2xl font-semibold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-semibold leading-tight truncate">
                      {nombreCompleto || u?.usuario || "Usuario"}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone="emerald"><FiShield className="mr-1" /> {u?.rol || "—"}</Badge>
                      <Badge tone="teal"><FiHash className="mr-1" /> {u?.identificacion || "—"}</Badge>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Mostrando perfil básico (solo datos personales + afiliaciones)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Datos personales */}
            <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm">
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse grid grid-cols-2 gap-3">
                    <div className="h-14 bg-gray-100 rounded" />
                    <div className="h-14 bg-gray-100 rounded" />
                    <div className="h-14 bg-gray-100 rounded" />
                    <div className="h-14 bg-gray-100 rounded" />
                  </div>
                </div>
              ) : err ? (
                <div className="p-6 text-sm text-red-600">{err}</div>
              ) : (
                <div className="p-2 sm:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Row icon={FiUser} label="Nombres" value={u?.nombres} />
                    <Row icon={FiUser} label="Apellidos" value={u?.apellidos} />
                    <Row icon={FiHash} label="Identificación" value={u?.identificacion} />
                    <Row icon={FiUser} label="Sexo" value={sexoMap(u?.sexo)} />
                    <Row icon={FiMail} label="Correo" value={u?.correo} />
                    <Row icon={FiPhone} label="Usuario" value={u?.usuario} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Afiliaciones a geriátricos */}
        {!loading && !err && (
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-semibold">Geriátricos & Roles</h2>
            </div>
            <div className="p-4">
              {rows.length === 0 ? (
                <div className="text-sm text-gray-500">Sin afiliaciones.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rows.map((r, i) => (
                    <div key={i} className="rounded-xl border p-3 bg-white/70">
                      <div className="text-sm font-semibold truncate">{r.geriatrico || "—"}</div>
                      <div className="mt-1">
                        <Badge tone="emerald"><FiShield className="mr-1" /> {r.rol || "—"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
