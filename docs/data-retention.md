# Retención y limpieza de datos (PostgreSQL)

Este documento describe la política aplicada por el script `scripts/cleanup-retention.ts` y cómo ejecutarlo de forma segura.

## Qué se limpia y qué se archiva

### `raw_trend_items`

| Condición | Acción |
|-----------|--------|
| `status = processed` y `created_at` anterior al umbral (30 días por defecto) | **Eliminar** (antes se pone `trends.raw_item_id` en `NULL` si apuntaba a ese raw, por la FK). |
| `status` en `rejected`, `duplicate` o `error` y más de 15 días (por defecto) | **Eliminar**. |
| `status` en `new` o `requires_review` y más de 30 días (mismo umbral que processed por defecto) | **Marcar como `rejected`**; en la misma ejecución real pueden entrar en la regla de borrado de `rejected` si ya superan los 15 días desde `created_at`. |

Los hallazgos recientes no se tocan hasta cumplir esas ventanas.

### `trends`

| Condición | Acción |
|-----------|--------|
| `status = published` y más de 45 días desde publicación (por defecto; se usa `published_at` o `created_at` si no hay `published_at`) | **Archivar** (`status = archived`), sin borrar. |
| `status` en `draft` o `pending` y `created_at` anterior a 30 días (por defecto) | **Archivar**. |
| `status = rejected` y más de 30 días (por defecto) | **Eliminar**. |
| `status = archived` y `updated_at` anterior a 180 días (por defecto) | **Eliminar** (tiempo en archivo desde la última actualización de fila; al archivar se actualiza `updated_at`). |

Las tendencias **publicadas recientes** no se eliminan: solo pasan a `archived` cuando cumplen la ventana de publicación.

**Nota:** El sitio público y la API solo listan `status = published`. Las tendencias `archived` dejan de mostrarse en home / categorías / detalle público.

### `app_events`

- Filas con `created_at` anterior a **30 días** (por defecto): **eliminar**.

### `newsletter_sends`

- Filas con `created_at` anterior a **90 días** (por defecto): **eliminar** (solo historial de envíos; no borra suscriptores).

### `subscribers`

- **Nunca** se eliminan automáticamente.

---

## Variables de entorno

| Variable | Valor por defecto | Uso |
|----------|-------------------|-----|
| `DRY_RUN` | `true` (cualquier valor distinto de la cadena `false`) | Si es `false`, el script **aplica** cambios. |
| `RAW_PROCESSED_DAYS` | 30 | Antigüedad para borrar `processed`. |
| `RAW_BAD_DAYS` | 15 | Antigüedad para borrar `rejected` / `duplicate` / `error`. |
| `PUBLISHED_ARCHIVE_DAYS` | 45 | Publicadas más antiguas → `archived`. |
| `REJECTED_DELETE_DAYS` | 30 | Tendencias `rejected` más antiguas → borrar. |
| `ARCHIVED_DELETE_DAYS` | 180 | Tendencias `archived` con `updated_at` antiguo → borrar. |
| `DRAFT_PENDING_DAYS` | 30 | `draft` / `pending` antiguas → `archived`. |
| `APP_EVENTS_DAYS` | 30 | Borrado de `app_events`. |
| `NEWSLETTER_SENDS_DAYS` | 90 | Borrado de `newsletter_sends`. |

Todas requieren `DATABASE_URL` válida.

---

## Dry run (recomendado antes de producción)

Por defecto **no** se modifica la base:

```bash
npm run cleanup:retention
# equivalente a DRY_RUN=true npm run cleanup:retention
```

El script imprime umbrales y un resumen con conteos (simulación coherente para `raw_trend_items`, incluyendo filas `new`/`requires_review` que se eliminarían tras marcarlas `rejected`).

---

## Limpieza real

```bash
DRY_RUN=false npm run cleanup:retention
```

Revisa primero el dry run en el mismo entorno (misma `DATABASE_URL`).

---

## Automatización (cron o n8n)

### Opción A: Cron en el VPS o contenedor

Programar semanalmente (por ejemplo domingo 03:00) en la máquina donde vive el código y las variables:

```bash
cd /ruta/a/Notitendencias && DRY_RUN=false npm run cleanup:retention >> /var/log/notitendencias-retention.log 2>&1
```

Ventaja: no expone credenciales a n8n; el log queda en disco.

### Opción B: n8n (semanal)

1. Crear workflow con nodo **Schedule Trigger** (por ejemplo cada domingo a las 03:00).
2. Ejecutar el comando en el host donde corre Node y existe el proyecto:
   - Nodo **Execute Command** (si tu instalación de n8n tiene acceso al filesystem y a `DATABASE_URL`), con el comando anterior, **o**
   - Un **Webhook** interno que dispare un job en tu plataforma (Coolify, GitHub Actions, etc.) que ejecute `DRY_RUN=false npm run cleanup:retention`.

**Seguridad:** Preferible que `DATABASE_URL` y `DRY_RUN=false` no viajen por webhooks públicos; usa secretos de n8n y red privada, o la opción cron en el VPS.

### Recordatorio

Después de cambiar la política, vuelve a ejecutar en **dry run** para validar conteos antes de `DRY_RUN=false`.

---

## Resumen de salida del script

El script imprime, entre otros:

- `raw_trend_items eliminados`
- `raw "new"/"requires_review" → rejected`
- `trends.raw_item_id puestos a NULL` (desvinculación antes de borrar raw)
- `trends archivadas` (desde publicadas y desde draft/pending)
- `trends eliminadas` (rejected y archived)
- `app_events eliminados`
- `newsletter_sends eliminados`

Si la base no tiene filas que cumplan criterios, los conteos serán `0` y el script termina con éxito.
