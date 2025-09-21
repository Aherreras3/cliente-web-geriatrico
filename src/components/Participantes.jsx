// src/components/Participantes.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ModalParticipantes from './ModalParticipantes';
import ModalProgreso from './ModalProgreso';

const Participantes = ({ idTest, volver }) => {
  const router = useRouter();

  const [participantes, setParticipantes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarProgreso, setMostrarProgreso] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const obtenerParticipantes = async () => {
    if (!idTest) return;
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/participantes`,
        { credentials: 'include' }
      );

      if (res.status === 401) { router.push('/login'); return; }

      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;

      if (!res.ok) {
        setErrorMsg(data?.error || `No se pudieron cargar (HTTP ${res.status})`);
        setParticipantes([]);
        return;
      }

      setParticipantes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener participantes:', err);
      setErrorMsg('Error de red al cargar participantes');
      setParticipantes([]);
    } finally {
      setCargando(false);
    }
  };

  const eliminarParticipante = async (idAdulto) => {
    if (!confirm('¿Deseas eliminar este participante del test?')) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/participantes/${idAdulto}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) {
        const txt = await res.text();
        let data; try { data = JSON.parse(txt); } catch { data = { error: txt }; }
        alert(data?.error || 'No se pudo eliminar al participante.');
        return;
      }
      obtenerParticipantes();
    } catch (e) {
      console.error('Error al eliminar participante:', e);
      alert('Error de red');
    }
  };

  const toggleCompletado = async (idAdulto, estadoActual) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/participantes/${idAdulto}/completar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ completado: !estadoActual }),
        }
      );
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) {
        const txt = await res.text();
        let data; try { data = JSON.parse(txt); } catch { data = { error: txt }; }
        alert(data?.error || 'No se pudo actualizar el estado.');
        return;
      }
      obtenerParticipantes();
    } catch (e) {
      console.error('toggleCompletado error:', e);
      alert('Error de red');
    }
  };

  useEffect(() => { obtenerParticipantes(); }, [idTest]);

  // refrescar cuando cierren modales
  useEffect(() => {
    if (!mostrarModal && !mostrarProgreso) obtenerParticipantes();
  }, [mostrarModal, mostrarProgreso]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Lista de Participantes</h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Agregar Participante
        </button>
        <button
          onClick={volver}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
        >
          ← Volver
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : errorMsg ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
          {errorMsg}
        </div>
      ) : (
        <table className="w-full border text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Nombre completo</th>
              <th className="p-2">Fecha de asignación</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {participantes.map((p, i) => (
              <tr key={p.id_adulto} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2 capitalize">{p.nombres} {p.apellidos}</td>
                <td className="p-2">
                  {p.fecha_asignacion ? new Date(p.fecha_asignacion).toLocaleString('es-EC') : '—'}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white ${p.completado ? 'bg-green-600' : 'bg-yellow-500'}`}>
                    {p.completado ? 'Completado' : 'En curso'}
                  </span>
                </td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => toggleCompletado(p.id_adulto, p.completado)}
                    className="bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    title={p.completado ? 'Marcar en curso' : 'Marcar completado'}
                  >
                    {p.completado ? '↺' : '✓'}
                  </button>

                  <button
                    onClick={() => eliminarParticipante(p.id_adulto)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    title="Eliminar"
                  >
                    🗑️
                  </button>

                  <button
                    onClick={() => { setIdSeleccionado(p.id_adulto); setMostrarProgreso(true); }}
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    title="Ver progreso"
                  >
                    🔍
                  </button>
                </td>
              </tr>
            ))}
            {participantes.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={5}>Sin participantes.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {mostrarModal && (
        <ModalParticipantes
          idTest={idTest}
          cerrar={() => setMostrarModal(false)}
        />
      )}

      {mostrarProgreso && idSeleccionado && (
        <ModalProgreso
          idTest={idTest}
          idAdulto={idSeleccionado}
          cerrar={() => { setMostrarProgreso(false); setIdSeleccionado(null); }}
        />
      )}
    </div>
  );
};

export default Participantes;
