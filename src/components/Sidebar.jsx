// src/components/Sidebar.jsx
import React from "react";
import {
  FaHome, FaLayerGroup, FaChartBar, FaSignOutAlt,
  FaBars, FaUser, FaStore,
} from "react-icons/fa";
import { routes } from "@/routes";

const Sidebar = ({ isOpen, toggleSidebar, userName = "Usuario", userRole = "—", cargandoUser = false }) => {
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch { }
      window.location.href = routes.login;
    }
  };

  // Formatear rol (primera letra mayúscula)
  const formatRole = (rol) => {
    if (!rol || typeof rol !== "string") return "—";
    return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
  };

  // Iniciales a partir del nombre (ej. "Juan Pérez" -> "JP")
  const initialsFromName = (name) => {
    const parts = String(name || "").trim().split(/\s+/);
    const a = (parts[0]?.[0] || "U").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a;
  };

  return (
    <aside
      className={`bg-verde text-white min-h-screen p-6 flex flex-col justify-between z-40 transition-transform duration-300 fixed md:relative top-0 left-0 w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div>
        <div className="md:hidden flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">ADULTO MAYORES</h1>
          <button onClick={toggleSidebar}>
            <FaBars className="text-2xl" />
          </button>
        </div>

        <h1 className="hidden md:block text-2xl font-bold text-center mb-10">
          ADULTO MAYORES
        </h1>

        {/* Perfil */}
        <div className="flex flex-col items-center mb-8">
          {cargandoUser ? (
            <div className="h-20 w-20 rounded-2xl bg-white/30 animate-pulse" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center ring-4 ring-white shadow-md text-2xl font-semibold">
              {initialsFromName(userName)}
            </div>
          )}
          <h2 className="text-lg font-semibold mt-2">
            {cargandoUser ? "Cargando..." : userName}
          </h2>
          <p className="text-sm text-gray-300">
            {cargandoUser ? " " : formatRole(userRole)}
          </p>
        </div>

        {/* Menú */}
        <nav className="space-y-4">
          <a href={routes.dashboard} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
            <FaHome /> <span>Principal</span>
          </a>

          <a href={routes.secciones} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
            <FaLayerGroup /> <span>Secciones</span>
          </a>

          <a href={routes.test} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
            <FaLayerGroup /> <span>Test</span>
          </a>

          {userRole?.toLowerCase() !== "cuidador" && (
          <a href={routes.reportes} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
            <FaChartBar /> <span>Reportes</span>
          </a>
          )}

          {userRole?.toLowerCase() !== "cuidador" && (
            <a href={routes.tienda} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
              <FaStore /> <span>Tienda</span>
            </a>
          )}


          {/* Solo mostrar "Administrar Personal" si el rol NO es cuidador */}
          {userRole?.toLowerCase() !== "cuidador" && (
            <a href={routes.usuarios} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
              <FaUser /> <span>Administrar Personal</span>
            </a>
          )}

          <a href={routes.adultomayor} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-colortransicion transition">
            <FaUser /> <span>Administrar Adulto mayor</span>
          </a>
        </nav>
      </div>

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-colortransicion transition"
        >
          <FaSignOutAlt /> <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
