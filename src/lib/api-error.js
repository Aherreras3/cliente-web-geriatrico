// src/lib/api-error.js

// Mapea mensajes técnicos a textos amigables
export function mapApiError(msg = "") {
  const m = String(msg || "").toLowerCase();

  // UNIQUEs comunes
  if (m.includes("ux_usuario_usuario")) return "El nombre de usuario ya existe";
  if (m.includes("ux_usuario_correo")) return "El correo ya está registrado";
  if (m.includes("ux_persona_tipo_identificacion"))
    return "Ya existe una persona con ese tipo e identificación";

  // contexto
  if (m.includes("no hay geriátrico activo")) return "No hay geriátrico activo en la sesión";
  if (m.includes("selecciona un geriátrico"))
    return "Selecciona un geriátrico en el botón del header";

  // roles
  if (m.includes("rol inválido")) return "Rol inválido (usa Administrador o Cuidador)";
  if (m.includes("falta rol")) return "Debes seleccionar un rol";

  // login
  if (m.includes("credenciales") || m.includes("usuario o contraseña incorrectos"))
    return "Usuario o contraseña incorrectos";

  return msg || "Ocurrió un error";
}

/** Leer respuesta de API con soporte de fields
 * => { ok, data, message?, fields?, status? }
 */
export async function readApi(res) {
  let data = null;
  try { data = await res.json(); } catch { /* vacío */ }

  if (!res.ok) {
    const raw = data?.error || data?.mensaje || data?.message || `Error HTTP ${res.status}`;
    return { ok: false, data, message: raw, fields: data?.fields || null, status: res.status };
  }
  return { ok: true, data };
}

// Compat (si lo usas en otras pantallas)
export async function handleApiResponse(res, { toast, successMessage } = {}) {
  const { ok, data, message } = await readApi(res);
  if (!ok) {
    const friendly = mapApiError(message);
    if (toast) toast.error(friendly);
    throw new Error(friendly);
  }
  if (successMessage && toast) toast.success(successMessage);
  return data;
}
