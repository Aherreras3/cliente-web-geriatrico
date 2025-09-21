import { useEffect, useRef, useState } from "react";

export default function GeriatricoSwitcher({ onClose }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const size = 20;
  const typing = useRef(null);

  const load = async (reset=false) => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/geriatricos?q=${encodeURIComponent(q)}&page=${page}&size=${size}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      const list = data?.data?.items ?? [];
      const tot  = data?.data?.total ?? 0;
      setItems(reset ? list : (prev) => [...prev, ...list]);
      setTotal(tot);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [q]);
  useEffect(() => { if (page>1) load(false); /* eslint-disable-next-line */ }, [page]);

  const choose = (g) => {
    localStorage.setItem('geriatrico_activo', JSON.stringify({ id: g.id_geriatrico, nombre: g.nombre }));
    onClose?.();
    window.location.reload();
  };

  const canMore = items.length < total;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="font-semibold">Seleccionar geriátrico</div>
          <button className="ml-auto text-gray-500" onClick={onClose}>✕</button>
        </div>

        <div className="p-3 border-b">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Buscar nombre o ciudad…"
            onChange={(e) => {
              const v = e.target.value;
              clearTimeout(typing.current);
              typing.current = setTimeout(() => { setQ(v.trim()); setPage(1); }, 250);
            }}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {items.map((g) => (
            <button
              key={g.id_geriatrico}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b"
              onClick={() => choose(g)}
            >
              <div className="font-medium">{g.nombre}</div>
              <div className="text-xs text-gray-500">{g.ciudad || '—'}</div>
            </button>
          ))}

          {loading && <div className="p-4 text-sm text-gray-500">Cargando…</div>}
          {!loading && items.length === 0 && <div className="p-6 text-gray-500">Sin resultados</div>}

          {canMore && !loading && (
            <div className="p-4">
              <button className="w-full border rounded-lg px-3 py-2" onClick={() => setPage((p)=>p+1)}>Cargar más</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
