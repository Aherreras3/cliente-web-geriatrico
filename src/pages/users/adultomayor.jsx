import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FaUserEdit, FaTrash } from "react-icons/fa";
import { useToast } from "@/components/ToastProvider";
import { mapApiError } from "@/lib/api-error";
import InfoDialog from "@/components/InfoDialog"; // ⬅️ usamos tu InfoDialog

const initialForm = {
  nombres: "",
  apellidos: "",
  tipo_identificacion: "",
  identificacion: "",
  fecha_nacimiento: "",
  sexo: "",
  observaciones: "",
};

const AdultosList = () => {
  const toast = useToast();

  const [adultos, setAdultos] = useState([]);
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Modal / formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formulario, setFormulario] = useState(initialForm);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editId, setEditId] = useState(null);

  // ⬇️ Estado para el InfoDialog de confirmación
  const [confirmDlg, setConfirmDlg] = useState({
    open: false,
    title: "",
    message: "",
    tone: "danger",
    actionLabel: "Sí, eliminar",
    secondaryLabel: "Cancelar",
    loading: false,
    onConfirm: null,
  });

  // ===================== Auth check =====================
  useEffect(() => {
    const verificarAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, {
          credentials: "include",
        });
        setAutenticado(res.status === 200);
      } catch {
        setAutenticado(false);
      } finally {
        setVerificando(false);
      }
    };
    verificarAuth();
  }, []);

  // ===================== Data =====================
  const obtenerAdultos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/adultos`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(mapApiError(data?.error || `HTTP ${res.status}`));
        setAdultos([]);
        return;
      }
      setAdultos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener adultos mayores:", err);
      toast.error("No se pudieron cargar los adultos mayores.");
      setAdultos([]);
    }
  };

  useEffect(() => {
    if (autenticado) obtenerAdultos();
  }, [autenticado]);

  // ===================== Handlers form =====================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setFormulario(initialForm);
    setModoEdicion(false);
    setEditId(null);
  };

  const abrirCrear = () => {
    resetForm();
    setModoEdicion(false);
    setMostrarModal(true);
  };

  const abrirEditar = async (id) => {
    try {
      // Traemos el detalle del backend (así aseguramos valores frescos)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/adultos/${id}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(mapApiError(data?.error || `HTTP ${res.status}`));
        return;
      }

      // Normalizamos fecha a YYYY-MM-DD para el <input type="date">
      const fecha = data?.fecha_nacimiento ? String(data.fecha_nacimiento).slice(0, 10) : "";

      setFormulario({
        nombres: data?.nombres || "",
        apellidos: data?.apellidos || "",
        tipo_identificacion: (data?.tipo_identificacion || "").toUpperCase(),
        identificacion: data?.identificacion || "",
        fecha_nacimiento: fecha,
        sexo: data?.sexo || "",
        observaciones: data?.observaciones || "",
      });
      setModoEdicion(true);
      setEditId(id);
      setMostrarModal(true);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar el detalle para editar.");
    }
  };

  // ===================== Crear / Actualizar =====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = modoEdicion
      ? `${process.env.NEXT_PUBLIC_API_URL}/adultos/${editId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/adultos`;
    const method = modoEdicion ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formulario),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(mapApiError(data?.error || "Solicitud inválida"));
        return;
      }

      toast.success(modoEdicion ? "Adulto mayor actualizado" : "Adulto mayor creado");
      setMostrarModal(false);
      resetForm();
      obtenerAdultos();
    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    }
  };

  // ===================== Eliminar (con InfoDialog) =====================
  const handleEliminar = (adulto) => {
    if (!adulto?.id_adulto) return;

    setConfirmDlg({
      open: true,
      title: "Eliminar adulto mayor",
      message: (
        <>
          ¿Eliminar a <b>{adulto.nombres} {adulto.apellidos}</b>?<br />
          Esta acción no se puede deshacer.
        </>
      ),
      tone: "danger",
      actionLabel: "Sí, eliminar",
      secondaryLabel: "Cancelar",
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmDlg((d) => ({ ...d, loading: true }));
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/adultos/${adulto.id_adulto}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setConfirmDlg({ ...confirmDlg, open: false, loading: false });
            return toast.error(mapApiError(data?.error || `HTTP ${res.status}`));
          }
          setConfirmDlg({ ...confirmDlg, open: false, loading: false });
          toast.success("Adulto mayor eliminado");
          obtenerAdultos();
        } catch (err) {
          console.error(err);
          setConfirmDlg({ ...confirmDlg, open: false, loading: false });
          toast.error("Error al eliminar");
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Adultos Mayores</h1>
            <button
              onClick={abrirCrear}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
            >
              + Agregar Adulto Mayor
            </button>
          </div>

          <div className="overflow-x-auto shadow rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-100 text-gray-700 text-sm">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Identificación</th>
                  <th className="px-6 py-3 text-left">Nacimiento</th>
                  <th className="px-6 py-3 text-left">Sexo</th>
                  <th className="px-6 py-3 text-left">Observaciones</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {adultos.map((a, i) => (
                  <tr key={a.id_adulto} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{i + 1}</td>
                    <td className="px-6 py-3 font-medium">
                      {a.nombres} {a.apellidos}
                    </td>
                    <td className="px-6 py-3">{a.identificacion}</td>
                    <td className="px-6 py-3">{(a.fecha_nacimiento || "").slice(0, 10)}</td>
                    <td className="px-6 py-3 capitalize">{a.sexo}</td>
                    <td className="px-6 py-3">{a.observaciones || "—"}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-3 justify-center">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                          onClick={() => abrirEditar(a.id_adulto)}
                        >
                          <FaUserEdit />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar"
                          onClick={() => handleEliminar(a)} // ⬅️ pasamos el objeto para mostrar nombre
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {adultos.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-center text-gray-500" colSpan={7}>
                      No hay registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {mostrarModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md animate-fade-in">
                <h2 className="text-xl font-bold mb-4">
                  {modoEdicion ? "Editar Adulto Mayor" : "Nuevo Adulto Mayor"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    name="nombres"
                    placeholder="Nombres"
                    value={formulario.nombres}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    name="apellidos"
                    placeholder="Apellidos"
                    value={formulario.apellidos}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />

                  <select
                    name="tipo_identificacion"
                    value={formulario.tipo_identificacion}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Selecciona tipo de identificación</option>
                    <option value="RUC">RUC</option>
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>

                  <input
                    type="text"
                    name="identificacion"
                    placeholder="Identificación"
                    value={formulario.identificacion}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />

                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formulario.fecha_nacimiento}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />

                  <select
                    name="sexo"
                    value={formulario.sexo}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Selecciona sexo</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>

                  <input
                    type="text"
                    name="observaciones"
                    placeholder="Observaciones"
                    value={formulario.observaciones}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      {modoEdicion ? "Guardar cambios" : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* InfoDialog para confirmar eliminación */}
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

export default AdultosList;
