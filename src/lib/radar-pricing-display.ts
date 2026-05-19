/**
 * Texto de precio en la UI (el cobro real lo define Stripe Payment Link + price_*).
 * En Coolify puedes cambiar sin tocar código:
 *   NEXT_PUBLIC_RADAR_PRICE_USD=6.33
 *   NEXT_PUBLIC_RADAR_PRICE_MXN_HINT=126
 */
const DEFAULT_USD = 6.33;
const DEFAULT_MXN = 126;

const usd = Number(process.env.NEXT_PUBLIC_RADAR_PRICE_USD ?? String(DEFAULT_USD));
const mxn = Number(process.env.NEXT_PUBLIC_RADAR_PRICE_MXN_HINT ?? String(DEFAULT_MXN));

function formatUsdAmount(amount: number): string {
  return amount.toFixed(2);
}

export function radarPriceUsd(): number {
  return Number.isFinite(usd) && usd > 0 ? usd : DEFAULT_USD;
}

export function radarPriceMxnHint(): number {
  return Number.isFinite(mxn) && mxn > 0 ? mxn : DEFAULT_MXN;
}

/** Precio grande en hero/pricing, ej. "$6.33" */
export function radarPriceUsdBigLabel(): string {
  return `$${formatUsdAmount(radarPriceUsd())}`;
}

export function radarPriceUsdLabel(): string {
  return `${radarPriceUsdBigLabel()} USD / mes`;
}

export function radarPriceMxnHintLabel(): string {
  return `~ $${Math.round(radarPriceMxnHint())} MXN / mes`;
}
