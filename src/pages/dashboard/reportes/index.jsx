import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

const api = process.env.NEXT_PUBLIC_API_URL;

const REPORTS = [
    {
        slug: 'ejecucion-tests',
        title: 'Ejecución de tests + Promedio',
        description: 'Detalle de intentos (último por test) y promedio por adulto en el rango.',
        icon: '📊',
    },
    {
        slug: 'participacion-adulto',
        title: 'Participación por adulto',
        description: 'Cantidad de tests realizados, completados y porcentaje de participación.',
        icon: '🧑‍🤝‍🧑',
    },
    {
        slug: 'secciones-uso',
        title: 'Secciones más utilizadas',
        description: 'Ranking de uso por sección con % de uso, % completado y promedio.',
        icon: '📚',
    },

    {
        slug: 'cuidadores',
        title: 'Reporte de cuidadores',
        description: 'Adultos asignados, tests realizados y puntaje promedio por cuidador.',
        icon: '🧑‍⚕️',
    },
    {
        slug: 'progreso-tiempo',
        title: 'Progreso en el tiempo',
        description: 'Evolución de puntajes y tests a lo largo de semanas/meses.',
        icon: '📈',
    },
    {
        slug: 'abandono',
        title: 'Reporte de abandono',
        description: 'Tests iniciados y no completados, adultos y ejercicios con más abandonos.',
        icon: '⚠️',
    },
    {
        slug: 'frecuencia-uso',
        title: 'Frecuencia de uso',
        description: 'Días de uso, tiempo promedio por sesión y constancia de adultos.',
        icon: '📅',
    },
];


export default function ReportesHubPage() {
    const [autenticado, setAutenticado] = useState(false);
    const [verificando, setVerificando] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${api}/usuarios/protegido`, {
                    credentials: 'include', cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });
                const ok = res.status === 200 || res.status === 304;
                setAutenticado(ok);
                if (!ok) return;
                // probamos admin como en tu Tienda
                const probe = await fetch(`${api}/reportes/ejecucion-tests-con-promedio?from=1900-01-01&to=1900-01-02`, {
                    credentials: 'include', cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });
                setIsAdmin(probe.status !== 403); // 403 ⇒ no admin
            } finally {
                setVerificando(false);
            }
        })();
    }, []);

    return (
        <DashboardLayout>
            {verificando ? (
                <div className="p-6 text-center">Verificando acceso…</div>
            ) : !autenticado ? (
                <div className="p-6 text-center">No autenticado. Inicia sesión.</div>
            ) : !isAdmin ? (
                <div className="p-6 text-center">No autorizado. Solo administradores.</div>
            ) : (
                <div className="p-6">
                    <h1 className="text-2xl font-semibold mb-4">Reportes</h1>
                    <p className="text-gray-600 mb-6">Selecciona un reporte para verlo en detalle.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {REPORTS.map((r) => (
                            <Link
                                key={r.slug}
                                href={`/dashboard/reportes/${r.slug}`}
                                className="group block bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-5 border border-transparent hover:border-teal-200"
                            >
                                <div className="text-3xl">{r.icon}</div>
                                <div className="mt-3 font-semibold text-lg group-hover:text-teal-700">{r.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{r.description}</div>
                                <div className="mt-4 text-teal-700 text-sm font-medium">Ver reporte →</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
