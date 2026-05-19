"use client";

import { useEffect } from "react";

/** Registra el service worker (requerido para “Instalar app” en Chrome/Android). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* Producción sin HTTPS o bloqueo del navegador: la web sigue funcionando. */
    });
  }, []);

  return null;
}
