import React, { useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEye, faEyeSlash, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/components/ToastProvider";
import { mapApiError } from "@/lib/api-error";

const LoginForm = () => {
  const toast = useToast();
  const [id, setId] = useState("");      // usuario o correo
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({ id: false, pass: false, msg: "" });
  const router = useRouter();

  const onCapsCheck = (e) => {
    if (e?.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr({ id: false, pass: false, msg: "" });

    const hasId = Boolean(id.trim());
    const hasPass = Boolean(pass);
    if (!hasId || !hasPass) {
      const msg = "Completa los campos requeridos";
      setErr({ id: !hasId, pass: !hasPass, msg });
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario: id, password: pass }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const friendly = mapApiError(data?.error || data?.mensaje || "Credenciales incorrectas");
        setErr((p) => ({ ...p, msg: friendly }));
        toast.error(friendly);
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(data.user || {}));
      router.push("/dashboard");
    } catch {
      const msg = "Error al conectar con el servidor";
      setErr((p) => ({ ...p, msg }));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full sm:max-w-lg md:max-w-xl bg-white/95 rounded-2xl shadow-xl ring-1 ring-black/5 p-6 sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-verde">Iniciar Sesión</h2>
        <p className="text-sm text-gray-600 mt-2">Ingresa tus datos para acceder. ¡Nos alegra verte de nuevo!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Usuario / Correo */}
        <div>
          <label className="font-medium text-gray-800">Usuario o correo</label>
          <div className={`mt-1 relative flex items-center rounded-xl border-2 bg-white 
              ${err.id ? "border-red-500" : "border-gray-300"} 
              focus-within:border-verde focus-within:ring-2 focus-within:ring-verde/20`}>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyUp={onCapsCheck}
              autoComplete="username email"
              placeholder="Ingresa tu usuario o correo"
              className="w-full rounded-xl px-4 py-2.5 pr-12 outline-none"
            />
            <FontAwesomeIcon icon={faUser} className="absolute right-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <label className="font-medium text-gray-800">Contraseña</label>
          <div className={`mt-1 relative flex items-center rounded-xl border-2 bg-white 
              ${err.pass ? "border-red-500" : "border-gray-300"} 
              focus-within:border-verde focus-within:ring-2 focus-within:ring-verde/20`}>
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyUp={onCapsCheck}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl px-4 py-2.5 pr-12 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-2 p-2 text-gray-500 hover:text-gray-700"
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
            >
              <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {capsOn && (
              <span className="ml-auto text-[11px] mt-1 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                Caps Lock activo
              </span>
            )}
          </div>
        </div>

        {/* Error en formulario */}
        {err.msg && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 animate-fade-in">
            {err.msg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full inline-flex items-center justify-center gap-2 
            bg-verde text-white py-2.5 rounded-xl shadow hover:bg-opacity-90 
            focus:outline-none focus:ring-2 focus:ring-verde/30
            ${loading ? "opacity-80 cursor-not-allowed" : ""}`}
        >
          {loading && <FontAwesomeIcon icon={faCircleNotch} spin className="h-4 w-4" />}
          Aceptar
        </button>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="rounded border-gray-300" />
            Recordarme
          </label>
          <a className="hover:underline cursor-pointer">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
