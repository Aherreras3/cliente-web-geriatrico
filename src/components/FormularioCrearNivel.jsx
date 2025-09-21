import { useState } from 'react';

const FormularioCrearNivel = ({ idSeccion, onNivelCreado }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/niveles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          id_seccion: parseInt(idSeccion)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear el nivel');
      } else {
        onNivelCreado();  // actualiza la lista en el padre
        setNombre('');
        setDescripcion('');
      }
    } catch (err) {
      setError('Error en la conexión con el servidor');
    }

    setCargando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-md mb-4">
      <h3 className="text-lg font-bold mb-3">Nuevo Nivel</h3>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Nombre del nivel</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={cargando}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
      >
        {cargando ? 'Creando...' : 'Crear Nivel'}
      </button>
    </form>
  );
};

export default FormularioCrearNivel;
