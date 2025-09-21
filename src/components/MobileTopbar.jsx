// src/components/MobileTopbar.jsx
import React from "react";
import { FaBars } from "react-icons/fa";

const MobileTopbar = ({ onToggle }) => {
  return (
    <div className="md:hidden fixed top-0 left-0 w-full bg-verde text-white flex items-center justify-between px-4 py-3 shadow z-50">
      <button onClick={onToggle}>
        <FaBars className="text-2xl" />
      </button>
      <h1 className="text-lg font-bold">ADULTO MAYORES</h1>
      {/* Espacio invisible para centrar el título */}
      <div className="w-6" />
    </div>
  );
};

export default MobileTopbar;
