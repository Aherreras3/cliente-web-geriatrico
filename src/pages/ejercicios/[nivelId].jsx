import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ListaEjercicios from '@/components/ListaEjercicios';
import FormularioCrearEjercicio from '@/components/FormularioCrearEjercicio';

const EjerciciosPorNivel = () => {
  const router = useRouter();
  const { idNivel } = router.query;
  const idSeccion = router.query.seccion;

  const [titulo, setTitulo] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const obtenerNombreSeccion = async () => {
      if (!idSeccion) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/secciones`, {
          credentials: 'include'
        });
        const data = await res.json();
        const seccion = Array.isArray(data) ? data.find(s => s.id_seccion === parseInt(idSeccion)) : null;
        setTitulo(seccion ? seccion.nombre : 'Sección');
      } catch (error) {
        console.error('Error al obtener nombre de la sección:', error);
      }
    };

    obtenerNombreSeccion();
  }, [idSeccion]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Ejercicios de: {titulo} (Nivel {idNivel})</h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg"
          >
            ← Regresar
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            {mostrarFormulario ? 'Cancelar' : '+ Crear Ejercicio'}
          </button>
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <FormularioCrearEjercicio idSeccion={idSeccion} idNivel={idNivel} />
          </div>
        )}

        {idSeccion && idNivel && (
          <ListaEjercicios idSeccion={idSeccion} idNivel={idNivel} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EjerciciosPorNivel;
