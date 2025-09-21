import React from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import ReportEjecucionTests from '@/components/reports/ReportEjecucionTests';
import ReportParticipacionAdulto from '@/components/reports/ReportParticipacionAdulto';
import ReportSeccionesUso from '@/components/reports/ReportSeccionesUso';
import ReportCuidadores from '@/components/reports/ReportCuidadores';
import ReportProgresoTiempo from '@/components/reports/ReportProgresoTiempo';
import ReportAbandono from '@/components/reports/ReportAbandono';
import ReportFrecuenciaUso from '@/components/reports/ReportFrecuenciaUso';
// placeholders:
import Placeholder from '@/components/reports/Placeholder';

const REGISTRY = {
  'ejecucion-tests': {
    title: 'Ejecución de tests + Promedio',
    component: ReportEjecucionTests,
  },
  'participacion-adulto': {
    title: 'Participación por adulto',
    component:  ReportParticipacionAdulto,
  },
  'secciones-uso': {
    title: 'Secciones más utilizadas',
    component: ReportSeccionesUso,
  },
  'cuidadores': {
    title: 'Reporte de cuidadores',
    component: ReportCuidadores,
  },
  'progreso-tiempo': {
    title: 'Progreso en el tiempo',
    component: ReportProgresoTiempo,
  },
  'abandono': {
    title: 'Reporte de abandono',
    component: ReportAbandono,
  },
  'frecuencia-uso': {
    title: 'Frecuencia de uso',
    component: ReportFrecuenciaUso,
  },
};

export default function ReporteRouterPage() {
  const router = useRouter();
  const { slug } = router.query;

  const def = slug ? REGISTRY[slug] : null;
  const Component = def?.component;

  return (
    <DashboardLayout>
      {!Component ? (
        <div className="p-6">
          <div className="text-sm text-gray-500 mb-3">
            <button onClick={() => router.back()} className="hover:underline">← Volver</button>
          </div>
          <div className="p-6 text-center">Reporte no encontrado.</div>
        </div>
      ) : (
        <div className="p-6">
          <div className="text-sm text-gray-500 mb-3">
            <button onClick={() => router.back()} className="hover:underline">← Volver</button>
          </div>
          <h1 className="text-2xl font-semibold mb-4">{def.title}</h1>
          <Component />
        </div>
      )}
    </DashboardLayout>
  );
}

