import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FaUserEdit, FaTrash } from "react-icons/fa";
import { useToast } from "@/components/ToastProvider";
import { mapApiError } from "@/lib/api-error";
import InfoDialog from "@/components/InfoDialog"; // ⬅️ añadido

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "cuidador", label: "Cuidador" },
];

const API = process.env.NEXT_PUBLIC_API_URL || "";

const sexoLabel = (s) =>
  s === "M" ? "Masculino" : s === "F" ? "Femenino" : s === "O" ? "Otro" : (s || "");

const validateIdentificacion = (tipo, identificacion) => {
  const id = (identificacion || "").trim();
  const t  = (tipo || "").toUpperCase();
  if (t === "CEDULA") {
    if (!/^\d{10}$/.test(id)) return "La cédula debe tener 10 dígitos";
  } else if (t === "RUC") {
    if (!/^\d{13}$/.test(id)) return "El RUC debe tener 13 dígitos";
  } else if (t === "PASAPORTE") {
    if (!/^[A-Za-z0-9]{6,20}$/.test(id)) return "El pasaporte debe tener 6 a 20 caracteres alfanuméricos";
  } else {
    return "Tipo de identificación inválido (CEDULA, RUC o PASAPORTE).";
  }
  return "";
};

function normalizeUsuarios(raw = []) {
  return raw.map((u, idx) => {
    const isSuper = !!u.is_superadmin || u.tipo_usuario === "SUPER";
    let roles = [];
    if (Array.isArray(u.roles)) roles = u.roles;
    else if (typeof u.roles === "string") {
      try { roles = JSON.parse(u.roles); } catch { roles = []; }
    }
    let displayRol = "—";
    if (isSuper) displayRol = "Superusuario";
    else if (roles.length) {
      const hasAdmin = roles.some((r) => (r?.rol || "").toLowerCase() === "admin");
      const hasCui   = roles.some((r) => (r?.rol || "").toLowerCase() === "cuidador");
      displayRol = hasAdmin ? "Administrador" : hasCui ? "Cuidador" : "—";
    } else if (u.tipo_usuario) {
      displayRol =
        u.tipo_usuario === "ADMIN_GERIATRICO" ? "Administrador" :
        u.tipo_usuario === "CUIDADOR" ? "Cuidador" :
        u.tipo_usuario === "SUPER" ? "Superusuario" : "—";
    }

    return {
      key: u.id_usuario ?? u.usuario ?? idx,
      id_usuario: u.id_usuario,
      nombres: u.nombres ?? u.nombre ?? "",
      apellidos: u.apellidos ?? u.apellido ?? "",
      usuario: u.usuario,
      correo: u.correo,
      tipo_identificacion: (u.tipo_identificacion || "").toUpperCase(),
      identificacion: u.identificacion,
      fecha_nacimiento: u.fecha_nacimiento,
      sexo: u.sexo,
      estado: typeof u.estado === "boolean" ? u.estado : true,
      is_superadmin: isSuper,
      roles,
      displayRol,
    };
  });
}

const UsuariosList = () => {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // ⬇️ estado para InfoDialog (confirmaciones)
  const [confirmDlg, setConfirmDlg] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
    actionLabel: "Aceptar",
    secondaryLabel: "Cancelar",
    loading: false,
    onConfirm: null, // function async
  });

  const [formulario, setFormulario] = useState({
    id_usuario: null,
    nombres: "",
    apellidos: "",
    tipo_identificacion: "",
    identificacion: "",
    fecha_nacimiento: "",
    sexo: "",
    usuario: "",
    correo: "",
    contrasena: "",
    estado: true,
    is_superadmin: false,
    rol: "",
  });

  useEffect(() => {
    if (mostrarModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mostrarModal]);

  useEffect(() => {
    const verificarAuth = async () => {
      try {
        const res = await fetch(`${API}/usuarios/protegido`, { credentials: "include" });
        setAutenticado(res.status === 200);
      } catch {
        setAutenticado(false);
      } finally {
        setVerificando(false);
      }
    };
    verificarAuth();
  }, []);

  const obtenerUsuarios = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/usuarios?incluir_inactivos=0`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUsuarios([]);
        setError(mapApiError(data?.error || `HTTP ${res.status}`));
        return;
      }
      setUsuarios(normalizeUsuarios(Array.isArray(data) ? data : (data?.data ?? [])));
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      setError("No se pudieron cargar los usuarios.");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autenticado) obtenerUsuarios();
  }, [autenticado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setFormulario({
      id_usuario: null,
      nombres: "",
      apellidos: "",
      tipo_identificacion: "",
      identificacion: "",
      fecha_nacimiento: "",
      sexo: "",
      usuario: "",
      correo: "",
      contrasena: "",
      estado: true,
      is_superadmin: false,
      rol: "",
    });
  };

  const openCrear = () => { resetForm(); setMostrarModal(true); };

  const openEditar = (u) => {
    setFormulario({
      id_usuario: u.id_usuario,
      nombres: u.nombres,
      apellidos: u.apellidos,
      tipo_identificacion: u.tipo_identificacion,
      identificacion: u.identificacion,
      fecha_nacimiento: (u.fecha_nacimiento || "").slice(0,10),
      sexo: u.sexo || "",
      usuario: u.usuario,
      correo: u.correo,
      contrasena: "",
      estado: !!u.estado,
      is_superadmin: !!u.is_superadmin,
      rol: (u.displayRol || "").toLowerCase() === "administrador" ? "admin"
         : (u.displayRol || "").toLowerCase() === "cuidador" ? "cuidador" : "",
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // EDITAR
    if (formulario.id_usuario) {
      try {
        const res = await fetch(`${API}/usuarios/${formulario.id_usuario}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombres: formulario.nombres,
            apellidos: formulario.apellidos,
            tipo_identificacion: (formulario.tipo_identificacion || "").toUpperCase(),
            identificacion: (formulario.identificacion || "").trim(),
            fecha_nacimiento: formulario.fecha_nacimiento,
            sexo: formulario.sexo,
            usuario: formulario.usuario,
            correo: formulario.correo,
            estado: formulario.estado,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return toast.error(mapApiError(data?.error || `HTTP ${res.status}`));
        toast.success("Usuario actualizado");
        setMostrarModal(false);
        obtenerUsuarios();
      } catch (err) {
        console.error(err);
        toast.error("No se pudo actualizar el usuario");
      }
      return;
    }

    // CREAR
    const errorIdentificacion = validateIdentificacion(
      formulario.tipo_identificacion, formulario.identificacion
    );
    if (errorIdentificacion) return toast.error(errorIdentificacion);
    if (!formulario.is_superadmin && !formulario.rol) {
      return toast.error("Selecciona un rol (Administrador o Cuidador).");
    }
    if (!["M","F","O"].includes(formulario.sexo)) {
      return toast.error("Selecciona sexo: M, F u O.");
    }

    const payload = {
      nombres: formulario.nombres,
      apellidos: formulario.apellidos,
      tipo_identificacion: (formulario.tipo_identificacion || "").toUpperCase(),
      identificacion: (formulario.identificacion || "").replace(/\D/g, ""),
      fecha_nacimiento: formulario.fecha_nacimiento,
      sexo: formulario.sexo,
      usuario: formulario.usuario,
      correo: formulario.correo,
      contrasena: formulario.contrasena,
      is_superadmin: !!formulario.is_superadmin,
      estado: !!formulario.estado,
      rol: formulario.is_superadmin ? null : formulario.rol,
    };

    try {
      const res = await fetch(`${API}/usuarios/crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      // ⬇️ reactivación con InfoDialog (sin confirm nativo)
      if (res.status === 409 && data?.reactivable && data?.id_usuario) {
        setConfirmDlg({
          open: true,
          title: "Usuario ya existe (inactivo)",
          message: "Este usuario existe pero está desactivado. ¿Deseas reactivarlo?",
          tone: "warning",
          actionLabel: "Reactivar",
          secondaryLabel: "Cancelar",
          loading: false,
          onConfirm: async () => {
            try {
              setConfirmDlg((d) => ({ ...d, loading: true }));
              const rol = payload.rol || "cuidador";
              const r2 = await fetch(`${API}/usuarios/${data.id_usuario}/reactivar`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rol }),
              });
              const d2 = await r2.json().catch(() => ({}));
              if (!r2.ok) {
                setConfirmDlg({ open: false, loading: false });
                return toast.error(mapApiError(d2?.error || `HTTP ${r2.status}`));
              }
              setConfirmDlg({ open: false, loading: false });
              toast.success("Usuario reactivado");
              setMostrarModal(false);
              resetForm();
              obtenerUsuarios();
            } catch (e) {
              console.error(e);
              setConfirmDlg({ open: false, loading: false });
              toast.error("No se pudo reactivar el usuario");
            }
          },
        });
        return;
      }

      if (!res.ok) {
        return toast.error(mapApiError(data?.error || data?.mensaje || `HTTP ${res.status}`));
      }

      toast.success("Usuario creado");
      setMostrarModal(false);
      resetForm();
      obtenerUsuarios();
    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud.");
    }
  };

  // ⬇️ eliminar (desactivar) usando InfoDialog
  const handleEliminar = (u) => {
    if (!u?.id_usuario) return;
    setConfirmDlg({
      open: true,
      title: "Desactivar usuario",
      message: `Se desactivará a “${u.nombres} ${u.apellidos}”. Podrás reactivarlo luego si lo necesitas.`,
      tone: "danger",
      actionLabel: "Sí, desactivar",
      secondaryLabel: "Cancelar",
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmDlg((d) => ({ ...d, loading: true }));
          const res = await fetch(`${API}/usuarios/${u.id_usuario}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setConfirmDlg({ open: false, loading: false });
            return toast.error(mapApiError(data?.error || `HTTP ${res.status}`));
          }
          setConfirmDlg({ open: false, loading: false });
          toast.success("Usuario desactivado");
          obtenerUsuarios();
        } catch (e) {
          console.error(e);
          setConfirmDlg({ open: false, loading: false });
          toast.error("No se pudo desactivar el usuario");
        }
      },
    });
  };

  return (
    <DashboardLayout>
      {verificando ? (
        <div className="p-6 text-center">Verificando acceso...</div>
      ) : !autenticado ? (
        <div className="p-6 text-center">No autenticado. Inicia sesión.</div>
      ) : (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Lista de Usuarios</h1>
            <button onClick={openCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              + Crear Usuario
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded border border-amber-300 bg-amber-50 text-amber-900 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-gray-500">Cargando…</div>
          ) : (
            <div className="overflow-x-auto shadow rounded-lg bg-white">
              <table className="table-auto w-full">
                <thead className="bg-gray-100 text-gray-700 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Correo</th>
                    <th className="px-4 py-3 text-left">Identificación</th>
                    <th className="px-4 py-3 text-left">Nacimiento</th>
                    <th className="px-4 py-3 text-left">Género</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                  {usuarios.map((u, i) => (
                    <tr key={u.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[220px]">
                          {u.nombres} {u.apellidos}
                        </div>
                      </td>
                      <td className="px-4 py-3"><div className="truncate max-w-[280px]">{u.correo}</div></td>
                      <td className="px-4 py-3"><div className="truncate max-w-[220px]">{u.identificacion}</div></td>
                      <td className="px-4 py-3 whitespace-nowrap">{(u.fecha_nacimiento || "").slice(0, 10) || "—"}</td>
                      <td className="px-4 py-3">{sexoLabel(u.sexo)}</td>
                      <td className="px-4 py-3"><span className="truncate max-w-[160px] inline-block">{u.displayRol}</span></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          u.estado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {u.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 justify-center">
                          <button className="text-blue-600 hover:text-blue-800" title="Editar" onClick={() => openEditar(u)}>
                            <FaUserEdit />
                          </button>
                          <button className="text-red-500 hover:text-red-700" title="Eliminar" onClick={() => handleEliminar(u)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!usuarios.length && !error && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={9}>
                        No hay usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {mostrarModal && (
            <div className="fixed inset-0 z-[100]">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setMostrarModal(false)} />
              <div className="relative h-full w-full flex items-center justify-center p-4 sm:p-6">
                <div
                  className="bg-white w-full rounded-none sm:rounded-2xl shadow-xl h-[100dvh] sm:h-auto sm:max-h-[85vh]
                             max-w-none sm:max-w-lg md:max-w-2xl flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold">
                      {formulario.id_usuario ? "Editar Usuario" : "Nuevo Usuario"}
                    </h2>
                    <button onClick={() => setMostrarModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>

                  <div className="px-4 sm:px-6 py-4 overflow-y-auto">
                    <form id="usuarioForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" name="nombres" placeholder="Nombres" value={formulario.nombres} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                      <input type="text" name="apellidos" placeholder="Apellidos" value={formulario.apellidos} onChange={handleChange} className="w-full border rounded px-3 py-2" required />

                      <select name="tipo_identificacion" value={formulario.tipo_identificacion} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                        <option value="">Tipo de identificación</option>
                        <option value="CEDULA">Cédula</option>
                        <option value="RUC">RUC</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                      <input type="text" name="identificacion" placeholder="Identificación" value={formulario.identificacion} onChange={handleChange} className="w-full border rounded px-3 py-2" required />

                      <input type="date" name="fecha_nacimiento" value={formulario.fecha_nacimiento} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
                      <select name="sexo" value={formulario.sexo} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                        <option value="">Sexo</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>

                      <input type="text" name="usuario" placeholder="Usuario" value={formulario.usuario} onChange={handleChange} className="w-full border rounded px-3 py-2 md:col-span-1" required />
                      <input type="email" name="correo" placeholder="Correo" value={formulario.correo} onChange={handleChange} className="w-full border rounded px-3 py-2 md:col-span-1" required />

                      {!formulario.id_usuario && (
                        <input type="password" name="contrasena" placeholder="Contraseña" value={formulario.contrasena} onChange={handleChange} className="w-full border rounded px-3 py-2 md:col-span-2" required />
                      )}

                      {!formulario.is_superadmin && (
                        <select name="rol" value={formulario.rol} onChange={handleChange} className="w-full border rounded px-3 py-2 md:col-span-1" required={!formulario.id_usuario}>
                          <option value="">Rol</option>
                          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}

                      <label className="flex items-center gap-2 md:col-span-2">
                        <input type="checkbox" name="estado" checked={formulario.estado} onChange={handleChange} />
                        Activo
                      </label>
                    </form>
                  </div>

                  <div className="sticky bottom-0 z-10 bg-white border-t px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
                      Cancelar
                    </button>
                    <button form="usuarioForm" type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ⬇️ InfoDialog reutilizable para confirmaciones */}
          <InfoDialog
            open={confirmDlg.open}
            onClose={() => { if (!confirmDlg.loading) setConfirmDlg((d) => ({ ...d, open: false })); }}
            title={confirmDlg.title}
            message={confirmDlg.message}
            tone={confirmDlg.tone}
            actionLabel={confirmDlg.actionLabel}
            secondaryLabel={confirmDlg.secondaryLabel}
            onSecondary={() => { if (!confirmDlg.loading) setConfirmDlg((d) => ({ ...d, open: false })); }}
            onAction={confirmDlg.onConfirm}
            loading={confirmDlg.loading}
            preventBackdropClose={confirmDlg.loading}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default UsuariosList;
