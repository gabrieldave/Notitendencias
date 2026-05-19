"use client";

import { Download, Share, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "notitendencias-pwa-install-dismiss";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setHidden(false);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos()) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }, [deferred, dismiss]);

  if (hidden || isStandalone()) return null;
  if (!deferred && !iosHint) return null;

  return (
    <div
      role="region"
      aria-label="Instalar aplicación"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-lift sm:left-auto sm:right-6"
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white">
          {iosHint ? <Share className="h-5 w-5" aria-hidden /> : <Download className="h-5 w-5" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-navy">Instalar Notitendencias</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {iosHint
              ? "En Safari: pulsa Compartir y luego «Añadir a pantalla de inicio»."
              : "Accede al radar como app: pantalla completa y acceso rápido desde tu celular."}
          </p>
          {!iosHint && deferred ? (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-3 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
            >
              Instalar app
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
