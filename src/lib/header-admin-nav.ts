/** Enlace «Admin» visible solo para este usuario en el header (resto del acceso a `/admin` sigue igual). */
const HEADER_ADMIN_EMAIL = "david.del.rio.colin@gmail.com";

export function showHeaderAdminNav(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === HEADER_ADMIN_EMAIL;
}
