import { useState } from 'react';

const FormularioImagen = () => {
  const [seccion, setSeccion] = useState('');
  const [nivel, setNivel] = useState('');
  const [imagen, setImagen] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [mensaje, setMensaje] = useState('');

  const convertirABase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Solo base64
      reader.onerror = reject;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!seccion || !nivel || !imagen || !respuesta) {
      setMensaje('Todos los campos son obligatorios');
      return;
    }

    try {
      const base64 = await convertirABase64(imagen);

      const ejercicio = {
        id_test: null,
        tipo: "imagen",
        estado: true,
        contenido: respuesta,
        contenido_binario: base64,
        id_nivel: parseInt(nivel),
        id_seccion: parseInt(seccion),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ejercicio),
      });

      const data = await res.json();
      setMensaje(data.mensaje || 'Ejercicio guardado correctamente');

      // limpiar
      setSeccion('');
      setNivel('');
      setImagen(null);
      setRespuesta('');
    } catch (error) {
      console.error(error);
      setMensaje('Error al guardar el ejercicio');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold">Sección</label>
        <select
          className="w-full border p-2 rounded"
          value={seccion}
          onChange={(e) => setSeccion(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          <option value="1">Colores</option>
          <option value="2">Animales</option>
          <option value="3">Comida</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold">Nivel</label>
        <select
          className="w-full border p-2 rounded"
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          <option value="1">Fácil</option>
          <option value="2">Medio</option>
          <option value="3">Difícil</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold">Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImagen(e.target.files[0])}
          className="w-full"
        />
      </div>

      <div>
        <label className="block font-semibold">Respuesta (palabra)</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
      >
        Guardar Ejercicio
      </button>

      {mensaje && <p className="text-sm text-center">{mensaje}</p>}
    </form>
  );
};

export default FormularioImagen;
