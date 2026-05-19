# Deploy en Coolify (Notitendencias)

## Build Pack: Nixpacks (recomendado)

1. Coolify → servicio → **Configuration** → **Build Pack** → **Nixpacks**.
2. **Puerto** del proxy: **3015** (no 3000).
3. **Environment** → para cada variable crítica, activa **Available at Buildtime** y **Available at Runtime**:
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
   - `AUTH_URL` = `https://notitendencias.iareal.net`
   - `AUTH_TRUST_HOST` = `true`
   - `NEXT_PUBLIC_APP_URL` = misma URL pública
   - `DATABASE_URL`
4. **No** definas `NIXPACKS_NODE_VERSION=22` suelta en Coolify (fuerza Node 22.11). Usa `22.14` o deja que lea `nixpacks.toml` / `.node-version`.
5. **Redeploy** completo (no solo restart) tras cambiar auth o build pack.

El repo incluye `nixpacks.toml`: build `standalone`, copia `public` + `.next/static`, arranque con `scripts/start-standalone.sh`.

### Login / error `Configuration` en Google OAuth

Si `/api/health` muestra `auth.ready: true` pero el login falla:

1. Confirma que el deploy incluye el último commit (factory async de NextAuth).
2. En health debe aparecer `googleProviderCount: 1`. Si es `0`, las variables Google no llegaron al **runtime** del contenedor (o el bundle es viejo).
3. `AUTH_TRUST_HOST=true` en runtime.
4. Google Cloud → URI de redirección: `https://notitendencias.iareal.net/api/auth/callback/google`.

### Fallo en `nix-env` / `unpacking nixpkgs`

```
#8 RUN nix-env -if .nixpacks/nixpkgs-....nix
unpacking 'https://github.com/NixOS/nixpkgs/archive/...'
Deployment failed.
```

**Causa:** RAM/disco insuficiente o timeout descargando Nix.

**Opciones:**

- Aumentar RAM del servidor de build (≥ 4 GB libres para `next build`).
- Cambiar temporalmente a **Dockerfile** (ver abajo).
- Reintentar deploy en horario de menor carga.

## Build Pack: Dockerfile (alternativa)

Si Nixpacks falla en el servidor:

1. **Build Pack** → **Dockerfile**, ruta `/Dockerfile`.
2. Puerto **3015**, mismas variables en **build y runtime** (el Dockerfile acepta `ARG` opcionales de auth para el build).
3. Redeploy.

### Error 502 (Bad Gateway)

1. Logs del contenedor: `Error`, `Killed`, `EADDRINUSE`, `DATABASE_URL`.
2. Puerto interno: **3015**.
3. `GET /api/health` → `{"ok":true}` y `auth.googleProviderCount: 1`.

### Migraciones tras deploy

```bash
npm run db:migrate
```

Contra la misma `DATABASE_URL` que usa Coolify (túnel local `127.0.0.1:5432` si aplica).

Pendientes habituales: `0004_signal_posted_at`, `0005_radar_payload`, `0006_stripe_customer`.

### Subir precio AI Radar (Stripe)

1. Stripe → producto → **nuevo precio** (no se edita un `price_` existente).
2. Coolify: `NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK`, `STRIPE_PREMIUM_PRICE_IDS`, hints de precio en UI.
3. Redeploy.

### Tras deploy OK

- `https://notitendencias.iareal.net/api/health` → `ok: true`, `auth.googleProviderCount: 1`
- `https://notitendencias.iareal.net/login` → inicio con Google
- Re-login tras cambios de auth
