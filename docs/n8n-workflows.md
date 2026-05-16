# n8n y Notitendencias

## Estado actual (2026)

Los workflows de **notificaciones** creados antes (`Published Trend`, `High Score Alert`, `Newsletter Subscribe`, `Daily Digest`) fueron **archivados** en n8n. Ya no forman parte del flujo editorial.

**Workflows activos en el roadmap:**

| Workflow | ID | URL |
|----------|-----|-----|
| **Notitendencias - X AI Radar** | `nFBNa3Y1ueVHBLbc` | https://n8n.vibesystems.tech/workflow/nFBNa3Y1ueVHBLbc |
| **Notitendencias - Stripe payment (Next)** | `kGibmI6jvH0pdHeQ` | https://n8n.vibesystems.tech/workflow/kGibmI6jvH0pdHeQ |

Flujo radar: **X API → n8n → `POST /api/bridge/ingest` → `/admin` → DeepSeek → publicación manual**.

Flujo pagos: tras **`checkout.session.completed`**, Next avisa a n8n (`N8N_PAYMENT_WEBHOOK_URL`). **Production webhook:** `POST https://n8n.vibesystems.tech/webhook/notitendencias-stripe-payment` — ramifica por `premiumActivated` y alerta si `fulfillReason` es `user_not_found` **o** `client_ref_user_not_found`. Los nodos finales son **No Op** para que enganches Gmail/Slack.

Documentación:

- [`docs/x-api-radar.md`](./x-api-radar.md) — estrategia, payload, filtrado, costos
- [`docs/n8n-x-ai-radar-workflow.md`](./n8n-x-ai-radar-workflow.md) — nodos, variables, pruebas

## Scripts del repo

| Comando | Uso |
|---------|-----|
| `npm run n8n:sync-x-radar` | Sincroniza nodos Code del radar X vía API n8n (requiere `N8N_API_KEY`) |
| ~~`npm run n8n:push`~~ | **Eliminado** — creaba los 4 webhooks archivados |

Definición del workflow en código: `scripts/n8n-x-ai-radar-workflow.sdk.ts`.

## Variables de la app (deprecadas)

Estas variables **ya no se usan** en la app (sin llamadas a webhooks n8n al publicar o suscribirse). Puedes dejarlas vacías en Coolify:

- `N8N_WEBHOOK_PUBLISHED_TREND`
- `N8N_WEBHOOK_NEWSLETTER`
- `N8N_WEBHOOK_ALERTS`

## Variables solo en n8n

Configurar en **Settings → Variables** de n8n (no en el frontend de Next):

- `X_BEARER_TOKEN`
- `BRIDGE_API_KEY` (mismo valor que en la app)
- `NOTITENDENCIAS_INGEST_URL` = `https://notitendencias.iareal.net/api/bridge/ingest`
- `X_API_MAX_POSTS_PER_RUN` = `50` (beta: el workflow limita a 10 por query)

## Workflows archivados (referencia)

No reactivar salvo que quieras volver al modelo de notificaciones:

| Nombre | ID |
|--------|-----|
| Notitendencias - Published Trend Event | `QBOBRDYIZ7EP6Gby` |
| Notitendencias - High Score Alert | `AhlNefqAPGsIm3r5` |
| Notitendencias - Newsletter Subscribe | `m3DUwqMVxQNYHWDJ` |
| Notitendencias - Daily Digest | `ZLOlwvyzLy6dTZ6K` |
