import React, { useState } from "react";

const RegisterForm = () => {
  const [form, setForm] = useState({
    nombre_geriatrico: "",
    ruc: "",
    email_solicitante: "",
    ciudad: "",
    telefono: "",
    direccion: "",
    nombres_solicitante: "",
    apellidos_solicitante: "",
    tipo_identificacion: "CEDULA", // CEDULA | RUC | PASAPORTE
    identificacion: "",
    fecha_nacimiento: "",
    sexo: "", // M/F/O
  });

  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: false }));
    setOkMsg("");
    setErrMsg("");
  };

  // Validación de identificaciones según tipo (alineada con BD)
  const validateIdentificacion = (tipo, identificacion) => {
    const v = String(identificacion || "");
    if (tipo === "CEDULA") {
      if (!/^\d{10}$/.test(v)) return "La cédula debe tener 10 dígitos";
    } else if (tipo === "RUC") {
      if (!/^\d{13}$/.test(v)) return "El RUC debe tener 13 dígitos";
    } else if (tipo === "PASAPORTE") {
      if (v.length < 6 || v.length > 20) return "Pasaporte: 6 a 20 caracteres";
    }
    return "";
  };

  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

  const validate = () => {
    const e = {};

    // Requeridos
    if (!form.nombre_geriatrico.trim()) e.nombre_geriatrico = "Requerido";
    if (!form.email_solicitante.trim()) e.email_solicitante = "Requerido";
    if (!form.ciudad.trim()) e.ciudad = "Requerido";
    if (!form.nombres_solicitante.trim()) e.nombres_solicitante = "Requerido";
    if (!form.apellidos_solicitante.trim()) e.apellidos_solicitante = "Requerido";
    if (!form.sexo) e.sexo = "Selecciona una opción";

    // Formatos
    if (form.email_solicitante && !isEmail(form.email_solicitante)) {
      e.email_solicitante = "Correo inválido";
    }

    // Longitudes / reglas alineadas con BD
    if (form.nombre_geriatrico.length > 120) e.nombre_geriatrico = "Máximo 120 caracteres";
    if (form.ruc && !/^\d{13}$/.test(form.ruc)) e.ruc = "RUC debe tener 13 dígitos";

    // TELÉFONO: exactamente 10 dígitos cuando se ingresa
    if (form.telefono) {
      if (/^\d+$/.test(form.telefono) === false) {
        e.telefono = "El teléfono debe contener solo números";
      } else if (form.telefono.length < 10) {
        e.telefono = "El número de teléfono debe tener 10 dígitos";
      } else if (form.telefono.length > 10) {
        e.telefono = "El número de teléfono debe tener 10 dígitos";
      }
    }

    if (form.ciudad.length > 80) e.ciudad = "Máximo 80 caracteres";
    if (form.direccion && form.direccion.length > 255) e.direccion = "Máximo 255 caracteres";
    if (form.nombres_solicitante.length > 100) e.nombres_solicitante = "Máximo 100 caracteres";
    if (form.apellidos_solicitante.length > 100) e.apellidos_solicitante = "Máximo 100 caracteres";

    // Identificación por tipo
    const identificacionError = validateIdentificacion(form.tipo_identificacion, form.identificacion);
    if (identificacionError) e.identificacion = identificacionError;

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setOkMsg("");
    setErrMsg("");
    if (Object.keys(v).length) return;

    // Payload limpio
    const payload = {
      ...form,
      nombre_geriatrico: form.nombre_geriatrico.trim(),
      email_solicitante: form.email_solicitante.trim(),
      ciudad: form.ciudad.trim(),
      direccion: form.direccion?.trim() || null,
      telefono: form.telefono?.trim() || null,
      ruc: form.ruc?.trim() || null,
      nombres_solicitante: form.nombres_solicitante.trim(),
      apellidos_solicitante: form.apellidos_solicitante.trim(),
      identificacion: form.identificacion.trim(),
      sexo: form.sexo || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
    };

    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/solicitudes-geriatrico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fields) setErrors((prev) => ({ ...prev, ...data.fields }));
        throw new Error(data.error || "No se pudo enviar la solicitud");
      }

      setOkMsg("¡Solicitud enviada! Revisa tu correo. El superadministrador validará la creación y te notificará.");
      setForm({
        nombre_geriatrico: "",
        ruc: "",
        email_solicitante: "",
        ciudad: "",
        telefono: "",
        direccion: "",
        nombres_solicitante: "",
        apellidos_solicitante: "",
        tipo_identificacion: "CEDULA",
        identificacion: "",
        fecha_nacimiento: "",
        sexo: "",
      });
    } catch (err) {
      setErrMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-2 border-2 rounded-lg ${errors[field] ? "border-red-500" : "border-gray-300"}`;

  return (
    <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-center text-verde mb-2">Solicitud de Geriátrico</h2>
      <p className="text-center text-sm mb-6">
        Completa los campos para solicitar la creación de un geriátrico.
      </p>

      {okMsg && <div className="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm">{okMsg}</div>}
      {errMsg && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{errMsg}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Datos del geriátrico */}
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Nombre del geriátrico"
            className={inputClass("nombre_geriatrico")}
            value={form.nombre_geriatrico}
            maxLength={120}
            onChange={(e) => handleChange("nombre_geriatrico", e.target.value)}
            disabled={sending}
          />
          {errors.nombre_geriatrico && <p className="text-red-500 text-sm mt-1">{errors.nombre_geriatrico}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="RUC (opcional)"
            className={inputClass("ruc")}
            value={form.ruc}
            maxLength={13}
            onChange={(e) => handleChange("ruc", e.target.value.replace(/\D/g, ""))}
            disabled={sending}
          />
          {errors.ruc && <p className="text-red-500 text-sm mt-1">{errors.ruc}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="Ciudad"
            className={inputClass("ciudad")}
            value={form.ciudad}
            maxLength={80}
            onChange={(e) => handleChange("ciudad", e.target.value)}
            disabled={sending}
          />
          {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="Teléfono (10 dígitos)"
            className={inputClass("telefono")}
            value={form.telefono}
            maxLength={20} // Permitimos >10 para mostrar el error "más de 10"
            onChange={(e) => handleChange("telefono", e.target.value.replace(/\D/g, ""))}
            disabled={sending}
          />
          {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
        </div>

        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Dirección (opcional)"
            className={inputClass("direccion")}
            value={form.direccion}
            maxLength={255}
            onChange={(e) => handleChange("direccion", e.target.value)}
            disabled={sending}
          />
          {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
        </div>

        {/* Datos del solicitante */}
        <div>
          <input
            type="text"
            placeholder="Nombres del solicitante"
            className={inputClass("nombres_solicitante")}
            value={form.nombres_solicitante}
            maxLength={100}
            onChange={(e) => handleChange("nombres_solicitante", e.target.value)}
            disabled={sending}
          />
          {errors.nombres_solicitante && <p className="text-red-500 text-sm mt-1">{errors.nombres_solicitante}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="Apellidos del solicitante"
            className={inputClass("apellidos_solicitante")}
            value={form.apellidos_solicitante}
            maxLength={100}
            onChange={(e) => handleChange("apellidos_solicitante", e.target.value)}
            disabled={sending}
          />
          {errors.apellidos_solicitante && <p className="text-red-500 text-sm mt-1">{errors.apellidos_solicitante}</p>}
        </div>

        <div className="sm:col-span-2">
          <input
            type="email"
            placeholder="Correo del solicitante"
            className={inputClass("email_solicitante")}
            value={form.email_solicitante}
            onChange={(e) => handleChange("email_solicitante", e.target.value)}
            disabled={sending}
          />
          {errors.email_solicitante && <p className="text-red-500 text-sm mt-1">{errors.email_solicitante}</p>}
        </div>

        <div>
          <select
            className={inputClass("tipo_identificacion")}
            value={form.tipo_identificacion}
            onChange={(e) => handleChange("tipo_identificacion", e.target.value)}
            disabled={sending}
          >
            <option value="CEDULA">Cédula</option>
            <option value="RUC">RUC</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>

        <div>
          <input
            type="text"
            placeholder={
              form.tipo_identificacion === "CEDULA"
                ? "Cédula (10 dígitos)"
                : form.tipo_identificacion === "RUC"
                ? "RUC (13 dígitos)"
                : "Pasaporte (6–20 caracteres)"
            }
            className={inputClass("identificacion")}
            value={form.identificacion}
            maxLength={
              form.tipo_identificacion === "CEDULA"
                ? 10
                : form.tipo_identificacion === "RUC"
                ? 13
                : 20
            }
            onChange={(e) => {
              const v = e.target.value;
              if (form.tipo_identificacion === "PASAPORTE") {
                handleChange("identificacion", v.replace(/\s/g, "")); // alfanumérico sin espacios
              } else {
                handleChange("identificacion", v.replace(/\D/g, "")); // solo números
              }
            }}
            disabled={sending}
          />
          {errors.identificacion && <p className="text-red-500 text-sm mt-1">{errors.identificacion}</p>}
        </div>

        <div>
          <input
            type="date"
            placeholder="Fecha de nacimiento"
            className={inputClass("fecha_nacimiento")}
            value={form.fecha_nacimiento}
            onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
            disabled={sending}
          />
        </div>

        <div className="sm:col-span-2">
          <select
            className={inputClass("sexo")}
            value={form.sexo}
            onChange={(e) => handleChange("sexo", e.target.value)}
            disabled={sending}
          >
            <option value="">Sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
          {errors.sexo && <p className="text-red-500 text-sm mt-1">{errors.sexo}</p>}
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={sending}
            className={`w-full text-white py-2 rounded-lg ${
              sending ? "bg-gray-400" : "bg-verde hover:bg-opacity-90"
            }`}
          >
            {sending ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-600 mt-4">
        Tras enviar, el superadministrador revisará tu solicitud. Si es aprobada, recibirás tu <b>usuario</b> y una
        <b> contraseña temporal</b> por correo.
      </p>
    </div>
  );
};

export default RegisterForm;
