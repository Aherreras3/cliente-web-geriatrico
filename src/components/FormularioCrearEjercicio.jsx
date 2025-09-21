import { useEffect, useMemo, useState } from "react";

const FormularioCrearEjercicio = ({ idSeccionDefault = "", idNivelDefault = "", onSaved, onCancel }) => {
  const [tipo, setTipo] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [idSeccion, setIdSeccion] = useState(String(idSeccionDefault || ""));
  const [idNivel, setIdNivel] = useState(String(idNivelDefault || ""));
  const [mensaje, setMensaje] = useState("");

  const [texto, setTexto] = useState("");
  const [imagenTexto, setImagenTexto] = useState(null);

  const [imagen, setImagen] = useState(null);
  const [respuesta, setRespuesta] = useState("");

  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const resSecciones = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, { credentials: "include" });
        const seccionesData = await resSecciones.json();
        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);

        const resNiveles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/niveles`, { credentials: "include" });
        const nivelesData = await resNiveles.json();
        setNiveles(Array.isArray(nivelesData) ? nivelesData : []);
      } catch (error) {
        console.error("Error cargando secciones o niveles:", error);
      }
    };
    fetchDatos();
  }, []);

  useEffect(() => {
    if (idSeccionDefault) setIdSeccion(String(idSeccionDefault));
    if (idNivelDefault) setIdNivel(String(idNivelDefault));
  }, [idSeccionDefault, idNivelDefault]);

  const convertirABase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const parts = String(reader.result).split(",");
        resolve(parts[1] || "");
      };
      reader.onerror = reject;
    });

  const obtenerIdUsuario = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.usuario && data.usuario.id) return data.usuario.id;
      console.error("Error al obtener el usuario:", data.error || "Respuesta inesperada");
      return null;
    } catch (error) {
      console.error("Error al obtener el usuario:", error.message);
      return null;
    }
  };

  const errores = useMemo(() => {
    const e = {};
    if (!idSeccion) e.idSeccion = "Selecciona una sección";
    if (!idNivel) e.idNivel = "Selecciona un nivel";
    if (!tipo) e.tipo = "Selecciona un tipo de ejercicio";
    if (tipo === "texto") {
      if (!texto.trim()) e.texto = "El texto es obligatorio";
      if (!imagenTexto) e.imagenTexto = "Debes adjuntar una imagen relacionada";
    } else if (tipo === "imagen") {
      if (!imagen) e.imagen = "Debes adjuntar una imagen";
      if (!respuesta.trim()) e.respuesta = "La respuesta es obligatoria";
    }
    return e;
  }, [tipo, idSeccion, idNivel, texto, imagenTexto, imagen, respuesta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    if (Object.keys(errores).length) {
      setMensaje("Revisa los campos obligatorios.");
      return;
    }

    setSending(true);
    try {
      const idUsuario = await obtenerIdUsuario();
      if (!idUsuario) {
        setMensaje("Error al obtener el usuario.");
        setSending(false);
        return;
      }

      let contenido = null;
      let contenido_binario = null;

      if (tipo === "texto") {
        contenido = texto.trim();
        if (imagenTexto) contenido_binario = await convertirABase64(imagenTexto);
      } else {
        contenido = respuesta.trim();
        if (imagen) contenido_binario = await convertirABase64(imagen);
      }

      const payload = {
        id_test: null,
        tipo,
        estado: true,
        contenido,
        contenido_binario,
        id_nivel: parseInt(idNivel, 10),
        id_seccion: parseInt(idSeccion, 10),
        id_usuario: idUsuario,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error API:", data);
        setMensaje(data.error || "Error al guardar el ejercicio.");
      } else {
        setMensaje(data.mensaje || "Ejercicio guardado correctamente");
        onSaved?.(); // avisa al padre (cerrará el modal y/o refrescará lista)
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error al guardar el ejercicio.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block font-semibold mb-1">Tipo de ejercicio</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="texto" checked={tipo === "texto"} onChange={() => setTipo("texto")} disabled={sending}/>
            <span>Texto (con imagen)</span>
          </label>
        </div>
        {errores.tipo && <p className="text-sm text-red-600 mt-1">{errores.tipo}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Sección</label>
          <select className="w-full border p-2 rounded" value={idSeccion} onChange={(e) => setIdSeccion(e.target.value)} disabled={sending}>
            <option value="">-- Selecciona --</option>
            {secciones.map((s) => (
              <option key={s.id_seccion} value={s.id_seccion}>{s.nombre}</option>
            ))}
          </select>
          {errores.idSeccion && <p className="text-sm text-red-600 mt-1">{errores.idSeccion}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Nivel</label>
          <select className="w-full border p-2 rounded" value={idNivel} onChange={(e) => setIdNivel(e.target.value)} disabled={sending}>
            <option value="">-- Selecciona --</option>
            {niveles.map((n) => (
              <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>
            ))}
          </select>
          {errores.idNivel && <p className="text-sm text-red-600 mt-1">{errores.idNivel}</p>}
        </div>
      </div>

      {tipo === "texto" && (
        <>
          <div>
            <label className="block font-semibold mb-1">Texto / Enunciado</label>
            <input type="text" className="w-full border p-2 rounded" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: Nombra el color de la figura" disabled={sending}/>
            {errores.texto && <p className="text-sm text-red-600 mt-1">{errores.texto}</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">Imagen relacionada (obligatoria)</label>
            <input type="file" accept="image/*" onChange={(e) => setImagenTexto(e.target.files?.[0] || null)} className="w-full" disabled={sending}/>
            {errores.imagenTexto && <p className="text-sm text-red-600 mt-1">{errores.imagenTexto}</p>}
          </div>
        </>
      )}

      {tipo === "imagen" && (
        <>
          <div>
            <label className="block font-semibold mb-1">Imagen</label>
            <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files?.[0] || null)} className="w-full" disabled={sending}/>
            {errores.imagen && <p className="text-sm text-red-600 mt-1">{errores.imagen}</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">Respuesta (palabra)</label>
            <input type="text" className="w-full border p-2 rounded" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Ej: amarillo" disabled={sending}/>
            {errores.respuesta && <p className="text-sm text-red-600 mt-1">{errores.respuesta}</p>}
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border hover:bg-gray-50" disabled={sending}>
          Cancelar
        </button>
        <button type="submit" disabled={sending} className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ${sending ? "opacity-70 cursor-not-allowed" : ""}`}>
          {sending ? "Guardando..." : "Guardar ejercicio"}
        </button>
      </div>

      {mensaje && <p className="text-sm text-center mt-3">{mensaje}</p>}
    </form>
  );
};

export default FormularioCrearEjercicio;
