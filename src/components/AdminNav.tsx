import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

const links = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/published", label: "Publicadas" },
  { href: "/admin/usage", label: "Consumo" },
  { href: "/admin/import", label: "Importar CSV" },
  { href: "/admin/settings", label: "Ajustes" },
  { href: "/admin/users", label: "Usuarios" },
] as const;

export function AdminNav({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-full border px-4 py-2 font-semibold ${
            active === link.href
              ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
              : "border-slate-200 bg-white hover:border-brand-orange"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <AdminLogoutButton />
    </div>
  );
}
