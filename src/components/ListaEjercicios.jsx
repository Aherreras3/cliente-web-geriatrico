import { useEffect, useState } from 'react';
import AgregarImagenEjercicioModal from './AgregarImagenEjercicioModal';
import EditarEjercicioModal from './EditarEjercicioModal';

const ListaEjercicios = ({ idSeccion, idNivel }) => {
  const [ejercicios, setEjercicios] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Imagen
  const [openImg, setOpenImg] = useState(false);
  const [imgId, setImgId] = useState(null);

  // Editar
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchEjercicios = async () => {
    if (!idSeccion || !idNivel) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ejercicio/seccion/${idSeccion}/nivel/${idNivel}/resumen`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => []);
      setEjercicios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener ejercicios:', error);
      setEjercicios([]);
    }
  };

  useEffect(() => { fetchEjercicios(); }, [idSeccion, idNivel, reloadKey]);

  const onSaved = () => setReloadKey(k => k + 1);

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicio/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) {
        alert(data?.error || `HTTP ${res.status}`);
      } else {
        onSaved();
      }
    } catch (e) {
      console.error(e);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Lista de ejercicios</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">Enunciado</th>
              <th className="px-4 py-3 text-left font-semibold">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold">Imagen</th>
              <th className="px-4 py-3 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 divide-y divide-gray-200">
            {ejercicios.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No hay ejercicios registrados
                </td>
              </tr>
            ) : (
              ejercicios.map((e, idx) => {
                const fecha = e.fecha_creacion
                  ? new Date(e.fecha_creacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '—';
                return (
                  <tr key={e.id_ejercicio} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-sm">{e.contenido || '—'}</td>
                    <td className="px-4 py-3 text-sm">{fecha}</td>
                    <td className="px-4 py-3 text-sm">
                      {e.tiene_imagen ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Sí</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        {e.tiene_imagen ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/ejercicio/${e.id_ejercicio}/imagen/html`}
                            target="_blank" rel="noopener"
                            className="px-2 py-1 text-blue-700 hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          <button
                            onClick={() => { setImgId(e.id_ejercicio); setOpenImg(true); }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                          >
                            Añadir imagen
                          </button>
                        )}

                        <button
                          onClick={() => { setEditId(e.id_ejercicio); setOpenEdit(true); }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleEliminar(e.id_ejercicio)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AgregarImagenEjercicioModal
        open={openImg}
        onClose={() => setOpenImg(false)}
        idEjercicio={imgId}
        onSaved={onSaved}
      />

      <EditarEjercicioModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        idEjercicio={editId}
        onSaved={onSaved}
      />
    </div>
  );
};

export default ListaEjercicios;
