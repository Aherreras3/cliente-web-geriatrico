import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CrearTestModal from './CrearTestModal';

const ListaTests = () => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tests, setTests] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(6);

  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // ✅ Verificar sesión antes de mostrar componente
  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 200) {
          setAutenticado(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        router.push('/login');
      } finally {
        setVerificando(false);
      }
    };

    verificarAutenticacion();
  }, [router]);

  // ✅ Ajustar cantidad de tarjetas según ancho de pantalla
  useEffect(() => {
    const ajustarCantidad = () => {
      const ancho = window.innerWidth;
      if (ancho >= 1280) setPorPagina(12);
      else if (ancho >= 1024) setPorPagina(9);
      else if (ancho >= 768) setPorPagina(6);
      else setPorPagina(4);
    };

    ajustarCantidad();
    window.addEventListener('resize', ajustarCantidad);
    return () => window.removeEventListener('resize', ajustarCantidad);
  }, []);

  // ✅ Cargar tests si está autenticado
  useEffect(() => {
    if (!autenticado) return;

    const cargarTests = async () => {
      setCargando(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
          credentials: 'include',              // <- IMPORTANTE
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          // backend puede devolver { error: 'No hay geriátrico activo en la sesión' }
          const msg = data?.error || 'Error al cargar tests';
          setErrorMsg(msg);
          setTests([]); // asegura array
          return;
        }

        const arr = Array.isArray(data) ? data : [];
        setTests(arr);
      } catch (error) {
        console.error('Error al cargar tests:', error);
        setErrorMsg('No se pudieron cargar los tests.');
        setTests([]);
      } finally {
        setCargando(false);
      }
    };

    cargarTests();
  }, [autenticado]);

  const handleCrearTest = (nuevoTest) => {
    setTests((prev) => [nuevoTest, ...prev]);
  };

  const irADetalle = (id) => {
    router.push(`/dashboard/test/${id}`);
  };

  // Evitar fallos si tests no es array
  const list = Array.isArray(tests) ? tests : [];
  const totalPaginas = Math.ceil(list.length / porPagina) || 1;
  const inicio = (pagina - 1) * porPagina;
  const fin = inicio + porPagina;
  const testsPagina = list.slice(inicio, fin);

  if (verificando) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!autenticado) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de tests</h2>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-verde hover:bg-[#0d5e57] text-white font-medium px-4 py-2 rounded-md shadow"
        >
          + Crear Test
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : errorMsg ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
          {errorMsg === 'No hay geriátrico activo en la sesión'
            ? (
              <>
                No hay geriátrico activo en la sesión.
                <br />
                • Cierra e inicia sesión nuevamente, o<br />
                • Si perteneces a varios, fija uno con el endpoint <code>/api/sesion/usar-geriatrico</code>.
              </>
            )
            : errorMsg}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {testsPagina.length === 0 ? (
              <p className="text-gray-500">No hay tests creados.</p>
            ) : (
              testsPagina.map((test) => (
                <div
                  key={test.id_test}
                  onClick={() => irADetalle(test.id_test)}
                  className="border rounded-lg p-4 shadow bg-white hover:shadow-md transition-all cursor-pointer"
                >
                  <h3 className="text-lg font-bold text-gray-800">{test.titulo}</h3>
                  <p className="text-sm text-gray-600 mb-2">{test.descripcion}</p>
                  <span className="text-xs text-gray-400">
                    Creado: {new Date(test.fecha_creacion).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Paginación visual */}
          {list.length > porPagina && (
            <div className="flex justify-center mt-6 gap-4">
              <button
                onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                disabled={pagina === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-gray-600 font-medium">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      <CrearTestModal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onSubmit={handleCrearTest}
      />
    </div>
  );
};

export default ListaTests;
