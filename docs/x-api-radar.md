# X API Radar — Notitendencias

Integración preparada para que **n8n** consulte la API oficial de X (Twitter), detecte señales de IA y envíe hallazgos estructurados a Notitendencias. La app **no** publica automáticamente: todo entra como `raw_trend_items` con `status=new` para revisión en `/admin`.

**Dominio de producción:** https://notitendencias.iareal.net  
**Endpoint de ingesta:** `POST /api/bridge/ingest` (Bearer `BRIDGE_API_KEY`)

Flujo editorial:

```
X API → n8n (Notitendencias - X AI Radar) → /api/bridge/ingest → raw_trend_items (new)
  → /admin → DeepSeek → trends (pending) → publicación manual
```

---

## 1. Propósito

X se usa como **radar de señales tempranas de IA**, no como fuente única ni como extractor masivo de contenido.

- Complementa otras fuentes (Kimi WebBridge, Hacker News, etc.).
- Cada post es una **señal** para el editor, no un artículo listo para publicar.
- El volumen y la frecuencia están acotados para respetar cuotas y costos de la API de X.

---

## 2. Estrategia editorial

| Principio | Detalle |
|-----------|---------|
| Señal, no verdad | Un tweet indica conversación o rumor; DeepSeek y el humano validan antes de publicar. |
| URL externa | Si el post enlaza a blog, demo o repo, guardar `metadata.external_url` y `source_url` del post en X. |
| Sin hilos completos | No copiar threads largos en `raw_text`. |
| Sin auto-publicación | n8n solo ingesta; `/admin` decide procesar y publicar. |
| Rumores | Evitar afirmar hechos no verificados; `relevance_reason` debe ser cauteloso. |
| Contenido sensible | Política, odio o temas delicados: descartar en filtro o marcar para revisión humana. |
| arXiv | Posts centrados en **arxiv.org** se **descartan** en n8n (la app además puede marcar `requires_review` si llega mención de arXiv). |

---

## 3. Estrategia de bajo costo

| Regla | Valor sugerido (beta) |
|-------|------------------------|
| Posts por corrida | `X_API_MAX_POSTS_PER_RUN=50` |
| Posts por día | `X_API_MAX_POSTS_PER_DAY=100` |
| Frecuencia | 2× al día: **10:45** y **15:45** CDMX (newsletter editorial ~16:30, fuera de n8n) |
| Alcance | **55 cuentas** del catálogo; 1 request/cuenta/corrida |
| Solo hoy | `start_time` = inicio del día `America/Mexico_City`; sin historial |
| Reproceso | Guardar `metadata.post_id`; deduplicar en n8n antes de ingest |
| Deduplicación extra | Mismo `post_id`, misma `source_url` o título muy similar en la misma ejecución |

Variables solo en **n8n** (o entorno del worker), nunca en el frontend de Next.js.

---

## 4. Catálogo de cuentas (55)

**Desde el primer día, el radar de X solo importa publicaciones nuevas desde hoy en adelante. No se importa historial pasado. Por cada cuenta se toma como máximo el último post original publicado hoy.**

Lista completa en `scripts/n8n-x-ai-radar-workflow.sdk.ts` (`ACCOUNTS`) y en el nodo n8n **Set config** → `accounts`. Incluye, entre otras: `OpenAI`, `AnthropicAI`, `GoogleAI`, `xai`, `cursor_ai`, `huggingface`, `perplexity_ai`, `deepseek_ai`, `n8n_io`, `coolifyio`, etc. (55 handles).

Edición: añadir/quitar handles en **Set config** sin tocar la app Next.js.

---

## 5. Queries iniciales

Usar en **Recent Search** de X API v2 (ajustar según plan y límites):

- `"AI agent" lang:en`
- `"OpenAI" lang:en`
- `"Claude" lang:en`
- `"Gemini AI" lang:en`
- `"DeepSeek" lang:en`
- `"new AI tool" lang:en`
- `"AI startup" lang:en`
- `"vibe coding" lang:en`
- `"inteligencia artificial" lang:es`
- `"herramienta de IA" lang:es`
- `"agentes de IA" lang:es`
- `"automatización con IA" lang:es`

Rotar o reducir queries si se acerca el límite diario.

---

## 6. Payload estándar hacia Notitendencias

```json
{
  "category": "ia",
  "source_name": "X",
  "source_url": "https://x.com/{username}/status/{post_id}",
  "title": "",
  "raw_text": "",
  "detected_at": "2026-05-15T14:00:00Z",
  "metadata": {
    "platform": "x",
    "signal_type": "ai_trend",
    "author": "",
    "username": "",
    "post_id": "",
    "likes": 0,
    "reposts": 0,
    "replies": 0,
    "quotes": 0,
    "detected_query": "",
    "relevance_reason": "",
    "external_url": ""
  }
}
```

- `category` debe existir en BD (p. ej. `ia`).
- `metadata` es libre (`z.record(z.unknown())` en la app); los campos anteriores son convención para X.

---

## 7. Reglas para `title`

- Título **editorial breve**, no el tweet literal si es largo.
- Máximo recomendado: ~120 caracteres (límite API: 500).
- Ejemplos:
  - «Nueva herramienta de agentes IA gana conversación en X»
  - «Desarrolladores discuten nuevo flujo de vibe coding»
  - «Actualización de OpenAI dispara conversación sobre automatización»

---

## 8. Reglas para `raw_text`

Incluir:

- Resumen breve del post (1–3 oraciones).
- Por qué puede ser relevante para creadores, emprendedores o negocios en México.
- Contexto mínimo (cuenta, métricas aproximadas si ayudan).

No incluir:

- Hilos completos ni citas encadenadas largas.
- Contenido copiado masivo.

**Máximo recomendado:** 1 500 caracteres (la app valida un tope global mayor; ver `RAW_TEXT_MAX_LENGTH`).

---

## 9. Valores de `signal_type`

Usar uno por hallazgo según el tema dominante:

| Valor | Cuándo |
|-------|--------|
| `ai_launch` | Lanzamiento de producto o modelo |
| `ai_tool` | Herramienta nueva o actualización útil |
| `ai_agents` | Agentes, automatización multi-paso |
| `ai_business` | Oportunidad de negocio, pricing, GTM |
| `ai_coding` | Vibe coding, IDE, dev tools |
| `ai_video` | Video, avatar, generación multimedia |
| `ai_security` | Seguridad, riesgos, políticas |
| `ai_research` | Papers, benchmarks (evitar arXiv como foco) |
| `creator_trend` | Contenido para creadores / redes |
| `market_signal` | Inversión, mercado, competencia |
| `viral_discussion` | Conversación viral sin producto claro |
| `ai_trend` | Genérico si no encaja otro |

---

## 10. Reglas de filtrado

**Pasar** si cumple al menos una:

- Proviene de cuenta clave.
- Tiene métricas visibles relevantes (likes, reposts, etc.).
- Menciona lanzamiento, herramienta, modelo, agente o cambio importante.
- Aplica a creadores, emprendedores o negocios.
- Aparece en más de una búsqueda en la misma corrida.
- Enlaza a fuente externa relevante (`external_url`).

**Descartar** si:

- Es meme sin utilidad editorial.
- Es rumor sin fuente verificable.
- Es promoción vacía sin contexto.
- Es político o sensible sin verificación.
- Contiene **arxiv.org** o está centrado en arXiv (política editorial del proyecto).

Scoring en n8n: ver `docs/n8n-x-ai-radar-workflow.md` (umbral sugerido: score ≥ 40).

---

## 11. Deduplicación

1. Guardar siempre `metadata.post_id`.
2. En cada ejecución de n8n, mantener un `Set` o array de `post_id` ya vistos; no reenviar duplicados.
3. Opcional entre ejecuciones: Data table / Redis / hoja con IDs procesados (sin endpoint nuevo en la app por ahora).
4. No se implementa `/api/bridge/check-duplicate` en esta fase; la app puede recibir el mismo post dos veces si n8n no deduplica — el editor puede rechazar manualmente.

---

## Variables de entorno

| Variable | Dónde | Uso |
|----------|-------|-----|
| `X_BEARER_TOKEN` | **Solo n8n** | Bearer para API de X |
| `X_API_MAX_POSTS_PER_RUN` | n8n | Tope por ejecución (default 50) |
| `X_API_MAX_POSTS_PER_DAY` | n8n | Tope diario acumulado (default 100) |
| `NOTITENDENCIAS_INGEST_URL` | n8n | `https://notitendencias.iareal.net/api/bridge/ingest` |
| `BRIDGE_API_KEY` | n8n + app | Mismo secreto que en Coolify para ingest |

**No** poner `X_BEARER_TOKEN` en Next.js, frontend, logs públicos ni repositorio.

---

## Seguridad

- Tokens solo en credenciales/variables de n8n (modo secreto).
- No loguear `Authorization` ni cuerpos con tokens.
- `BRIDGE_API_KEY` solo en servidor (app) y en n8n para POST ingest.
- Revisar permisos mínimos en [X Developer Portal](https://developer.x.com/).

---

## Prueba manual (curl)

Simula un hallazgo de X sin llamar a la API:

```bash
curl -X POST "https://notitendencias.iareal.net/api/bridge/ingest" \
  -H "Authorization: Bearer TU_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "ia",
    "source_name": "X",
    "source_url": "https://x.com/example/status/123",
    "title": "Nueva conversación de IA detectada en X",
    "raw_text": "Varias cuentas están comentando una nueva herramienta de IA para agentes. La señal puede ser útil para creadores y negocios.",
    "metadata": {
      "platform": "x",
      "signal_type": "ai_agents",
      "author": "Example",
      "username": "example",
      "post_id": "123",
      "likes": 120,
      "reposts": 30,
      "replies": 12,
      "relevance_reason": "Tema útil para contenido y automatización de negocios."
    }
  }'
```

Respuesta esperada: `{ "ok": true, "item": { ... } }` con `status: "new"`.

---

## Referencias

- Workflow n8n: [`docs/n8n-x-ai-radar-workflow.md`](./n8n-x-ai-radar-workflow.md) — ID **`nFBNa3Y1ueVHBLbc`**, URL https://n8n.vibesystems.tech/workflow/nFBNa3Y1ueVHBLbc
- Estado de workflows n8n: [`docs/n8n-workflows.md`](./n8n-workflows.md)
- Workflow operativo: [`docs/n8n-x-ai-radar-workflow.md`](./n8n-x-ai-radar-workflow.md) (`nFBNa3Y1ueVHBLbc`)
- Kimi WebBridge (otra fuente): [`docs/kimi-webbridge-prompt.md`](./kimi-webbridge-prompt.md)
