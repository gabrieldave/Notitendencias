# Deploy en Coolify (Notitendencias)

## Fallo en `nix-env` / `unpacking nixpkgs` (Nixpacks)

Si el log se corta así (sin llegar a `npm run build`):

```
#8 RUN nix-env -if .nixpacks/nixpkgs-....nix
unpacking 'https://github.com/NixOS/nixpkgs/archive/...'
Deployment failed.
```

**Causa habitual:** el servidor de build se queda sin RAM/disco o hace timeout descargando Nix (Nixpacks es pesado). No es un error de tu app.

**Solución (recomendada):**

1. Coolify → tu servicio → **Configuration** → **Build Pack** → **Dockerfile** (no Nixpacks).
2. **Dockerfile location:** `/Dockerfile` (raíz del repo).
3. **Puerto:** `3015`.
4. En **Environment**, **quita** `NIXPACKS_NODE_VERSION=22` si la tienes (Coolify fuerza Node 22.11 y choca con el proyecto; el Dockerfile usa **22.14**).
5. **Redeploy**.

Tras el deploy, ejecuta migraciones si hay nuevas (`drizzle/0006_stripe_customer.sql`, etc.):

```bash
# en el contenedor o con DATABASE_URL apuntando a prod
npm run db:migrate
```

## Fallo en `next build` (sin mensaje claro)

Suele ser **falta de RAM** en el contenedor de build o **Node 22.11** (algunas deps piden ≥ 22.13).

### Opción A — Dockerfile (recomendado)

1. Coolify → tu servicio → **Build Pack** → **Dockerfile**
2. Dockerfile en la raíz del repo (multi-stage, `standalone`)
3. **Puerto** de la app: `3015`
4. Variables de runtime: `DATABASE_URL`, `AUTH_*`, `NEXT_PUBLIC_APP_URL`, etc.

### Opción B — Nixpacks

1. En **Environment** del build, **no** fuerces `NIXPACKS_NODE_VERSION=22` (instala 22.11).
2. Usa `22.14` o deja que lea `nixpacks.toml` / `.node-version`.
3. RAM del servidor de build: **≥ 4 GB** libres para `next build`.
4. `NODE_OPTIONS=--max-old-space-size=4096` ya está en `nixpacks.toml`.

### Error 502 (Cloudflare / Bad Gateway)

Significa que **no hay app escuchando** detrás del proxy (contenedor caído, build fallido o puerto mal mapeado).

1. En Coolify → **Logs** del contenedor: busca `Error`, `Killed`, `EADDRINUSE`, `DATABASE_URL`.
2. **Puerto interno** del servicio: **3015** (no 3000).
3. Health check: `GET /api/health` → debe devolver `{"ok":true}`.
4. Variables mínimas en runtime: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST=true`.
5. Redeploy con **Dockerfile** tras el commit que incluye `HOSTNAME=0.0.0.0`.

### Subir o cambiar el precio de AI Radar

1. **Stripe** → Productos → tu producto AI Radar → **Añadir precio** (ej. 7 USD/mes). En Stripe no se edita el monto de un `price_` viejo; se crea uno nuevo.
2. **Payment Link** → edita el enlace o crea uno nuevo con el **precio nuevo** activo.
3. **Coolify** (redeploy):
   - `NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK` = URL del Payment Link
   - `STRIPE_PREMIUM_PRICE_IDS` = `price_xxx` del precio nuevo (coma si hay varios)
   - `NEXT_PUBLIC_RADAR_PRICE_USD` / `NEXT_PUBLIC_RADAR_PRICE_MXN_HINT` = lo que muestra la web
4. Los clientes que ya pagan al precio anterior siguen en su suscripción hasta que migres en Stripe.

### App instalable (PWA)

Tras deploy en **HTTPS**, los usuarios pueden:

- **Android / Chrome:** menú → “Instalar app” o el banner “Instalar Notitendencias”.
- **iPhone (Safari):** Compartir → “Añadir a pantalla de inicio”.

Archivos: `src/app/manifest.ts`, `public/sw.js`, iconos en `public/pwa/`. La app abre en `/ia` a pantalla completa (`display: standalone`).

### Tras deploy OK

- `https://notitendencias.iareal.net/api/health` → `ok: true`
- `https://notitendencias.iareal.net/api/me` → JSON de sesión
- Re-login tras cambios de auth (JWT)
