"use client";
export const GOOGLE_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID ?? "";
const CONSENT_KEY = "sorteios-premium-marketing-consent";
declare global { interface Window { dataLayer?: unknown[]; googleAnalyticsActivated?: boolean; } }
export function googleCommand(..._args: unknown[]) {
 window.dataLayer ??= [];
 window.dataLayer.push(arguments);
}
export function activateGoogleAnalytics() {
 if (!GOOGLE_MEASUREMENT_ID) return;
 if (localStorage.getItem(CONSENT_KEY) !== "accepted" || /^\/(admin|api|pedido|checkout)(\/|$)/.test(location.pathname)) return;
 if (window.googleAnalyticsActivated) return;
 window.googleAnalyticsActivated = true;
 googleCommand("consent", "update", { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
 window.dataLayer ??= [];
 window.dataLayer.push({ event: "google_consent_granted" });
}
const events: Record<string, string> = {
 ViewContent: "view_item", AddToCart: "add_to_cart",
 InitiateCheckout: "begin_checkout", Lead: "generate_lead",
 AddPaymentInfo: "add_payment_info", Purchase: "purchase",
};
export function trackGoogle(source: string, params: Record<string, unknown>, onceKey?: string) {
 try {
  const event = events[source];
  if (!event || localStorage.getItem(CONSENT_KEY) !== "accepted") return;
  if (/^\/(admin|api|pedido|checkout)(\/|$)/.test(location.pathname)) return;
  const key = onceKey ? "google-event:" + onceKey : undefined;
  if (key && localStorage.getItem(key)) return;
  const value = typeof params.value === "number" && Number.isFinite(params.value) && params.value >= 0 ? params.value : undefined;
  const quantity = typeof params.num_items === "number" && Number.isInteger(params.num_items) && params.num_items > 0 ? params.num_items : 1;
  const id = Array.isArray(params.content_ids) && typeof params.content_ids[0] === "string" ? params.content_ids[0] : undefined;
  const details: Record<string, unknown> = { send_to: GOOGLE_MEASUREMENT_ID, currency: "BRL" };
  if (value !== undefined) details.value = value;
  if (id) details.items = [{ item_id: id, quantity, ...(value !== undefined ? { price: value / quantity } : {}) }];
  if (source === "Purchase") {
   if (!onceKey?.startsWith("purchase:") || !onceKey.slice(9)) return;
   details.transaction_id = onceKey.slice(9);
  }
  if (source === "AddPaymentInfo") details.payment_type = "PIX";
  activateGoogleAnalytics();
  googleCommand("event", event, details);
  if (source === "AddPaymentInfo") googleCommand("event", "pix_generated", { send_to: GOOGLE_MEASUREMENT_ID, currency: "BRL", ...(value !== undefined ? { value } : {}) });
  if (key) localStorage.setItem(key, "1");
 } catch {}
}

