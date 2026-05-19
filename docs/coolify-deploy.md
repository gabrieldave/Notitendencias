# Deploy en Coolify (Notitendencias)

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

### Tras deploy

- `https://notitendencias.iareal.net/api/me` → debe responder JSON (sesión).
- Re-login tras cambios de auth (JWT).
