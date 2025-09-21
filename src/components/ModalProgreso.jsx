// src/components/ModalProgreso.jsx
import { useEffect, useState } from 'react';

const ModalProgreso = ({ idTest, idAdulto, cerrar }) => {
  const [progreso, setProgreso] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // ---- Helpers robustos ----
  const parseNum = (v, { fallback = 0 } = {}) => {
    if (v === null || v === undefined) return fallback;
    // Normaliza: quita espacios, cambia coma decimal por punto
    const s = String(v).trim().replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };

  // Busca un valor por una lista de rutas posibles (incluye anidadas con ".")
  const pickPath = (obj, paths) => {
    for (const p of paths) {
      const parts = p.split('.');
      let cur = obj;
      let ok = true;
      for (const part of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
          cur = cur[part];
        } else {
          ok = false;
          break;
        }
      }
      if (ok && cur !== undefined) return cur;
    }
    return undefined;
  };

  // Si no encontramos por rutas conocidas, intentamos por regex del nombre
  const pickByRegex = (obj, regex) => {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const k of Object.keys(obj)) {
      if (regex.test(k)) return obj[k];
    }
    return undefined;
  };

  useEffect(() => {
    const obtenerProgreso = async () => {
      setCargando(true);
      setErrorMsg('');
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tests/${idTest}/progreso/${idAdulto}`,
          { credentials: 'include' }
        );

        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }

        const ct = res.headers.get('content-type') || '';
        const raw = ct.includes('application/json') ? await res.json() : null;
        // Si viene array, toma la primera fila
        const data = Array.isArray(raw) ? (raw[0] ?? null) : raw;

        if (!res.ok) {
          setErrorMsg(data?.error || `No se pudo cargar (HTTP ${res.status})`);
          setProgreso(null);
          return;
        }

        // Log sólo en dev (útil para ver exactamente qué llega)
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('API progreso (raw):', raw);
        }

        setProgreso(data || null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error al obtener progreso:', error);
        setErrorMsg('Error de red al cargar el progreso.');
        setProgreso(null);
      } finally {
        setCargando(false);
      }
    };

    if (idTest && idAdulto) obtenerProgreso();
  }, [idTest, idAdulto]);

  const Wrapper = ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-[400px]">
        {children}
        <div className="flex justify-end mt-6">
          <button
            onClick={cerrar}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  if (cargando) {
    return (
      <Wrapper>
        <h2 className="text-xl font-semibold mb-4">Progreso del Participante</h2>
        <p className="text-gray-600">Cargando...</p>
      </Wrapper>
    );
  }

  if (errorMsg || !progreso) {
    return (
      <Wrapper>
        <h2 className="text-xl font-semibold mb-4">Progreso del Participante</h2>
        <p className="text-red-600">{errorMsg || 'No hay datos registrados aún.'}</p>
      </Wrapper>
    );
  }

  // --- Lectura robusta de campos ---
  const nombre = pickPath(progreso, ['nombre_completo', 'nombre', 'participante']) ?? '—';
  const total = parseNum(pickPath(progreso, ['total_ejercicios', 'total']), { fallback: 0 });
  const respondidos = parseNum(pickPath(progreso, ['ejercicios_respondidos', 'respondidos']), { fallback: 0 });

  const cobertura = parseNum(
    pickPath(progreso, ['porcentaje_cobertura', 'porcentaje']) ?? 0,
    { fallback: 0 }
  );

  const avance = parseNum(
    pickPath(progreso, ['porcentaje_avance']) ?? cobertura,
    { fallback: 0 }
  );

  const realizado = Boolean(
    pickPath(progreso, ['realizado']) ??
    pickPath(progreso, ['completado']) ??
    false
  );

  const fechaFin = pickPath(progreso, ['fecha_fin']);

  // Puntaje: intenta varias rutas conocidas y nombres alternos.
  let rawPuntaje =
    pickPath(progreso, ['puntaje']) ??
    pickPath(progreso, ['progreso.puntaje']) ??
    pickPath(progreso, ['puntaje_penal']) ??
    pickPath(progreso, ['puntaje_calc']);

  // Si aún no hay, intenta por nombre de clave que contenga "puntaje" o "score" (insensible a mayúsculas)
  if (rawPuntaje === undefined) {
    rawPuntaje = pickByRegex(progreso, /puntaje|score|nota|promedio/i);
  }

  const puntaje = parseNum(rawPuntaje, { fallback: 0 });

  // --- UI ---
  const Bar = ({ value, color, bg = 'bg-gray-200' }) => (
    <div className={`w-full ${bg} rounded-full h-4`}>
      <div
        className={`h-4 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );

  const Badge = ({ ok }) => (
    <span className={`px-2 py-1 rounded text-white ${ok ? 'bg-green-600' : 'bg-yellow-600'}`}>
      {ok ? 'Realizado' : 'En curso'}
    </span>
  );

  return (
    <Wrapper>
      <h2 className="text-xl font-semibold mb-4">Progreso del Participante</h2>

      <div className="space-y-3">
        <p><strong>Nombre:</strong> {nombre}</p>
        <p><strong>Ejercicios del test:</strong> {total}</p>
        <p><strong>Ejercicios respondidos:</strong> {respondidos}</p>

        {/* Cobertura */}
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">Cobertura del test</p>
          <Bar value={cobertura} color="bg-blue-600" />
          <p className="text-sm mt-1 text-gray-600 text-right">
            {cobertura.toFixed(2)}%
          </p>
        </div>

        {/* Avance */}
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">Avance del intento</p>
          <Bar value={avance} color="bg-teal-600" />
          <p className="text-sm mt-1 text-gray-600 text-right">
            {avance.toFixed(2)}%
          </p>
        </div>

        {/* Puntaje y estado */}
        <div className="flex items-center justify-between">
          <p>
            <strong>Puntaje:</strong>{' '}
            {`${puntaje.toFixed(2)}%`}
          </p>
          <Badge ok={realizado} />
        </div>

        {fechaFin && (
          <p className="text-sm text-gray-600">
            <strong>Fecha fin:</strong> {String(fechaFin).split('.')[0]}
          </p>
        )}
      </div>
    </Wrapper>
  );
};

export default ModalProgreso;
