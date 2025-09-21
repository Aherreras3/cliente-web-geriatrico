import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const SeccionesTest = ({ idTest, volver }) => {
  const [vinculadas, setVinculadas] = useState([]);    // [{id_seccion,nombre,visible}]
  const [todas, setTodas] = useState([]);              // [{id_seccion,nombre}]
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [agregando, setAgregando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [rV, rS] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/secciones`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`,                { credentials: 'include' }),
      ]);

      if (rV.status === 401 || rS.status === 401) { window.location.href = '/login'; return; }

      const v = await rV.json().catch(() => []);
      const s = await rS.json().catch(() => []);

      setVinculadas(Array.isArray(v) ? v : []);
      setTodas(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error(e);
      setErrorMsg('No se pudieron cargar las secciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (idTest) cargarDatos(); }, [idTest]);

  const idsVinculados = useMemo(() => new Set(vinculadas.map(x => x.id_seccion)), [vinculadas]);
  const disponibles = useMemo(
    () => (todas || []).filter(s => !idsVinculados.has(s.id_seccion)),
    [todas, idsVinculados]
  );

  const agregarSeccion = async (id_seccion) => {
    setAgregando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/secciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // fuerza number por si llega string
        body: JSON.stringify({ id_seccion: Number(id_seccion) })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'No se pudo agregar');
      }
      await cargarDatos();
    } catch (e) {
      console.error(e);
      alert('No se pudo agregar la sección');
    } finally {
      setAgregando(false);
    }
  };

  const quitarSeccion = async (id_seccion) => {
    if (!confirm('¿Quitar esta sección del test?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/secciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_seccion: Number(id_seccion), visible: false })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'No se pudo quitar');
      }
      await cargarDatos();
    } catch (e) {
      console.error(e);
      alert('No se pudo quitar la sección');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Secciones del Test</h2>
        <button
          onClick={volver}
          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
        >
          ← Volver
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : errorMsg ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">{errorMsg}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vinculadas */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Secciones actuales</h3>
            {vinculadas.length === 0 ? (
              <p className="text-gray-500">No hay secciones vinculadas.</p>
            ) : (
              <ul className="space-y-2">
                {vinculadas.map(sec => (
                  <li key={sec.id_seccion} className="flex items-center justify-between bg-white rounded shadow px-3 py-2">
                    <span>{sec.nombre}</span>
                    <button
                      onClick={() => quitarSeccion(sec.id_seccion)}
                      className="text-red-600 hover:text-red-700"
                      title="Quitar"
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Disponibles con botón “+” */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Añadir secciones</h3>
            {disponibles.length === 0 ? (
              <p className="text-gray-500">No hay secciones disponibles.</p>
            ) : (
              <ul className="space-y-2">
                {disponibles.map(sec => (
                  <li key={sec.id_seccion} className="flex items-center justify-between bg-white rounded shadow px-3 py-2">
                    <span>{sec.nombre}</span>
                    <button
                      disabled={agregando}
                      onClick={() => agregarSeccion(sec.id_seccion)}
                      className="text-white bg-[#0F766E] hover:bg-[#0d5e57] px-2 py-1 rounded flex items-center gap-1 text-sm"
                      title="Agregar"
                    >
                      <FaPlus /> Agregar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeccionesTest;
