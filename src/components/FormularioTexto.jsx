import { useEffect, useState } from 'react';

const FormularioTexto = () => {
  const [pregunta, setPregunta] = useState('');
  const [respuestaCorrecta, setRespuestaCorrecta] = useState('');
  const [secciones, setSecciones] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [idSeccion, setIdSeccion] = useState('');
  const [idNivel, setIdNivel] = useState('');
  const [mensaje, setMensaje] = useState('');

  // ✅ Función para obtener el ID del usuario autenticado
  const obtenerIdUsuario = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, {
        credentials: 'include',
      });

    const data = await res.json();

    if (res.ok && data.usuario && data.usuario.id) {
      return data.usuario.id; // <-- Devuelve el ID
    } else {
      console.error('Error al obtener el usuario:', data.error || 'Respuesta inesperada');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el usuario:', error.message);
    return null;
  }
};

  // Cargar secciones y niveles
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const resSecciones = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, {
          credentials: 'include',
        });
        const seccionesData = await resSecciones.json();
        setSecciones(seccionesData);

        const resNiveles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/niveles`, {
          credentials: 'include',
        });
        const nivelesData = await resNiveles.json();
        setNiveles(nivelesData);
      } catch (error) {
        console.error('Error cargando secciones o niveles:', error);
      }
    };

    fetchDatos();
  }, []);

  // Guardar ejercicio
// Guardar ejercicio
const handleSubmit = async (e) => {
  e.preventDefault();

  const idUsuario = await obtenerIdUsuario();
  if (!idUsuario) {
    setMensaje('Error al obtener el usuario.');
    return;
  }

  try {
    const ejercicio = {
      id_test: null,
      tipo: 'texto',
      estado: true,
      contenido: pregunta,
      contenido_binario: null,
      id_nivel: parseInt(idNivel),
      id_seccion: parseInt(idSeccion),
      id_usuario: idUsuario,
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(ejercicio),
    });

    if (res.ok) {
      setMensaje('Ejercicio guardado correctamente');
      setPregunta('');
      setRespuestaCorrecta('');
      setIdSeccion('');
      setIdNivel('');
    } else {
      const error = await res.json();
      console.error(error);
      setMensaje('Error al guardar el ejercicio.');
    }
  } catch (err) {
    console.error(err);
    setMensaje('Error en la solicitud.');
  }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Escribe la pregunta"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <input
        type="text"
        placeholder="Respuesta correcta"
        value={respuestaCorrecta}
        onChange={(e) => setRespuestaCorrecta(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <select
        value={idSeccion}
        onChange={(e) => setIdSeccion(e.target.value)}
        className="border p-2 rounded w-full"
        required
      >
        <option value="">Selecciona una sección</option>
        {secciones.map((sec) => (
          <option key={sec.id_seccion} value={sec.id_seccion}>
            {sec.nombre}
          </option>
        ))}
      </select>

      <select
        value={idNivel}
        onChange={(e) => setIdNivel(e.target.value)}
        className="border p-2 rounded w-full"
        required
      >
        <option value="">Selecciona un nivel</option>
        {niveles.map((niv) => (
          <option key={niv.id_nivel} value={niv.id_nivel}>
            {niv.nombre}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        Guardar ejercicio
      </button>

      {mensaje && <p className="text-center text-sm mt-2">{mensaje}</p>}
    </form>
  );
};

export default FormularioTexto;
