import { FaUserCircle } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import GeriatricoSwitcher from "./GeriatricoSwitcher";
import UserMenu from "./UserMenu";


export default function Topbar({ title = "Panel", username }) {
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState(null);


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const user = d.usuario || d;
        setMe(user);
        if (user?.is_superadmin) {
          localStorage.setItem('is_superadmin', '1');
          try { setCtx(JSON.parse(localStorage.getItem('geriatrico_activo') || 'null')); } catch { }
        } else {
          localStorage.setItem('is_superadmin', '0');
          localStorage.removeItem('geriatrico_activo');
          setCtx(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('is_superadmin');
        localStorage.removeItem('geriatrico_activo');
      });
  }, []);

  return (
    <div className="w-full bg-verde text-white flex justify-between items-center px-6 py-3 shadow-md">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        {me?.is_superadmin && (
          <>
            {ctx?.nombre && (
              <span className="hidden md:inline text-sm bg-white/10 px-3 py-1 rounded-full">
                Geriátrico: <b>{ctx.nombre}</b>
              </span>
            )}
            <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm" onClick={() => setOpen(true)}>
              Elegir geriátrico
            </button>
          </>
        )}
        <div className="flex items-center gap-2 bg-orange-500 px-3 py-1 rounded-full text-sm">
          <UserMenu
            username={me?.username || me?.usuario || username}
            avatarUrl={me?.fotoUrl || me?.foto || me?.avatar}
          />

        </div>

      </div>
      {open && <GeriatricoSwitcher onClose={() => setOpen(false)} />}
    </div>
  );
}
