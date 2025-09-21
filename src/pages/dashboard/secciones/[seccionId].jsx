import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ListaNiveles from '@/components/ListaNiveles';

const SeccionNiveles = () => {
  const router = useRouter();
  const { seccionId } = router.query;

  const [nombreSeccion, setNombreSeccion] = useState('');

   const volverASecciones = () => {
    router.push(`/dashboard/secciones`);
  };

  useEffect(() => {
    if (!seccionId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const seccion = data.find(s => s.id_seccion === parseInt(seccionId));
        setNombreSeccion(seccion?.nombre || 'Sección');
      });
  }, [seccionId]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Niveles de: {nombreSeccion}</h1>
          <button
            onClick={volverASecciones}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg"
          >
            ← Regresar
          </button>
        </div>

        {seccionId && <ListaNiveles idSeccion={seccionId} />}
      </div>
    </DashboardLayout>
  );
};

export default SeccionNiveles;
