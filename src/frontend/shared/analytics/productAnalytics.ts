export const PRODUCT_ANALYTICS_EVENTS = [
	"recommendation_impression", "recommendation_opened", "meal_plan_generated", "meal_plan_saved",
	"pantry_use_soon_opened", "cooking_started", "cooking_completed", "recipe_repeated",
	"household_invite_sent", "household_invite_accepted", "recipe_import_completed", "notification_opened",
] as const;

export type ProductAnalyticsEvent = (typeof PRODUCT_ANALYTICS_EVENTS)[number];
export type ProductAnalyticsPayload = Record<string, string | number | boolean>;
const SAFE_KEYS = new Set(["surface", "candidate_count", "result_count", "position", "recipe_id", "plan_id", "session_id", "household_id", "status", "source", "scope", "duration_ms"]);
const FORBIDDEN = /(email|token|jwt|password|journal|note|invite|ingredient|phone|address)/i;

export const trackProductEvent = (event: ProductAnalyticsEvent, payload: ProductAnalyticsPayload = {}): void => {
	if (!PRODUCT_ANALYTICS_EVENTS.includes(event)) return;
	const safePayload = Object.fromEntries(Object.entries(payload).filter(([key, value]) => SAFE_KEYS.has(key) && !FORBIDDEN.test(key) && ["string", "number", "boolean"].includes(typeof value) && (typeof value !== "string" || value.length <= 80)));
	if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("product:analytics", { detail: { event, ...safePayload } }));
};
