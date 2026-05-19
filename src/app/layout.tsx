import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
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
          <Header user={user} />
          <main className="min-h-[50vh]">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
