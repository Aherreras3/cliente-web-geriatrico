// src/components/CrearPlantilla.jsx

import { useState } from "react";

const CrearPlantilla = ({ onSeleccionar }) => {
  return (
    <div className="flex justify-center gap-6 my-6">
      <img
        src="/img/plantilla_seleccionarimagen.png"
        alt="Plantilla Imagen"
        className="w-52 cursor-pointer hover:scale-105 transition rounded shadow"
        onClick={() => onSeleccionar('imagen')}
      />
      <img
        src="/img/plantilla_texto.png"
        alt="Plantilla Texto"
        className="w-52 cursor-pointer hover:scale-105 transition rounded shadow"
        onClick={() => onSeleccionar('texto')}
      />
    </div>
  );
};

export default CrearPlantilla;
