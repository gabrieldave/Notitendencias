import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notitendencias",
  description:
    "Las tendencias digitales más importantes, resumidas y convertidas en ideas útiles.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3015",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className="min-h-screen">
        <Header />
        <main>{children}</main>
        <footer className="border-t border-slate-200 bg-white py-10 text-center text-sm text-slate-600">
          © {new Date().getFullYear()} Notitendencias · vibesystems.tech
        </footer>
      </body>
    </html>
  );
}
