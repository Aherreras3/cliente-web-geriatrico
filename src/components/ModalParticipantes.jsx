import { useEffect, useState } from 'react';

const ModalParticipantes = ({ idTest, cerrar }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const obtenerUsuarios = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/adultos`, {
        credentials: 'include',
      });

      const data = await res.json();
      console.log('Usuarios cargados:', data);

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data.usuarios)
        ? data.usuarios
        : [];

      setUsuarios(lista);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const agregarParticipante = async (id_adulto) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/participantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_adulto }), // ← 👈 clave corregida
      });

      if (res.ok) {
        console.log('Participante agregado correctamente');
      } else {
        console.error('Error al agregar participante:', await res.text());
      }
    } catch (error) {
      console.error('Error al agregar participante:', error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const filtrados = usuarios.filter((u) =>
    u.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.apellidos?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl max-h-[80%] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Agregar Participantes</h3>

        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Nombre completo</th>
              <th className="p-2">Agregar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u, i) => (
              <tr key={u.id_adulto} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2 capitalize">{u.nombres} {u.apellidos}</td>
                <td className="p-2">
                  <button
                    onClick={() => agregarParticipante(u.id_adulto)}
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    +
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-4">
          <button
            onClick={cerrar}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalParticipantes;
