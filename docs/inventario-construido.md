# Inventario construido — Notitendencias

Documento de referencia del estado actual del repositorio (mayo 2026). Describe qué está implementado, no el roadmap.

---

## Resumen

**Notitendencias** es una plataforma de tendencias digitales (primera vertical: **IA**). El flujo principal:

1. **Ingesta** de hallazgos (Kimi WebBridge u otros) → `raw_trend_items`
2. **Procesamiento** con DeepSeek en el panel admin → `trends` (borrador / pendiente)
3. **Revisión y publicación** en `/admin` → web pública (ingesta vía n8n X AI Radar)

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, postgres.js, Zod, Auth.js v5 (NextAuth beta). Puerto de desarrollo y producción: **3015**.

---

## Infraestructura y despliegue

| Aspecto | Detalle |
|---------|---------|
| Base de datos | PostgreSQL 17 (Docker), usuario `cursor`, base dedicada `notitendencias` |
| ORM | Drizzle + `postgres` (sin `?schema=public` en `DATABASE_URL`) |
| Contenedor | `Dockerfile` multi-stage **Alpine** (`node:22-alpine`): deps → builder → runner |
| Salida Next | `output: "standalone"` → imagen final ejecuta `node server.js` |
| Puerto | `3015` (`EXPOSE` + `PORT` en runner) |
| Deploy típico | Coolify (Dockerfile) + Cloudflare Tunnel al host local |
| Setup inicial | `npm run setup` (= verificar env + `db:migrate` + `db:seed`) |

Scripts útiles: `dev`, `build`, `start`, `db:generate`, `db:migrate`, `db:seed`, `setup`, `n8n:sync-x-radar`, `cleanup:retention`.

---

## Base de datos (Drizzle)

### Migraciones

| Archivo | Contenido |
|---------|-----------|
| `drizzle/0000_initial.sql` | Tablas núcleo del producto |
| `drizzle/0001_membership.sql` | Usuarios, preferencias, favoritos |
| `drizzle/0002_nextauth.sql` | Cuentas OAuth, sesiones, tokens de verificación (Auth.js) |

### Tablas de producto

| Tabla | Uso |
|-------|-----|
| `categories` | Categorías editoriales (`slug`, nombre, descripción) |
| `sources` | Fuentes de señal (bridge, agregadores, redes…) |
| `raw_trend_items` | Hallazgos sin procesar (`status`: new, error, requires_review, processed…) |
| `trends` | Artículos editoriales generados/publicados (`slug` único, `trend_score`, estados draft/pending/published/rejected…) |
| `subscribers` | Emails del newsletter (`plan` free por defecto) |
| `newsletter_sends` | Envíos de newsletter (estructura preparada) |
| `app_events` | Log de eventos de aplicación (ej. `trend.published`) |

### Tablas de usuarios y Auth.js

| Tabla | Uso |
|-------|-----|
| `users` | Perfil: `email`, `name`, `role` (user/admin), `plan` (free/premium), `status`, `emailVerified`, `image` |
| `accounts` | Cuentas vinculadas (Google, email) — adapter Drizzle |
| `sessions` | Sesiones en BD (estrategia **database**, 90 días) |
| `verification_tokens` | Magic link (caducidad 30 min en provider) |
| `user_preferences` | Categorías favoritas, frecuencia de digest |
| `user_favorites` | Tendencias guardadas (único por usuario+tendencia) |

### Seed (`src/db/seed.ts`)

- **6 categorías:** ia, tecnologia, dinero, creadores, entretenimiento, negocios  
- **7 fuentes:** Kimi WebBridge, Hacker News, X, Reddit, Google Trends, Product Hunt, Blog Oficial  

---

## Autenticación (Auth.js v5)

**No** se usa la cookie MVP antigua (`USER_SESSION_SECRET`). Sesión moderna con:

- **Adapter:** `@auth/drizzle-adapter` sobre tablas anteriores  
- **Estrategia:** sesión en PostgreSQL, `maxAge` 90 días  
- **Proveedores:**
  - **Google OAuth** si existen `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`
  - **Magic link (email)** siempre disponible; envío vía **webhook** (`WEBHOOK_URL` + `APP_ID`), no SMTP en Next  
- **Rate limit** magic link: en memoria (~12 req/15 min por IP, ~5 por email) — `src/lib/auth-rate-limit.ts`  
- **Páginas custom:** `/login`, `/auth/verify-request`, `/auth/error`  
- **Rol admin por email:** `ADMIN_EMAILS` (lista separada por comas) asigna `role=admin` en BD al iniciar sesión  
- **Variables clave:** `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST` (detrás de proxy), `AUTH_EMAIL_FROM`  

Ruta catch-all: `GET/POST /api/auth/[...nextauth]`.

### Middleware (`src/middleware.ts`)

Protege con matcher:

| Ruta | Regla |
|------|--------|
| `/admin/*` (excepto `/admin/login`) | Cookie `notitendencias_admin` derivada de `ADMIN_PASSWORD` |
| `/mi-radar/*` | Usuario autenticado (sesión Auth.js) |

---

## Panel admin (cookie + BD)

### Acceso

1. **Cookie de panel:** `POST /api/admin/login` con `ADMIN_PASSWORD` → cookie httpOnly `notitendencias_admin` (HMAC SHA-256)  
2. **Rol admin en BD:** usuarios en `ADMIN_EMAILS` pueden usar acciones que llaman `isElevatedAdmin()` (cookie **o** sesión con `role=admin`)  

> Las rutas API de operaciones (`/api/process`, `/api/raw-items`, publish/reject, import) exigen **solo la cookie admin**, no la sesión OAuth.

### Páginas

| Ruta | Función |
|------|---------|
| `/admin/login` | Formulario de contraseña del panel |
| `/admin` | Cola de `raw_trend_items` (new/error/requires_review) y `trends` (draft/pending); procesar y publicar |
| `/admin/import` | Importación CSV de hallazgos |
| `/admin/settings` | Estado de variables (fingerprints, máscaras) |
| `/admin/users` | Listado de usuarios; cambio manual de plan (beta, sin pasarela) |
| `/admin/preview/[slug]` | Vista previa editorial antes de publicar |

### APIs admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/login` | Establece cookie admin |
| POST | `/api/admin/logout` | Elimina cookie admin |
| POST | `/api/admin/import` | Import CSV (cookie) |
| GET | `/api/raw-items?status=` | Lista items crudos (cookie) |
| POST | `/api/process/[uuid]` | DeepSeek → crea/actualiza `trends` (cookie) |
| POST | `/api/trends/[uuid]/publish` | Publica tendencia; `app_events` (cookie) |
| POST | `/api/trends/[uuid]/reject` | Rechaza tendencia (cookie) |

Publicación incluye guardrail editorial **arXiv** (`confirmEditorialArxiv` en JSON si el contenido lo menciona).

---

## Web pública (App Router)

### Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Home editorial: hero, tendencias publicadas, bloques IA/momentum, newsletter, pricing |
| `/ia` | Landing / feed centrado en categoría IA |
| `/categoria/[slug]` | Listado por categoría (slugs públicos en `PUBLIC_CATEGORY_SLUGS`) |
| `/tendencia/[slug]` | Detalle de tendencia publicada |
| `/login` | Inicio de sesión (Google + magic link) |
| `/mi-radar` | Favoritos del usuario (**Premium**); requiere login |
| `/auth/verify-request` | Mensaje tras solicitar magic link |
| `/auth/error` | Errores de autenticación |

Categorías con página pública: `ia`, `tecnologia`, `dinero`, `creadores`, `entretenimiento`, `negocios`.

### Membresía y paywall (lógica, sin Stripe)

| Plan | Comportamiento implementado |
|------|----------------------------|
| `free` / anónimo | Resumen truncado (`FREE_SUMMARY_MAX_CHARS` = 220), preview de secciones premium (`FREE_SECTION_PREVIEW_CHARS` = 140) |
| `premium` | Contenido completo en detalle; **Mi radar** (favoritos) habilitado |

El plan se asigna manualmente en `/admin/users` durante la beta.

### APIs públicas y de usuario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/trends` | No | Listado publicadas; `?category_slug=` |
| GET | `/api/trends/[slug]` | No | Detalle por **slug** (no UUID) |
| POST | `/api/newsletter/subscribe` | No | Alta en `subscribers` |
| POST | `/api/bridge/ingest` | Bearer `BRIDGE_API_KEY` | Ingesta Zod-validada desde bridge |
| GET | `/api/favorites` | Sesión | Lista favoritos del usuario |
| POST | `/api/favorites` | Sesión | Añade favorito |
| DELETE | `/api/favorites/[trendId]` | Sesión | Quita favorito |

---

## Ingesta y procesamiento IA

### Bridge (`POST /api/bridge/ingest`)

- Header: `Authorization: Bearer <BRIDGE_API_KEY>`
- Body validado con Zod (`src/lib/schemas.ts`)
- Campos típicos: `category`, `source_name`, `source_url`, `title`, `raw_text` (máx. 20 000 chars), `detected_at`, `metadata`
- Inserta en `raw_trend_items` con `status=new`

### DeepSeek (`POST /api/process/[id]`)

- Requiere `DEEPSEEK_API_KEY`
- Lee raw item, llama a `src/lib/deepseek.ts`, genera slug, summary, ideas, tags, `trend_score`, etc.
- Crea fila en `trends` (estado `pending` / flujo de revisión)

Documentación operativa: `docs/kimi-webbridge-prompt.md`.

---

## Integración n8n

### Workflow activo: X AI Radar

| Workflow | ID | URL |
|----------|-----|-----|
| **Notitendencias - X AI Radar** | `nFBNa3Y1ueVHBLbc` | https://n8n.vibesystems.tech/workflow/nFBNa3Y1ueVHBLbc |

Flujo: X API → n8n → `POST /api/bridge/ingest` → `raw_trend_items` (`status=new`) → `/admin` → DeepSeek → publicación manual.

Documentación: `docs/x-api-radar.md`, `docs/n8n-x-ai-radar-workflow.md`. Sincronizar nodos Code: `npm run n8n:sync-x-radar` (requiere `N8N_API_KEY`).

### Workflows archivados (notificaciones, ya no usados)

| Nombre | ID |
|--------|-----|
| Published Trend Event | `QBOBRDYIZ7EP6Gby` |
| High Score Alert | `AhlNefqAPGsIm3r5` |
| Newsletter Subscribe | `m3DUwqMVxQNYHWDJ` |
| Daily Digest | `ZLOlwvyzLy6dTZ6K` |

La app **ya no llama** a webhooks `N8N_WEBHOOK_*` al publicar ni al suscribirse. Ver `docs/n8n-workflows.md`.

---

## Componentes UI principales

`Header`, `SiteFooter`, `CategoryNav`, `HeroSection`, variantes de `TrendCard` (compact, large, horizontal), `TrendDetailArticle`, `TrendSaveButton`, `NewsletterBox`, `PricingSection`, `PremiumBanner`, `MostViewedSidebar`, `QuickSignalCard`, `EditorialComingSoon`, tablas y formularios admin (`AdminRawItemTable`, `AdminTrendTable`, `CSVImportForm`, `AdminPreviewToolbar`, etc.).

Estilo: Tailwind con tokens de marca (`brand-navy`, `brand-orange`).

---

## Otros módulos de librería

| Módulo | Rol |
|--------|-----|
| `src/lib/slug.ts` | Slugs únicos para tendencias |
| `src/lib/csv.ts` | Parseo importación admin |
| `src/lib/editorial.ts` | Reglas editoriales (arXiv) |
| `src/lib/magic-link-webhook.ts` | Payload al webhook de email |
| `src/lib/session-user.ts` | Usuario opcional/requerido en server components |
| `scripts/setup.ts` | Comprobación de env + migrate + seed |
| `scripts/cleanup-retention.ts` | Retención de datos (`docs/data-retention.md`) |

---

## Variables de entorno (referencia rápida)

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `DATABASE_URL` | Sí | Postgres |
| `BRIDGE_API_KEY` | Sí (ingesta) | Bearer bridge |
| `DEEPSEEK_API_KEY` | Sí (procesar) | IA en admin |
| `NEXT_PUBLIC_APP_URL` | Sí | URLs públicas |
| `ADMIN_PASSWORD` | Sí | Cookie panel `/admin` |
| `AUTH_SECRET` | Sí | Auth.js |
| `AUTH_URL` | Sí (prod) | URL canónica |
| `AUTH_TRUST_HOST` | Proxy | `true` en Coolify |
| `AUTH_GOOGLE_*` | Opcional | OAuth Google |
| `WEBHOOK_URL`, `APP_ID` | Magic link | Envío de correo vía n8n/externo |
| `ADMIN_EMAILS` | Opcional | Rol admin en BD |
| `N8N_API_KEY` | Solo `n8n:sync-x-radar` | Sincronizar workflow X en n8n (no en contenedor app) |
| Variables X en n8n | Solo n8n | `X_BEARER_TOKEN`, `BRIDGE_API_KEY`, `NOTITENDENCIAS_INGEST_URL` |

Copia base: `.env.example`.

---

## Lo que **no** está en este inventario (fuera de alcance actual)

- Pasarela de pago (Stripe, etc.) — plan Premium manual  
- CAPTCHA / Turnstile en login (mencionado como mejora futura en README)  
- Rate limit compartido entre réplicas (Redis) — hoy en memoria por proceso  
- Envío real de newsletter desde la app (tablas + n8n preparados)  

---

*Generado para el repositorio Notitendencias. Actualizar cuando cambien rutas, schema o auth.*
