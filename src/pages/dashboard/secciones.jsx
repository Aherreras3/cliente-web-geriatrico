// src/pages/dashboard/secciones.jsx
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CardSeccion from '@/components/CardSeccion';
import CrearSeccionModal from '@/components/CrearSeccionModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import InfoDialog from '@/components/InfoDialog';

function getCtx() {
  try { return JSON.parse(localStorage.getItem('geriatrico_activo') || 'null'); }
  catch { return null; }
}
function isSuper() {
  return localStorage.getItem('is_superadmin') === '1';
}

// ---------- Pequeño componente de paginación ----------
function Pagination({ page, totalPages, onChange, showing, total }) {
  // generar lista de páginas (compacto con puntos cuando hay muchas)
  const pages = useMemo(() => {
    const maxBtns = 7;
    if (totalPages <= maxBtns) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const out = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
    return Array.from(out).filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  const withDots = (arr) => {
    const res = [];
    for (let i = 0; i < arr.length; i++) {
      res.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) res.push('…');
    }
    return res;
  };

  return (
    <div className="mt-32 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-sm text-gray-600">
        Mostrando <b>{showing.from}</b>–<b>{showing.to}</b> de <b>{total}</b>
      </div>

      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>

        {withDots(pages).map((p, idx) =>
          p === '…' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={
                p === page
                  ? 'px-3 py-1.5 rounded border border-verde bg-verde text-white'
                  : 'px-3 py-1.5 rounded border bg-white text-gray-700 hover:bg-gray-50'
              }
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
// ------------------------------------------------------

const Secciones = () => {
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [soySuper, setSoySuper] = useState(false);

  // Confirmación de eliminado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [seccionObjetivo, setSeccionObjetivo] = useState(null);

  // Modal de info/errores
  const [infoDlg, setInfoDlg] = useState({ open: false, title: '', message: '', tone: 'info' });

  // ---------------- PAGINACIÓN ----------------
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // se recalcula en resize

  // 4 filas por página; columnas dependen de ancho de pantalla
  const calcPageSize = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const cols = w < 640 ? 1 : w < 1024 ? 2 : 3;  // tailwind: base, sm, lg
    const rows = 4;
    return cols * rows;
  };

  useEffect(() => {
    const update = () => setPageSize(calcPageSize());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  // --------------------------------------------

  const cargarUsuario = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, { credentials:'include' });
      const d = await r.json().catch(()=>({}));
      const u = d.usuario || d;
      const s = !!u?.is_superadmin;
      setSoySuper(s);
      return s;
    } catch {
      setSoySuper(false);
      return false;
    }
  };

  const obtenerSecciones = async () => {
    setLoading(true); setError('');
    try {
      const esSuper = await cargarUsuario();
      const ctx = getCtx();

      if (esSuper && !ctx?.id) {
        setError('Selecciona un geriátrico desde “Elegir geriátrico”.');
        setSecciones([]);
        setLoading(false);
        return;
      }

      const headers = {};
      if (ctx?.id || ctx?.id_geriatrico) {
        headers['X-Geriatrico-Id'] = String(ctx.id ?? ctx.id_geriatrico);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, {
        credentials: 'include',
        headers
      });

      if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudieron cargar las secciones.');
        setSecciones([]);
      } else {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setSecciones(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las secciones.');
      setSecciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerSecciones();
    const onStorage = (e) => { if (e.key === 'geriatrico_activo') obtenerSecciones(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Clamp de página cuando cambian datos o pageSize
  const total = secciones.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const slice = secciones.slice(start, end);

  const handleClickCrear = () => {
    if (isSuper()) {
      const ctx = getCtx();
      if (!ctx?.id) {
        setInfoDlg({
          open: true,
          title: 'Selecciona un geriátrico',
          message: 'Primero elige un geriátrico en el botón del header.',
          tone: 'warning'
        });
        return;
      }
    }
    setMostrarModal(true);
  };

  const onSeccionCreada = () => {
    setMostrarModal(false);
    // al crear, vuelve a la última página (donde podría caer el nuevo ítem)
    obtenerSecciones().then(() => setPage(totalPages));
  };

  const openConfirmDelete = (s) => {
    setSeccionObjetivo(s);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    const s = seccionObjetivo;
    if (!s) return;
    try {
      setConfirmLoading(true);

      const headers = {};
      const ctx = getCtx();
      if (ctx?.id || ctx?.id_geriatrico) {
        headers['X-Geriatrico-Id'] = String(ctx.id ?? ctx.id_geriatrico);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones/${s.id_seccion}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });

      if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }

      const data = await res.json().catch(()=>({}));

      if (!res.ok || data?.ok === false) {
        if (res.status === 409) {
          setInfoDlg({
            open: true,
            title: 'No se puede eliminar la sección',
            message: data?.error || 'La sección tiene elementos asociados. Elimina o reubícalos primero.',
            tone: 'danger'
          });
        } else {
          setInfoDlg({
            open: true,
            title: 'Error al eliminar',
            message: data?.error || `No se pudo eliminar la sección (HTTP ${res.status}).`,
            tone: 'danger'
          });
        }
        return;
      }

      await obtenerSecciones();
      // si la página quedó “vacía”, retrocede una
      setPage((p) => Math.min(p, Math.max(1, Math.ceil((total - 1) / pageSize))));
      setConfirmOpen(false);
      setSeccionObjetivo(null);
    } catch (e) {
      console.error('Eliminar sección:', e);
      setInfoDlg({
        open: true,
        title: 'Error',
        message: 'Ocurrió un error eliminando la sección.',
        tone: 'danger'
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Secciones</h1>
          <button
            onClick={handleClickCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            + Crear Sección
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 text-amber-900 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-500">Cargando…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slice.map((s) => (
                <div key={s.id_seccion} className="relative group">
                  <CardSeccion seccion={s} />
                  {/* Botón eliminar visible al hover */}
                  <button
                    type="button"
                    onClick={() => openConfirmDelete(s)}
                    className="
                      absolute top-2 right-2 z-10
                      rounded-full bg-white/90 text-red-600 border border-red-200
                      px-2.5 py-1 text-xs font-semibold shadow
                      opacity-0 group-hover:opacity-100 transition
                      hover:bg-red-50
                    "
                    title="Eliminar sección"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {!slice.length && !error && (
                <div className="text-gray-500">No hay secciones.</div>
              )}
            </div>

            {/* Controles de paginación */}
            {!!total && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                total={total}
                showing={{
                  from: total ? start + 1 : 0,
                  to: end
                }}
              />
            )}
          </>
        )}

        {/* Crear sección */}
        <CrearSeccionModal
          isOpen={mostrarModal}
          onClose={() => setMostrarModal(false)}
          onCreated={onSeccionCreada}
        />

        {/* Confirmar eliminación */}
        <ConfirmDialog
          open={confirmOpen}
          title="¿Eliminar definitivamente la sección?"
          message={
            <>
              <p className="mb-1">
                Se borrará <b>{seccionObjetivo?.nombre || "esta sección"}</b> de forma permanente.
              </p>
            </>
          }
          onCancel={() => { setConfirmOpen(false); setSeccionObjetivo(null); }}
          onConfirm={confirmarEliminar}
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          confirmLoading={confirmLoading}
          tone="danger"
        />

        {/* Modal de información */}
        <InfoDialog
          open={infoDlg.open}
          onClose={() => setInfoDlg((d) => ({ ...d, open: false }))}
          title={infoDlg.title}
          message={infoDlg.message}
          tone={infoDlg.tone}
          actionLabel="Entendido"
        />
      </div>
    </DashboardLayout>
  );
};

export default Secciones;
