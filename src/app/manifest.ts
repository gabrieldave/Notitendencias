import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Notitendencias — Radar IA",
    short_name: "Notitendencias",
    description:
      "Tendencias de IA resumidas, análisis accionable y radar premium para México.",
    start_url: "/ia",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0b1f3b",
    theme_color: "#0b1f3b",
    lang: "es",
    categories: ["news", "business"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
