// src/components/TestDetalle.jsx
import { useEffect, useState } from 'react';
import { FaUsers, FaLayerGroup, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/router';
import Participantes from './Participantes';
import SeccionesTest from './SeccionesTest';
import ConfirmDialog from '@/components/ConfirmDialog';
import InfoDialog from '@/components/InfoDialog';

const TestDetalle = ({ id }) => {
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [vistaActual, setVistaActual] = useState('principal');
  const [cantidadParticipantes, setCantidadParticipantes] = useState(0);
  const [cantidadSecciones, setCantidadSecciones] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // dialogs de eliminar
  const [delOpen, setDelOpen] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [infoDlg, setInfoDlg] = useState({ open: false, title: '', message: '', tone: 'info' });

  const contarParticipantes = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}/participantes`, { credentials: 'include' });
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json().catch(() => null);
    setCantidadParticipantes(Array.isArray(data) ? data.length : 0);
  };

  const contarSecciones = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}/secciones`, { credentials: 'include' });
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json().catch(() => null);
    setCantidadSecciones(Array.isArray(data) ? data.length : 0);
  };

  useEffect(() => {
    if (!id) return;
    const cargar = async () => {
      setCargando(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}/detalle`, { credentials: 'include' });
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setErrorMsg(data?.error || `No se pudo cargar el test (HTTP ${res.status})`);
          setTest(null);
          return;
        }
        setTest(data);
        contarParticipantes();
        contarSecciones();
      } catch {
        setErrorMsg('Error de red al cargar test');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, router]);

  const abrirEliminar = () => setDelOpen(true);

  const confirmarEliminar = async () => {
    setDelLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // cierra el confirm primero SIEMPRE
      setDelOpen(false);
      setDelLoading(false);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Mensaje bonito de por qué no se puede
        setInfoDlg({
          open: true,
          title: 'No se pudo eliminar',
          message:
            data?.error ||
            (res.status === 409
              ? 'El test tiene participantes o secciones asociadas.'
              : `Error (HTTP ${res.status}) al eliminar.`),
          tone: 'danger',
        });
        return;
      }

      // Eliminado OK -> redirigir a la lista
      router.replace('/dashboard/test');
    } catch (e) {
      setDelOpen(false);
      setDelLoading(false);
      setInfoDlg({
        open: true,
        title: 'Error',
        message: 'Ocurrió un error eliminando el test.',
        tone: 'danger',
      });
    }
  };

  if (cargando) return <p className="text-gray-500">Cargando test...</p>;
  if (errorMsg) return <p className="text-red-600">{errorMsg}</p>;
  if (!test) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {vistaActual === 'principal' && (
        <>
          <h1 className="text-2xl font-bold text-[#0F766E] mb-1">{test.titulo}</h1>
          <p className="text-gray-700 mb-2">{test.descripcion}</p>
          <p className="text-sm text-gray-400 mb-6">
            Creado el: {new Date(test.fecha_creacion).toLocaleString()}
          </p>

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Opciones básicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Participantes */}
            <div
              onClick={() => setVistaActual('participantes')}
              className="relative cursor-pointer border-2 border-[#0F766E] rounded-lg p-4 flex flex-col items-center text-center shadow hover:shadow-md transition"
            >
              {cantidadParticipantes > 0 && (
                <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {cantidadParticipantes}
                </span>
              )}
              <FaUsers className="text-3xl text-[#0F766E] mb-2" />
              <h3 className="text-lg font-bold">Participantes</h3>
              <p className="text-sm text-gray-500">Ver o agregar</p>
            </div>

            {/* Secciones */}
            <div
              onClick={() => setVistaActual('secciones')}
              className="relative cursor-pointer border-2 border-[#0F766E] rounded-lg p-4 flex flex-col items-center text-center shadow hover:shadow-md transition"
            >
              {cantidadSecciones > 0 && (
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {cantidadSecciones}
                </span>
              )}
              <FaLayerGroup className="text-3xl text-[#0F766E] mb-2" />
              <h3 className="text-lg font-bold">Secciones</h3>
              <p className="text-sm text-gray-500">ACTUALES: {cantidadSecciones}</p>
            </div>

            {/* Eliminar */}
            <div
              onClick={abrirEliminar}
              className="cursor-pointer border-2 border-red-500 rounded-lg p-4 flex flex-col items-center text-center shadow hover:shadow-md transition"
            >
              <FaTrash className="text-3xl text-red-500 mb-2" />
              <h3 className="text-lg font-bold">Eliminar</h3>
              <p className="text-sm text-gray-500">Borrar este test</p>
            </div>
          </div>
        </>
      )}

      {vistaActual === 'participantes' && (
        <Participantes
          idTest={id}
          volver={() => {
            setVistaActual('principal');
            contarParticipantes();
          }}
        />
      )}

      {vistaActual === 'secciones' && (
        <SeccionesTest
          idTest={id}
          volver={() => {
            setVistaActual('principal');
            contarSecciones();
          }}
        />
      )}

      {/* Confirmación de eliminar */}
      <ConfirmDialog
        open={delOpen}
        title="¿Eliminar este test?"
        message="Esta acción es permanente."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        confirmLoading={delLoading}
        onCancel={() => setDelOpen(false)}
        onConfirm={confirmarEliminar}
      />

      {/* Mensaje informativo / de error */}
      <InfoDialog
        open={infoDlg.open}
        onClose={() => setInfoDlg((d) => ({ ...d, open: false }))}
        title={infoDlg.title}
        message={infoDlg.message}
        actionLabel="Entendido"
        tone={infoDlg.tone}
      />
    </div>
  );
};

export default TestDetalle;
