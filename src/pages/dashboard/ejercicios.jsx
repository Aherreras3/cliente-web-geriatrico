import { useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from "@/components/Modal";
import FormularioCrearEjercicio from "@/components/FormularioCrearEjercicio";
import ListaEjercicios from "@/components/ListaEjercicios";
import GenerarEjerciciosModal from "@/components/GenerarEjerciciosModal";

const Ejercicios = () => {
  const [open, setOpen] = useState(false);
  const [openGen, setOpenGen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  const idSeccion = router.query.seccion || "";
  const idNivel = router.query.nivel || "";

  const handleRegresar = () => {
    if (idSeccion) router.push(`/dashboard/secciones/${idSeccion}`);
    else router.back();
  };

  const onSaved = () => {
    setOpen(false);
    setOpenGen(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-2xl font-bold">Lista de Ejercicios</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegresar}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded shadow"
            >
              ← Regresar
            </button>
            <button
              onClick={() => setOpenGen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
            >
              ✨ Generar ejercicios
            </button>
            <button
              onClick={() => setOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
            >
              + Crear Ejercicio
            </button>
          </div>
        </div>

        <Modal open={open} title="Crear ejercicio" onClose={() => setOpen(false)}>
          <FormularioCrearEjercicio
            idSeccionDefault={idSeccion}
            idNivelDefault={idNivel}
            onSaved={onSaved}
            onCancel={() => setOpen(false)}
          />
        </Modal>

        <GenerarEjerciciosModal
          isOpen={openGen}
          onClose={() => setOpenGen(false)}
          idSeccionDefault={idSeccion}
          idNivelDefault={idNivel}
          onSaved={onSaved}
        />

        <ListaEjercicios idSeccion={idSeccion} idNivel={idNivel} key={reloadKey} />
      </div>
    </DashboardLayout>
  );
};

export default Ejercicios;
