import "@/styles/globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useEffect } from "react";
import { ToastProvider } from "@/components/ToastProvider";

function installFetchInterceptor() {
  if (typeof window === "undefined" || window.__ctxFetchPatched) return;
  const original = window.fetch;
  window.fetch = async (input, init = {}) => {
    try {
      const activo = JSON.parse(localStorage.getItem("geriatrico_activo") || "null");
      const headers = new Headers(init.headers || {});
      if (activo?.id) headers.set("X-Geriatrico-Id", String(activo.id));
      return original(input, { ...init, headers });
    } catch {
      return original(input, init);
    }
  };
  window.__ctxFetchPatched = true;
}

export default function App({ Component, pageProps }) {
  useEffect(() => { installFetchInterceptor(); }, []);
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}
