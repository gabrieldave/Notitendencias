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
| `NEXT_PUBLIC_APP_URL` | **Sí** | URL pública del sitio (producción: `https://notitendencias.iareal.net`; metadata, enlaces). |
| `PORT` | Recomendada | **`3015`** en producción (Coolify debe exponer este puerto del contenedor). |
| `ADMIN_PASSWORD` | **Sí** | Contraseña del panel `/admin` (cookie httpOnly). Usa una contraseña fuerte única. |
| `AUTH_SECRET` | **Sí** | Secreto de Auth.js / NextAuth (sesiones y tokens). Generar: `openssl rand -base64 32`. |
| `AUTH_URL` | **Sí** en producción | URL pública canónica del sitio (igual que `NEXT_PUBLIC_APP_URL` si aplica). |
| `AUTH_TRUST_HOST` | Solo prod tras proxy | `true` cuando la app está detrás de reverse proxy (Coolify) para validar host/proxy headers. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Opcional | OAuth Google en `/login`. Si faltan, solo queda el enlace mágico. |
| `WEBHOOK_URL` / `APP_ID` | **Sí** para magic link | `POST` JSON al enviar enlace mágico (sin SMTP en Next). Ver sección **Autenticación** abajo. |
| `AUTH_EMAIL_FROM` | Recomendada | Remitente lógico del flujo email (metadatos). |
| `ADMIN_EMAILS` | No | Lista separada por comas: esos correos reciben `role=admin` en BD al iniciar sesión. El panel `/admin` sigue pudiendo usar la cookie de `ADMIN_PASSWORD`; las acciones sensibles también aceptan rol admin vía sesión + comprobación en BD. |
| `N8N_API_KEY` | No | Solo para `npm run n8n:sync-x-radar` en tu máquina/CI (sincronizar workflow X). **No** en el contenedor Next. |
| `N8N_BASE_URL` | No | Por defecto `https://n8n.vibesystems.tech`. |
| `USAGE_API_KEY` | **Sí** para registrar consumo desde n8n | Bearer para `POST /api/admin/usage/runs`. Generar con `openssl rand -hex 32`. Misma clave en Coolify y en n8n (credencial **Notitendencias Usage**). **No** exponer en el frontend. |
| `NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK` | No | Payment Link público (Stripe). Botón “Suscribirme” y pricing. |
| `STRIPE_WEBHOOK_SECRET` | **Sí** para premium automático | Signing secret del webhook Stripe → `POST /api/webhooks/stripe`, evento `checkout.session.completed`. |
| `STRIPE_SECRET_KEY` | Recomendada | `sk_live_…` / `sk_test_…` (misma cuenta que el Payment Link): validar `price_*` y adjuntar `priceIds` al aviso n8n. |
| `STRIPE_PREMIUM_PRICE_IDS` | Recomendada | `price_xxx` del Payment Link (Dashboard Stripe). Lista separada por comas. |
| `N8N_PAYMENT_WEBHOOK_URL` | No | URL del nodo **Webhook** en n8n; Next envía JSON tras cada pago (véase **Stripe (Payment Link), premium y n8n**). |
| `N8N_PAYMENT_WEBHOOK_SECRET` | No | Opcional: Bearer compartido; Next envía `Authorization: Bearer …`. |

**Build en Docker:** el `Dockerfile` pasa `DATABASE_URL` y `NEXT_PUBLIC_APP_URL` como build args; en Coolify define también esas variables en “Build arguments” si el build las necesita, además del runtime.

## Autenticación (usuarios)

La web usa **Auth.js (NextAuth v5)** con sesión en **PostgreSQL** (tablas `sessions`, `accounts`, `verification_tokens`) y adapter Drizzle. Duración de sesión: **90 días**.

- **Google** (opcional en `/login`): define `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en runtime (`.env` local o variables del contenedor en Coolify). Sin ambas, solo aparece el enlace mágico y el aviso «Google no configurado».

  1. En [Google Cloud Console](https://console.cloud.google.com/) → APIs y servicios → Credenciales → **Crear credenciales** → ID de cliente OAuth → tipo **Aplicación web**.
  2. **URIs de redirección autorizados** (sustituye el dominio si aplica):
     - Desarrollo: `http://localhost:3015/api/auth/callback/google`
     - Producción: `https://notitendencias.iareal.net/api/auth/callback/google` (mismo host que `AUTH_URL` / `NEXT_PUBLIC_APP_URL`)
  3. Copia **ID de cliente** → `AUTH_GOOGLE_ID` y **Secreto del cliente** → `AUTH_GOOGLE_SECRET`.
  4. En producción, configura también `AUTH_SECRET`, `AUTH_URL` y `AUTH_TRUST_HOST=true` tras el proxy.
- **Enlace mágico (email)**: el token de verificación caduca a los **30 minutos**. Al solicitar el enlace, la app hace `POST` a `WEBHOOK_URL` con JSON:

  `{ "appId": "<APP_ID>", "event": "auth.magic_link", "to": "<email>", "data": { "name": "...", "verificationUrl": "...", "logoUrl": "..." } }`

  No se usa SMTP dentro de Next. En producción no se registran URLs completas de verificación ni tokens en logs.

- **Límite de frecuencia (magic link)**: en memoria por proceso — aprox. **12 solicitudes / 15 min** por IP y **5 / 15 min** por correo (ajustable en código). En varias réplicas usar Redis u otro almacén compartido.

- **Turnstile u otro CAPTCHA** en el formulario de email: opcional; no está cableado por defecto (mejora futura).

- **Deprecado**: `USER_SESSION_SECRET` / cookie MVP antigua; sustituido por `AUTH_SECRET` y sesión Auth.js.

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

## App instalable (PWA)

En **HTTPS** (producción), el sitio se puede añadir al inicio del celular como app:

- **Android / Chrome:** menú del navegador → «Instalar app», o el banner «Instalar Notitendencias» si aparece.
- **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio».

La app abre en `/ia` a pantalla completa. Archivos: `src/app/manifest.ts`, `public/sw.js`, iconos `public/pwa/`. El `Dockerfile` y Nixpacks copian `public/` al contenedor standalone (incluye `sw.js`).

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
| `npm run n8n:sync-x-radar` | Sincroniza nodos Code del workflow X AI Radar en n8n |

## API (resumen)

- `POST /api/bridge/ingest` — Bearer `BRIDGE_API_KEY`, body validado con Zod.
- `GET /api/raw-items?status=` — admin (cookie).
- `POST /api/process/[id]` — admin; DeepSeek → tabla `trends` (estado `pending`).
- `POST /api/trends/[uuid]/publish` — admin; publica y registra `app_events`.
- `POST /api/trends/[uuid]/reject` — admin.
- `GET /api/trends` — público; `?category_slug=ia`.
- `GET /api/trends/[slug]` — público por **slug** (no por UUID).
- `POST /api/newsletter/subscribe` — alta en `subscribers`.
- `GET/POST /api/auth/[...nextauth]` — Auth.js (sesión, OAuth Google, magic link).
- `POST /api/admin/login` | `logout` | `import` — panel.
- `POST /api/admin/usage/runs` — Bearer `USAGE_API_KEY` (n8n) o admin; registra una corrida del radar X.
- `GET /api/admin/usage/summary` | `runs` | `PATCH .../settings` — solo admin (cookie/sesión).

> Rutas internas de publicación usan el **UUID** de la tendencia:  
> `POST /api/trends/<UUID>/publish` y `POST /api/trends/<UUID>/reject`.  
> El detalle JSON público por slug es `GET /api/trends/<slug>`.

## Curl de prueba (ingest)

```bash
curl -X POST "https://notitendencias.iareal.net/api/bridge/ingest" \
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
  - hostname: notitendencias.iareal.net
    service: http://127.0.0.1:3015
  # ... otras apps ...
  - service: http_status:404
```

Ajusta `hostname` si tu túnel o DNS usan otro FQDN; debe coincidir con `NEXT_PUBLIC_APP_URL` / `AUTH_URL`.

Aplicar cambios:

```bash
sudo systemctl restart cloudflared
```

Si falta el registro DNS del túnel, usa tu tunnel ID y hostname reales, por ejemplo:

```bash
cloudflared tunnel route dns <TU_TUNNEL_ID> notitendencias.iareal.net
```

## X API Radar

Radar de señales de IA desde la **API oficial de X**, orquestado por **n8n**. No publica en la web: cada hallazgo llega a `POST /api/bridge/ingest` como `raw_trend_items` con `status=new` para revisión en `/admin`, procesamiento con DeepSeek y publicación manual.

| Paso | Acción |
|------|--------|
| 1 | Crear app y **Bearer Token** en [X Developer Portal](https://developer.x.com/) (permisos de lectura acordes a tu plan). |
| 2 | En **n8n**, definir `X_BEARER_TOKEN`, `BRIDGE_API_KEY`, `NOTITENDENCIAS_INGEST_URL` (ver `.env.example`). **No** poner el token de X en Next.js. |
| 3 | Importar o crear el workflow **Notitendencias - X AI Radar** según [`docs/n8n-x-ai-radar-workflow.md`](docs/n8n-x-ai-radar-workflow.md). |
| 4 | Probar con ~5 posts (límite bajo en el workflow) o con el curl de [`docs/x-api-radar.md`](docs/x-api-radar.md). |
| 5 | Revisar en `/admin` (badge **X** si `metadata.platform === "x"`), pulsar **Procesar** (DeepSeek), luego publicar manualmente. |

Documentación completa: [`docs/x-api-radar.md`](docs/x-api-radar.md) (estrategia, payload, filtrado) y [`docs/n8n-x-ai-radar-workflow.md`](docs/n8n-x-ai-radar-workflow.md) (nodos y código de ejemplo).

## Panel de consumo X API

Panel admin en **`/admin/usage`** (enlace **Consumo** en la navegación admin). Muestra **gasto estimado** en USD según tarifas configurables en base de datos — no es la factura real de X.

| Paso | Acción |
|------|--------|
| 1 | En Coolify (o `.env`), definir `USAGE_API_KEY` (`openssl rand -hex 32`). |
| 2 | En n8n, credencial **Notitendencias Usage**: header `Authorization: Bearer <USAGE_API_KEY>`. |
| 3 | Al final de cada corrida del workflow X AI Radar, el nodo **POST usage run** envía métricas a `POST /api/admin/usage/runs`. |
| 4 | En `/admin/usage`, revisar gasto hoy/mes, % del presupuesto, últimas corridas y alertas. |
| 5 | Ajustar presupuesto mensual, saldo prepago y costo por post leído en el formulario del panel. |
| 6 | Verificar el **balance real** en el [portal de desarrollador de X](https://developer.x.com/) — la estimación interna puede desviarse. |

El costo por corrida se calcula como `posts_received × post_read_cost_usd` (valor editable). La proyección mensual usa el promedio de los últimos 7 días × 30.

## Stripe (Payment Link), premium y n8n

1. **Payment Link** en Stripe: es una página de cobro que igual genera **Checkout Sessions**. Tu app **no** necesita crear la sesión por API para cobrar.
2. **`price_…`**: el Payment Link está ligado a un precio en Stripe. Copia ese **Price ID** y ponlo en **`STRIPE_PREMIUM_PRICE_IDS`** (y **`STRIPE_SECRET_KEY`** de la misma cuenta). Así solo ese producto activa `premium` en BD.
3. **Webhook Stripe → Next**: en Dashboard → Webhooks, endpoint **`POST /api/webhooks/stripe`** en tu URL pública de Notitendencias, evento **`checkout.session.completed`**, secreto → **`STRIPE_WEBHOOK_SECRET`**.
4. **Después de procesar el pago**, Next puede **avisar a n8n** con un `POST` JSON al **`N8N_PAYMENT_WEBHOOK_URL`** (workflow con nodo **Webhook**). Cuerpo alineado con tu gateway:

```json
{
  "appId": "notitendencias",
  "event": "radar.payment_checkout",
  "data": {
    "premiumActivated": true,
    "userId": "uuid-o-null",
    "fulfillReason": "opcional, ej. user_not_found",
    "fulfillMatch": "client_reference_id",
    "stripeSessionId": "cs_…",
    "stripeMode": "payment",
    "customerEmail": "correo@…",
    "clientReferenceId": "uuid-si-vino-del-pricing-logueado",
    "amountTotal": 500,
    "currency": "usd",
    "priceIds": ["price_…"]
  }
}
```

En n8n: **IF** `premiumActivated` → correo al comprador y/o al admin; **IF** `fulfillReason` es `user_not_found` o `client_ref_user_not_found` → alerta para revisión manual.

## n8n y Kimi

- Workflows n8n: [`docs/n8n-workflows.md`](docs/n8n-workflows.md) y radar X: [`docs/n8n-x-ai-radar-workflow.md`](docs/n8n-x-ai-radar-workflow.md).
- Prompt sugerido para Kimi WebBridge: [`docs/kimi-webbridge-prompt.md`](docs/kimi-webbridge-prompt.md).

## Infraestructura (alineación)

Tu documento de infraestructura coincide con esta app: **PostgreSQL 17** en Docker, usuario `cursor`, **una base por app** (`notitendencias`), sin usar la base `postgres`, y **Drizzle + postgres-js sin `?schema=public`**. Cada app en su propio puerto; Notitendencias usa **3015**.

## Licencia

Privado / uso interno.
