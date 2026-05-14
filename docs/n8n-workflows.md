# Workflows n8n para Notitendencias

El MCP de n8n disponible en este entorno solo permite **buscar y ejecutar** workflows existentes, no crearlos. Crea manualmente los siguientes flujos en tu instancia (`https://n8n.vibesystems.tech`) y pega las URLs de los nodos **Webhook** en las variables de entorno de la app:

- `N8N_WEBHOOK_PUBLISHED_TREND`
- `N8N_WEBHOOK_NEWSLETTER`
- `N8N_WEBHOOK_ALERTS`

La app funciona sin estas URLs; solo dejará de notificar a n8n.

---

## 1. Notitendencias – Published Trend Event

**Objetivo:** recibir el evento cuando una tendencia se publica (`POST` desde la app).

1. Nuevo workflow: nombre `Notitendencias - Published Trend Event`.
2. Nodo **Webhook**:
   - Método: `POST`
   - Path: `notitendencias-published-trend` (o el que prefieras; la URL completa es la que copias a `N8N_WEBHOOK_PUBLISHED_TREND`).
   - Response: `Respond to Webhook` → texto `OK` o JSON `{ "ok": true }`.
3. Opcional: nodo **Set** para mapear `body` a campos claros.
4. Opcional: nodo **Postgres** / **Google Sheets** / **HTTP Request** para guardar log.
5. Activa el workflow y copia la **Production URL** del webhook a `N8N_WEBHOOK_PUBLISHED_TREND`.

**Payload típico** (ejemplo):

```json
{
  "event": "trend.published",
  "trend": {
    "id": "uuid",
    "slug": "mi-tendencia-abc123",
    "title": "…",
    "summary": "…",
    "trendScore": 72,
    "categorySlug": "ia"
  }
}
```

---

## 2. Notitendencias – High Score Alert

**Objetivo:** alerta interna cuando `trend_score >= 80`.

1. Workflow: `Notitendencias - High Score Alert`.
2. **Webhook** `POST`, path ej. `notitendencias-alert`.
3. Nodo **IF** (por ejemplo `{{ $json.trend.trendScore }}` >= 80) si quieres doble filtro.
4. Placeholder: **Send Email**, **Telegram**, **Slack** o **WhatsApp** (según tu gateway compartido).
5. URL del webhook → `N8N_WEBHOOK_ALERTS`.

**Payload típico:**

```json
{
  "event": "trend.high_score",
  "trend": { "title": "…", "trendScore": 85, "slug": "…" }
}
```

---

## 3. Notitendencias – Newsletter Subscribe

**Objetivo:** capturar nuevos suscriptores desde el formulario público.

1. Workflow: `Notitendencias - Newsletter Subscribe`.
2. **Webhook** `POST`, path ej. `notitendencias-newsletter`.
3. Nodo **Set** / **Postgres** para registrar el email (tu stack de email gateway puede ir después).
4. URL → `N8N_WEBHOOK_NEWSLETTER`.

**Payload típico:**

```json
{
  "event": "newsletter.subscribe",
  "subscriber": { "id": "uuid", "email": "user@example.com" }
}
```

---

## 4. Notitendencias – Daily Digest

**Objetivo:** cron diario que consulta la API pública y deja listo un resumen (email gateway después).

1. Workflow: `Notitendencias - Daily Digest`.
2. Nodo **Schedule Trigger** (cada día a la hora deseada).
3. Nodo **HTTP Request**:
   - Método: `GET`
   - URL: `https://notitendencias.vibesystems.tech/api/trends?category_slug=ia`
4. Nodo **Code** o **OpenAI/DeepSeek** para resumir la lista JSON.
5. Placeholder: envío por email / Telegram (mismo gateway que otras apps).

**Nota:** este flujo no requiere variable en la app; es totalmente autónomo en n8n.

---

## Verificación rápida

Desde el servidor o tu máquina (sin secretos en logs):

```bash
curl -sS -X POST "$N8N_WEBHOOK_PUBLISHED_TREND" \
  -H "Content-Type: application/json" \
  -d '{"ping":true}'
```

Debe responder `200` y el cuerpo configurado en el nodo Respond to Webhook.
