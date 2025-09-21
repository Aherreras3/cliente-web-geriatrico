import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileTopbar from "@/components/MobileTopbar";
import Topbar from "@/components/Topbar";
import { usePathname } from "next/navigation";

const DashboardLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Estado de usuario autenticado
  const [user, setUser] = useState(null);
  const [cargandoUser, setCargandoUser] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => setIsOpen(prev => !prev);

  // Cargar usuario desde /usuarios/me (trae nombres/apellidos)
  useEffect(() => {
    const cargarUsuario = async () => {
      setCargandoUser(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json().catch(() => null);
        // la respuesta es { user: {...}, geriatrico_activo, geriatrico_list }
        setUser(data?.user || null);
      } catch (e) {
        console.error("No se pudo obtener el usuario:", e);
      } finally {
        setCargandoUser(false);
      }
    };
    cargarUsuario();
  }, []);

  // Título de Topbar
  const pathname = usePathname();
  const getTitleFromPath = (path) => {
    if (!path) return "Panel de control";
    if (path.includes("/secciones")) return "Secciones";
    if (path.includes("/test")) return "Tests";
    if (path.includes("/reportes")) return "Reportes";
    if (path.includes("/tienda")) return "Tienda";
    if (path.includes("/usuarios")) return "Administrar usuarios";
    if (path.includes("/adultomayor")) return "Administrar Adultos Mayores";
    if (path.includes("/perfil")) return "Perfil";            // ⬅️ nuevo
    if (path.includes("/seguridad")) return "Seguridad";
    return "Panel de control";
  };

  // Mostrar “PrimerNombre PrimerApellido” y rol legible
  const displayName =
    user?.short_name ||
    [user?.nombres?.split(/\s+/)[0], user?.apellidos?.split(/\s+/)[0]]
      .filter(Boolean)
      .join(" ") ||
    "Usuario";

  const userRole = user?.role_label || user?.tipo_usuario || "—";

  return (
    <div className="flex min-h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          <MobileTopbar onToggle={toggleSidebar} />
          <Sidebar
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
            userName={displayName}
            userRole={userRole}
            cargandoUser={cargandoUser}
          />
          <main className="flex-1 p-4 pt-[4.5rem]">{children}</main>
        </>
      ) : (
        <>
          <Sidebar
            isOpen
            toggleSidebar={toggleSidebar}
            userName={displayName}
            userRole={userRole}
            cargandoUser={cargandoUser}
          />
          <div className="flex flex-col w-full">
            <Topbar title={getTitleFromPath(pathname)} username={displayName} />
            <main className="flex-1 p-4">{children}</main>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
