# Notitendencias

Plataforma de **tendencias digitales** (primera categoría: **IA**). Recibe hallazgos desde Kimi WebBridge, los guarda en PostgreSQL, permite procesarlos con DeepSeek, revisarlos en `/admin` y publicarlos en la web pública.

Stack: **Next.js 15** (App Router), **TypeScript**, **Tailwind**, **Drizzle ORM**, **postgres.js**, **Zod**. Puerto de producción: **3015**. Imagen Docker multi-stage **Alpine**, salida **standalone** para menor RAM.

## Variables de entorno

Copia `.env.example` a `.env` (o usa el `.env` local si ya existe) y ajusta.

### Tabla para Coolify (y cualquier deploy)

| Variable | ¿Obligatoria? | Qué es |
|----------|---------------|--------|
| `DATABASE_URL` | **Sí** | Postgres de la app. Forma: `postgresql://USUARIO:PASSWORD@HOST:5432/notitendencias` **sin** `?schema=public`. En Docker/Coolify, `HOST` suele ser el nombre del contenedor (ej. `ys0ocwcwgso8co0ooko8gc4w`). |
| `BRIDGE_API_KEY` | **Sí** | Secreto largo para el header `Authorization: Bearer …` en `POST /api/bridge/ingest`. Generar con `openssl rand -hex 32` y **la misma clave** en Kimi / scripts que ingieran datos. |
| `DEEPSEEK_API_KEY` | **Sí** para procesar en admin | API de DeepSeek; sin ella, “Procesar” falla hasta que la configures. |
| `NEXT_PUBLIC_APP_URL` | **Sí** | URL pública del sitio, ej. `https://notitendencias.vibesystems.tech` (metadata, enlaces). |
| `PORT` | Recomendada | **`3015`** en producción (Coolify debe exponer este puerto del contenedor). |
| `ADMIN_PASSWORD` | **Sí** | Contraseña del panel `/admin` (cookie httpOnly). Usa una contraseña fuerte única. |
| `N8N_WEBHOOK_PUBLISHED_TREND` | No | URL del webhook n8n al publicar una tendencia. Vacío = no se llama. |
| `N8N_WEBHOOK_NEWSLETTER` | No | URL n8n al suscribirse al newsletter. |
| `N8N_WEBHOOK_ALERTS` | No | URL n8n si `trend_score >= 80` al publicar. |
| `N8N_API_KEY` | No | Solo para `npm run n8n:push` en tu máquina/CI, **no** hace falta en el contenedor de la app Next. |
| `N8N_BASE_URL` | No | Por defecto el script usa `https://n8n.vibesystems.tech`. |

**Build en Docker:** el `Dockerfile` pasa `DATABASE_URL` y `NEXT_PUBLIC_APP_URL` como build args; en Coolify define también esas variables en “Build arguments” si el build las necesita, además del runtime.

## Setup local / VPS

1. Crear la base en el contenedor PostgreSQL (en el VPS):

   ```bash
   chmod +x scripts/create-db.sh
   ./scripts/create-db.sh
   ```

2. En el proyecto (con `.env` cargado):

   ```bash
   npm install
   npm run setup
   ```

   Equivale a: comprobar variables → `drizzle-kit migrate` → `db:seed`.

3. Desarrollo:

   ```bash
   npm run dev
   ```

   Abre `http://localhost:3015`.

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next en puerto 3015 |
| `npm run build` | Build producción |
| `npm run start` | `next start` en `${PORT:-3015}` |
| `npm run db:generate` | Generar migraciones Drizzle |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Categorías y fuentes iniciales |
| `npm run setup` | Verificación + migrate + seed |
| `npm run n8n:push` | Crea en n8n los 4 workflows (requiere `N8N_API_KEY`) |

## API (resumen)

- `POST /api/bridge/ingest` — Bearer `BRIDGE_API_KEY`, body validado con Zod.
- `GET /api/raw-items?status=` — admin (cookie).
- `POST /api/process/[id]` — admin; DeepSeek → tabla `trends` (estado `pending`).
- `POST /api/trends/[uuid]/publish` — admin; publica, `app_events`, webhooks n8n si existen.
- `POST /api/trends/[uuid]/reject` — admin.
- `GET /api/trends` — público; `?category_slug=ia`.
- `GET /api/trends/[slug]` — público por **slug** (no por UUID).
- `POST /api/newsletter/subscribe` — email + webhook opcional.
- `POST /api/admin/login` | `logout` | `import` — panel.

> Rutas internas de publicación usan el **UUID** de la tendencia:  
> `POST /api/trends/<UUID>/publish` y `POST /api/trends/<UUID>/reject`.  
> El detalle JSON público por slug es `GET /api/trends/<slug>`.

## Curl de prueba (ingest)

```bash
curl -X POST "https://notitendencias.vibesystems.tech/api/bridge/ingest" \
  -H "Authorization: Bearer TU_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "ia",
    "source_name": "Kimi WebBridge",
    "source_url": "https://example.com",
    "title": "Nueva herramienta de IA empieza a ser tendencia",
    "raw_text": "Kimi detectó una conversación creciente sobre una herramienta de IA para automatizar navegación web.",
    "detected_at": "2026-05-14T18:00:00Z",
    "metadata": {
      "platform": "web",
      "signal_type": "trend",
      "relevance_reason": "Varias fuentes están hablando del tema"
    }
  }'
```

## Deploy en Coolify

1. Nuevo recurso **Dockerfile** apuntando a este repo.
2. Variables de entorno (pestaña Environment): las mismas que en `.env.example`.
3. Puerto interno del contenedor: **3015** (mapear al proxy de Coolify).
4. Comando de deploy sugerido (una vez, o en “Execute command”):

   ```bash
   npm run setup
   ```

   O bien migrar desde tu máquina contra la DB del túnel SSH.

5. Build: el `Dockerfile` usa `npm run build` con `output: "standalone"`. Arranque: `node server.js` con `PORT=3015`.

## Cloudflare Tunnel

En `/etc/cloudflared/config.yml`, la entrada del subdominio debe ir **antes** del catch-all `http_status:404`:

```yaml
ingress:
  - hostname: notitendencias.vibesystems.tech
    service: http://127.0.0.1:3015
  # ... otras apps ...
  - service: http_status:404
```

Aplicar cambios:

```bash
sudo systemctl restart cloudflared
```

Si falta el registro DNS del túnel:

```bash
cloudflared tunnel route dns 7b301862-56f6-4443-850b-f8df050490f6 notitendencias.vibesystems.tech
```

## n8n y Kimi

- Instrucciones y **creación automática de workflows**: [`docs/n8n-workflows.md`](docs/n8n-workflows.md) (`npm run n8n:push` con `N8N_API_KEY`).
- Prompt sugerido para Kimi WebBridge: [`docs/kimi-webbridge-prompt.md`](docs/kimi-webbridge-prompt.md).

## Infraestructura (alineación)

Tu documento de infraestructura coincide con esta app: **PostgreSQL 17** en Docker, usuario `cursor`, **una base por app** (`notitendencias`), sin usar la base `postgres`, y **Drizzle + postgres-js sin `?schema=public`**. Cada app en su propio puerto; Notitendencias usa **3015**.

## Licencia

Privado / uso interno.
