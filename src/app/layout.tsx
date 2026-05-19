import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { Providers } from "@/components/Providers";
import { PwaRegister } from "@/components/PwaRegister";
import { SessionRefresh } from "@/components/SessionRefresh";
import { SiteFooter } from "@/components/SiteFooter";
import { getOptionalSessionUser } from "@/lib/session-user";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Cabecera con sesión: no cachear HTML estático sin cookie de sesión. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notitendencias",
  description:
    "Las tendencias digitales más importantes, resumidas y convertidas en ideas útiles.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3015",
  ),
  applicationName: "Notitendencias",
  appleWebApp: {
    capable: true,
    title: "Notitendencias",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b1f3b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getOptionalSessionUser();
  return (
    <html lang="es" className={dmSans.variable}>
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <Providers>
          <PwaRegister />
          <SessionRefresh />
          <Header user={user} />
          <main className="min-h-[50vh]">{children}</main>
          <SiteFooter />
          <InstallAppPrompt />
        </Providers>
      </body>
    </html>
  );
}
