# Prueba de pago y premium manual

Guía para comprobar que el cobro de **AI Radar** funciona y para simular membresía premium sin depender solo de Stripe en producción.

**Producción:** `https://notitendencias.iareal.net`

---

## 1. Modo test de Stripe (recomendado para cobros falsos)

La app no tiene un “modo test” propio: todo depende de que **las claves, el Payment Link y el webhook sean de la misma cuenta Stripe en modo Test**.

| Paso | Qué hacer |
|------|-----------|
| 1 | En [Stripe Dashboard](https://dashboard.stripe.com) activa **Test mode** (interruptor arriba). |
| 2 | **Developers → API keys**: usa `sk_test_…` en Coolify/local como `STRIPE_SECRET_KEY`. |
| 3 | Crea un **Payment Link de test** (Productos → Payment Links) con el precio de AI Radar. Copia la URL `https://buy.stripe.com/test_…` → `NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK`. |
| 4 | Copia el **Price ID** (`price_…`) del enlace → `STRIPE_PREMIUM_PRICE_IDS` (coma si hay varios). |
| 5 | **Developers → Webhooks** → endpoint: `https://TU_DOMINIO/api/webhooks/stripe` (local: ver CLI abajo). Eventos: **`checkout.session.completed`**, **`customer.subscription.updated`**, **`customer.subscription.deleted`**. Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET` (en test será `whsec_…` de test). |
| 5b | **Settings → Billing → Customer portal**: actívalo y permite **cancelar suscripciones**. Los usuarios premium abren el portal desde **Mi radar → Gestionar o cancelar en Stripe** (`POST /api/billing/portal`). Opcional: `STRIPE_CUSTOMER_PORTAL_RETURN_URL` (por defecto `NEXT_PUBLIC_APP_URL/mi-radar`). |
| 6 | En el Payment Link, URL de éxito sugerida: `https://TU_DOMINIO/mi-radar?bienvenida=1`. |
| 7 | Flujo de prueba: inicia sesión en la web → ve a **pricing en `/ia#pricing`** o **Mi radar** → paga con tarjeta de prueba. |

### Tarjetas de prueba

| Caso | Número |
|------|--------|
| Pago exitoso | `4242 4242 4242 4242` |
| Rechazo | `4000 0000 0000 0002` |
| 3D Secure | `4000 0027 6000 3184` |

Cualquier fecha futura, cualquier CVC y cualquier código postal.

### Probar el webhook sin deploy público (local)

```bash
stripe listen --forward-to localhost:3015/api/webhooks/stripe
```

Usa el `whsec_…` que imprime el CLI en `STRIPE_WEBHOOK_SECRET` mientras escuchas.

**Desde el Dashboard:** Developers → Webhooks → tu endpoint → “Send test event” o revisar **Event deliveries** tras un pago de test.

---

## 2. Cuidado en producción (`notitendencias.iareal.net`)

- Si en Coolify tienes **`sk_live_…`** y un Payment Link **live**, cada checkout **cobra dinero real**.
- **No uses tarjetas reales** para “simular” un pago.
- Para simular membresía en prod **sin cobrar**: usa el **admin manual** (sección 3) o monta un entorno/staging con **todo** en modo test (claves test + link test + webhook test).
- Mezclar link live con `sk_test_…` (o al revés) rompe validación de precios y el webhook.

---

## 3. Premium manual desde admin (sin Stripe)

Sirve para beta, soporte o simular “ya pagó”.

| Paso | Acción |
|------|--------|
| 1 | Abre `https://notitendencias.iareal.net/admin/login` |
| 2 | Contraseña → variable `ADMIN_PASSWORD` |
| 3 | Ve a **`https://notitendencias.iareal.net/admin/users`** |
| 4 | Localiza el usuario por **email** |
| 5 | Pulsa el botón naranja **Premium** (o **Free** para quitar) |

**Requisito:** sesión admin (cookie del panel) **o** usuario con rol `admin` / email en `ADMIN_EMAILS`.

Eso actualiza `users.plan` y `subscribers.plan` para ese correo. El usuario debe **cerrar sesión y volver a entrar** (o navegar de nuevo) para ver el plan en la UI; al cargar sesión también corre `syncPremiumPlanFromSubscriber` si solo estaba premium en `subscribers`.

---

## 4. Qué debe estar bien para activación automática (webhook)

Tras `checkout.session.completed`, la app (`fulfillRadarPremiumFromCheckoutSession`) hace lo siguiente:

1. `payment_status === "paid"`
2. Si defines `STRIPE_PREMIUM_PRICE_IDS`, el checkout debe incluir uno de esos `price_*` (necesita `STRIPE_SECRET_KEY` de la **misma** cuenta).
3. Asigna **premium** si encuentra usuario por:
   - **`client_reference_id`** = UUID del usuario (preferido), o
   - **email** del checkout = email del usuario en BD (sin distinguir mayúsculas).

### Condiciones extra

| Requisito | Detalle |
|-----------|---------|
| Webhook | `POST /api/webhooks/stripe` con `STRIPE_WEBHOOK_SECRET` correcto |
| Usuario | Debe existir en `users` con `status = active` |
| Email | Si no hay `client_reference_id`, el email del pago debe ser **el mismo** con el que hizo login |
| `client_reference_id` | Solo se añade si el checkout sale de `stripeRadarCheckoutUrl(userId)` — **pricing en `/ia`** y **RadarMembershipCard** cuando hay sesión. El botón **“Suscribirme” del header** usa el link **sin** `client_reference_id`; en ese caso cuenta el match por email |
| URL de checkout logueado | Forma: `https://buy.stripe.com/...?client_reference_id=<uuid-usuario>` |

Si falla, en logs verás razones como: `user_not_found`, `no_email`, `price_not_allowed`, `client_ref_user_not_found`. Opcional: `N8N_PAYMENT_WEBHOOK_URL` recibe el aviso con `fulfillReason` / `premiumActivated`.

**Sincronización extra:** al iniciar sesión, si `subscribers` ya tiene `premium` pero `users.plan` no, `premium-sync` lo alinea.

---

## 5. Checklist rápido — deploy `https://notitendencias.iareal.net`

### Salud

- [ ] `GET https://notitendencias.iareal.net/api/health` → `{"ok":true}`
- [ ] Puerto contenedor **3015** en Coolify

### Auth (para probar como usuario)

- [ ] `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST=true`
- [ ] Google OAuth si usas `/login` con Google

### Stripe (auto-activación)

- [ ] `NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK` = URL del Payment Link (test **o** live, coherente con el resto)
- [ ] `STRIPE_WEBHOOK_SECRET` del endpoint en esa misma cuenta/modo
- [ ] Webhook en Stripe: `https://notitendencias.iareal.net/api/webhooks/stripe`, eventos **`checkout.session.completed`**, **`customer.subscription.updated`**, **`customer.subscription.deleted`**
- [ ] Customer Billing Portal activado en Stripe (cancelación de suscripción)
- [ ] `STRIPE_SECRET_KEY` (necesaria para portal y baja automática tras cancelar)
- [ ] `STRIPE_SECRET_KEY` (`sk_test_` o `sk_live_` acorde al link)
- [ ] `STRIPE_PREMIUM_PRICE_IDS` = `price_…` del Payment Link
- [ ] Success URL del link → `/mi-radar?bienvenida=1` (recomendado)

### Prueba end-to-end (test mode)

- [ ] Usuario registrado y **activo**, mismo email que usarás en Stripe
- [ ] Login → checkout desde **`/ia#pricing`** (con `client_reference_id`) o pagar con ese email
- [ ] Tarjeta `4242…` → en Stripe: evento entregado **200** al webhook
- [ ] Recargar `/mi-radar` o re-login → plan premium / contenido desbloqueado

### Alternativa sin cobro

- [ ] `/admin/login` → `/admin/users` → **Premium**

### Opcional

- [ ] `N8N_PAYMENT_WEBHOOK_URL` + `N8N_PAYMENT_WEBHOOK_SECRET` para avisos en n8n
- [ ] `NEXT_PUBLIC_RADAR_PRICE_USD` / `NEXT_PUBLIC_RADAR_PRICE_MXN_HINT` solo afectan texto en UI (el cobro lo define Stripe)

---

## Resumen

| Objetivo | Cómo |
|----------|------|
| Probar cobro real (sin dinero) | Stripe **test** + variables test + webhook a `/api/webhooks/stripe` |
| Simular premium en prod sin cobrar | **`/admin/users` → Premium** |
| Activación automática fiable | Mismo email al pagar **o** checkout logueado desde `/ia#pricing` / Mi radar (`client_reference_id`) |
| Cancelar membresía | Usuario premium en **`/mi-radar`** → **Gestionar o cancelar en Stripe** (portal). Premium manual sin Stripe → mensaje de contacto a soporte |

Ver también: [README § Stripe](../README.md#stripe-payment-link-premium-y-n8n), [coolify-deploy.md](./coolify-deploy.md).
