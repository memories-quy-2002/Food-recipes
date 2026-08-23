/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_KONG_BASE_URL?: string;
	readonly VITE_SITE_URL?: string;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SUPABASE_RECIPE_BUCKET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
