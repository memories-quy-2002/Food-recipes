/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_SITE_URL?: string;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SUPABASE_RECIPE_BUCKET?: string;
	readonly VITE_SENTRY_DSN?: string;
	readonly VITE_SENTRY_ENVIRONMENT?: string;
	readonly VITE_SENTRY_RELEASE?: string;
	readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
