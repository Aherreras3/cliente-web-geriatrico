import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const EjerciciosDeSeccion = () => {
  const router = useRouter();
  const { idSeccion } = router.query;

  const [ejercicios, setEjercicios] = useState([]);

  useEffect(() => {
    if (!idSeccion) return;

    const obtenerEjercicios = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ejercicios/seccion/${idSeccion}`, {
          credentials: 'include',
        });
        const data = await res.json();
        setEjercicios(data);
      } catch (err) {
        console.error('Error al obtener ejercicios:', err);
      }
    };

    obtenerEjercicios();
  }, [idSeccion]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ejercicios de la Sección {idSeccion}</h1>
      {ejercicios.length === 0 ? (
        <p className="text-gray-500">No hay ejercicios disponibles para esta sección.</p>
      ) : (
        <ul className="space-y-2">
          {ejercicios.map((ej) => (
            <li key={ej.id_ejercicio} className="border p-3 rounded shadow">
              <p><strong>ID:</strong> {ej.id_ejercicio}</p>
              <p><strong>Tipo:</strong> {ej.tipo}</p>
              <p><strong>Contenido:</strong> {ej.contenido}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EjerciciosDeSeccion;
