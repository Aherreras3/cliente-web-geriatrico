import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ModalConfirmacion from './ModalConfirmacion';

const ListaNiveles = ({ idSeccion: idSeccionProp }) => {
  const router = useRouter();
  // Si no te lo pasan por props, lo tomamos de la URL /dashboard/secciones/[seccionId]
  const seccionFromRoute = router.query.seccionId || router.query.seccion || null;
  const idSeccion = Number(idSeccionProp ?? seccionFromRoute);

  const [niveles, setNiveles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal eliminar
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [nivelAEliminar, setNivelAEliminar] = useState(null);

  // ---------- Cargar niveles (ya regresan con ejercicios_count desde el SP) ----------
  const obtenerNiveles = async () => {
    if (!Number.isFinite(idSeccion) || idSeccion <= 0) return;
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/niveles/seccion/${idSeccion}`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || `No se pudieron cargar los niveles (HTTP ${res.status})`);
        setNiveles([]);
        return;
      }

      // data esperado: [{ id_nivel, nombre, ejercicios_count }, ...]
      setNiveles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener niveles:', err);
      setErrorMsg('Error de red al cargar niveles');
      setNiveles([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    obtenerNiveles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, idSeccion]);

  // ---------- Crear nivel ----------
  const crearNivel = async () => {
    if (!Number.isFinite(idSeccion) || idSeccion <= 0) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/niveles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_seccion: idSeccion }),
      });

      if (!res.ok) {
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch { data = { error: text }; }
        alert(data?.error || 'No se pudo crear el nivel');
        return;
      }

      await obtenerNiveles();
    } catch (e) {
      console.error(e);
      alert('Error de red al crear el nivel');
    }
  };

  // ---------- Eliminar nivel ----------
  const confirmarEliminacion = (idNivel) => {
    setNivelAEliminar(idNivel);
    setMostrarModalEliminar(true);
  };

  const eliminarNivel = async () => {
    if (!nivelAEliminar) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/niveles/${nivelAEliminar}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ idSeccion: idSeccion }), // el controlador acepta body/query
        }
      );

      if (!res.ok) {
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch { data = { error: text }; }
        alert(data?.error || 'No se pudo eliminar el nivel');
        return;
      }

      await obtenerNiveles();
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setMostrarModalEliminar(false);
      setNivelAEliminar(null);
    }
  };

  // ---------- Navegar a ejercicios ----------
  const irANivel = (idNivel) => {
    router.push(`/dashboard/ejercicios?seccion=${idSeccion}&nivel=${idNivel}`);
  };

  return (
    <div className="w-full">
      {/* Encabezado y crear */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Niveles</h3>
        {niveles.length < 3 && (
          <button
            onClick={crearNivel}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-md shadow hover:bg-green-700"
          >
            + Crear Nivel
          </button>
        )}
      </div>

      {/* Estados */}
      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : errorMsg ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
          {errorMsg === 'No hay geriátrico activo en la sesión'
            ? <>No hay geriátrico activo. Vuelve a iniciar sesión o fija uno con <code>/api/sesion/usar-geriatrico</code>.</>
            : errorMsg}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {niveles.length === 0 ? (
            <div className="text-gray-500">No hay niveles.</div>
          ) : (
            niveles.map((n, index) => (
              <div
                key={n.id_nivel}
                className="bg-white p-4 shadow-md rounded-xl border relative"
              >
                <h2
                  className="text-lg font-semibold cursor-pointer"
                  onClick={() => irANivel(n.id_nivel)}
                  title="Ver ejercicios de este nivel"
                >
                  {n.nombre || `Nivel ${index + 1}`}
                </h2>

                {/* Conteo proveniente del SP */}
                <p className="text-sm text-gray-600">
                  Ejercicios: {typeof n.ejercicios_count !== 'undefined' ? n.ejercicios_count : '—'}
                </p>

                <button
                  onClick={() => confirmarEliminacion(n.id_nivel)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                  title="Eliminar nivel"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal eliminar nivel */}
      {mostrarModalEliminar && nivelAEliminar && (
        <ModalConfirmacion
          mensaje="¿Estás seguro que deseas eliminar este nivel y sus ejercicios?"
          onConfirmar={eliminarNivel}
          onCancelar={() => {
            setMostrarModalEliminar(false);
            setNivelAEliminar(null);
          }}
        />
      )}
    </div>
  );
};

export default ListaNiveles;
