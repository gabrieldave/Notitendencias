/** OAuth Google habilitado solo si ambas credenciales Auth.js v5 están definidas. */
export function isGoogleAuthConfigured(): boolean {
  return (
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET?.trim())
  );
}
