import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "";

async function changePassword({ currentPassword, newPassword }) {
  const res = await fetch(`${API}/usuarios/cambiar-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "No se pudo cambiar la contraseña");
  return data?.message || "Contraseña actualizada";
}

export default function Seguridad() {
  const [cur, setCur] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [show, setShow] = useState({ cur: false, n1: false, n2: false });
  const [sub, setSub] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (n1.length < 8) return setErr("La nueva contraseña debe tener al menos 8 caracteres.");
    if (n1 !== n2)    return setErr("La confirmación no coincide.");
    try {
      setSub(true);
      const ok = await changePassword({ currentPassword: cur, newPassword: n1 });
      setMsg(ok);
      setCur(""); setN1(""); setN2("");
    } catch (e) {
      setErr(e.message || "Error al cambiar la contraseña");
    } finally {
      setSub(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-xl">
        <h1 className="text-2xl font-bold mb-4">Seguridad</h1>

        <form onSubmit={onSubmit} className="rounded-md border p-4 space-y-4 bg-white">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaLock /> Cambiar contraseña
          </div>

          <div>
            <label className="block text-sm font-medium">Contraseña actual</label>
            <div className="relative mt-1">
              <input
                type={show.cur ? "text" : "password"}
                className="w-full rounded-md border px-3 py-2"
                value={cur}
                onChange={(e) => setCur(e.target.value)}
                required
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShow(s => ({ ...s, cur: !s.cur }))}>
                {show.cur ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Nueva contraseña</label>
            <div className="relative mt-1">
              <input
                type={show.n1 ? "text" : "password"}
                className="w-full rounded-md border px-3 py-2"
                value={n1}
                onChange={(e) => setN1(e.target.value)}
                required
                minLength={8}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShow(s => ({ ...s, n1: !s.n1 }))}>
                {show.n1 ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Confirmar nueva contraseña</label>
            <div className="relative mt-1">
              <input
                type={show.n2 ? "text" : "password"}
                className="w-full rounded-md border px-3 py-2"
                value={n2}
                onChange={(e) => setN2(e.target.value)}
                required
                minLength={8}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShow(s => ({ ...s, n2: !s.n2 }))}>
                {show.n2 ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="submit" className="px-3 py-2 rounded-md bg-orange-500 text-white disabled:opacity-60" disabled={sub}>
              {sub ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
