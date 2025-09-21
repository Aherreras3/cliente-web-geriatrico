import React, { useEffect, useRef, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/router"; // pages router

export default function UserMenu({ username }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();

  // cerrar al hacer click fuera y con ESC
  useEffect(() => {
    function onDocClick(e) {
      const t = triggerRef.current, m = menuRef.current;
      if (t && t.contains(e.target)) return;
      if (m && m.contains(e.target)) return;
      setOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const go = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        className="flex items-center gap-2 bg-orange-500 px-3 py-1 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
        onClick={() => setOpen(v => !v)}
      >
        <FaUserCircle className="text-white" />
        <span className="text-white font-semibold truncate max-w-[160px]">{username}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 rounded-md border bg-white text-gray-800 shadow-lg ring-1 ring-black/5 z-50"
          role="menu"
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => go("/dashboard/perfil")}
          >
            Ver perfil
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => go("/dashboard/seguridad")}
          >
            Cambiar contraseña
          </button>
        </div>
      )}
    </div>
  );
}
