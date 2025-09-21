import { useRouter } from 'next/router';

const CardSeccion = ({ seccion }) => {
  const router = useRouter();

  const irAEjercicios = () => {
    router.push(`/dashboard/secciones/${seccion.id_seccion}`);
  };

  return (
    <div
      onClick={irAEjercicios}
      className="cursor-pointer relative bg-white border border-gray-300 rounded-xl p-5 shadow-md transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
    >
      <div className="absolute top-4 right-4 text-blue-500 text-xl">
        <i className="fas fa-layer-group"></i>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1 tracking-wide">
        {seccion.nombre}
      </h2>
      <p className="text-sm text-gray-600 mb-4 leading-snug">
        {seccion.descripcion}
      </p>
    </div>
  );
};

export default CardSeccion;
