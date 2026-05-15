import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { getOptionalSessionUser } from "@/lib/user-session";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getOptionalSessionUser();
  return (
    <html lang="es" className={dmSans.variable}>
      <body className="min-h-screen">
        <Header user={user} />
        <main className="min-h-[50vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
