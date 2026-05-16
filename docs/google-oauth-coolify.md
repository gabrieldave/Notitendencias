# Google OAuth en Coolify (Notitendencias)

Guía para habilitar **solo login con Google** en producción. El enlace mágico por correo está deshabilitado en la app.

**Dominio de producción:** `https://notitendencias.iareal.net`

---

## 1. Google Cloud Console

1. Abre [Google Cloud Console](https://console.cloud.google.com/) y elige el proyecto (p. ej. `youtube` o uno dedicado).
2. **APIs y servicios** → **Pantalla de consentimiento de OAuth**
   - Tipo: **Externo** (o Interno si es solo tu organización).
   - Nombre de la app: `Notitendencias`.
   - Correo de soporte: el tuyo.
   - Si la app está en **Prueba**, añade en **Usuarios de prueba** cada Gmail que vaya a iniciar sesión.
3. **APIs y servicios** → **Credenciales** → **+ Crear credenciales** → **ID de cliente de OAuth**.
4. Tipo de aplicación: **Aplicación web**.
5. Nombre sugerido: `Notitendencias Coolify`.

### Orígenes y redirección (copiar tal cual)

| Campo | Valor |
|--------|--------|
| **Orígenes de JavaScript autorizados** | `https://notitendencias.iareal.net` |
| **URIs de redireccionamiento autorizados** | `https://notitendencias.iareal.net/api/auth/callback/google` |

> El host debe coincidir **exactamente** con `AUTH_URL` y `NEXT_PUBLIC_APP_URL` en Coolify (mismo dominio, `https`, sin `/` final).

6. Pulsa **Crear** y guarda:
   - **ID de cliente** → `AUTH_GOOGLE_ID`
   - **Secreto del cliente** → `AUTH_GOOGLE_SECRET` (solo se muestra una vez; si se filtra, **restablece el secreto** en Google).

Los cambios pueden tardar **5–30 minutos** en propagarse.

---

## 2. Variables en Coolify

**Sin `AUTH_SECRET` en runtime** verás `[auth][error] MissingSecret` en los logs y fallará el middleware de **`/admin`**. Debe estar definida como variable de **Runtime** del servicio (no solo en la fase de build).

> **Auditoría Coolify:** si la variable existe en el panel pero sigue el error, suele ser porque el **middleware Edge** empaqueta `process.env.AUTH_SECRET` en la imagen durante `next build` como vacío (no estaba disponible en la etapa de build). El código usa lectura en runtime del secreto en `middleware.ts`. Aun así conviene tener `AUTH_SECRET` también disponible en **buildtime** en Coolify para otros pasos; tras cambios de código, haz **redeploy**.

En el servicio **Notitendencias** → **Environment Variables** (runtime):

| Variable | Valor |
|----------|--------|
| `AUTH_GOOGLE_ID` | ID de cliente (`….apps.googleusercontent.com`) |
| `AUTH_GOOGLE_SECRET` | Secreto del cliente |
| `AUTH_URL` | `https://notitendencias.iareal.net` |
| `NEXT_PUBLIC_APP_URL` | `https://notitendencias.iareal.net` |
| `AUTH_SECRET` | Generar: `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `ADMIN_EMAILS` | (opcional) `tu@gmail.com` para rol admin en BD al entrar con Google |

Ya **no** hacen falta para login: `WEBHOOK_URL`, `APP_ID`, `AUTH_EMAIL_FROM` (magic link retirado).

**Redeploy** del contenedor después de guardar.

---

## 3. Comprobar

1. Abre `https://notitendencias.iareal.net/login`
2. Debe aparecer solo **Continuar con Google**
3. Tras autorizar, redirige al home o a `callbackUrl`

### Errores frecuentes

| Síntoma | Causa | Qué hacer |
|---------|--------|-----------|
| `redirect_uri_mismatch` | URI en Google ≠ URL pública | Revisar redirect en credenciales y `AUTH_URL` |
| `access_denied` | App en modo Prueba y email no en testers | Añadir email en Pantalla de consentimiento |
| `invalid_client` | ID o secreto mal en Coolify | Revisar variables y redeploy |
| «Google no configurado» | Faltan `AUTH_GOOGLE_*` | Definir ambas y redeploy |
| `MissingSecret` | Falta `AUTH_SECRET` o solo está en build | Añadir `AUTH_SECRET` en **runtime**, redeploy |

---

## 4. Rotar credenciales

Si el secreto se expuso (chat, commit, etc.):

1. Google Cloud → Credenciales → tu cliente OAuth → **Restablecer secreto**
2. Actualizar `AUTH_GOOGLE_SECRET` en Coolify
3. Redeploy

---

## 5. Referencia en código

- Provider: `src/auth.ts` (solo `Google`)
- UI login: `src/app/login/LoginClient.tsx`
- Comprobación env: `src/lib/google-auth.ts`
