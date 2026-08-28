export const PRODUCT_ANALYTICS = Symbol('PRODUCT_ANALYTICS');

export const PRODUCT_ANALYTICS_EVENTS = [
  'recommendation_impression', 'recommendation_opened', 'meal_plan_generated', 'meal_plan_saved',
  'pantry_use_soon_opened', 'cooking_started', 'cooking_completed', 'recipe_repeated',
  'household_invite_sent', 'household_invite_accepted', 'recipe_import_completed', 'notification_opened',
] as const;

export type ProductAnalyticsEvent = (typeof PRODUCT_ANALYTICS_EVENTS)[number];
export type ProductAnalyticsValue = string | number | boolean;
export type ProductAnalyticsPayload = Record<string, ProductAnalyticsValue>;

export interface ProductAnalyticsPort {
  track(event: ProductAnalyticsEvent, payload?: ProductAnalyticsPayload): void;
}
