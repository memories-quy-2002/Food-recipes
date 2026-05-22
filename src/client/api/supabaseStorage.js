const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const RECIPE_BUCKET =
	import.meta.env.VITE_SUPABASE_RECIPE_BUCKET || "recipe-images";

const trimTrailingSlash = (value) => value?.replace(/\/+$/, "");

const getFileExtension = (file) => {
	const extension = file.name?.split(".").pop()?.toLowerCase();
	if (extension) return extension;
	return file.type?.split("/").pop() || "jpg";
};

const slugify = (value) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

const isJwtLike = (value) => value?.split(".").length === 3;

const getStorageHeaders = (file) => {
	if (!isJwtLike(SUPABASE_ANON_KEY)) {
		throw new Error(
			"Supabase Storage upload needs the Legacy API keys anon public JWT. Replace VITE_SUPABASE_ANON_KEY with the legacy anon public key from Supabase Project Settings."
		);
	}

	return {
		apikey: SUPABASE_ANON_KEY,
		Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
		"Content-Type": file.type || "application/octet-stream",
		"x-upsert": "false",
	};
};

const normalizeStorageError = (message) => {
	if (message.includes("Invalid Compact JWS")) {
		return "Supabase rejected the upload token. Use the Legacy API keys anon public JWT for VITE_SUPABASE_ANON_KEY, not a publishable key or service_role key.";
	}

	if (message.includes("authorization") || message.includes("Unauthorized")) {
		return `${message} Check that the recipe-images bucket policy allows uploads for the anon role.`;
	}

	return message;
};

export const isSupabaseStorageConfigured = () =>
	Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const uploadRecipeImage = async ({ file, recipeName, userId }) => {
	if (!file) {
		throw new Error("Please choose a recipe image before publishing.");
	}

	if (!isSupabaseStorageConfigured()) {
		throw new Error(
			"Supabase Storage is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment."
		);
	}

	const supabaseUrl = trimTrailingSlash(SUPABASE_URL);
	const extension = getFileExtension(file);
	const recipeSlug = slugify(recipeName || "recipe");
	const uniqueId =
		crypto?.randomUUID?.() || `${Date.now()}-${Math.round(Math.random() * 10000)}`;
	const objectPath = `${recipeSlug}-${uniqueId}.${extension}`;
	const uploadUrl = `${supabaseUrl}/storage/v1/object/${RECIPE_BUCKET}/${objectPath}`;

	const response = await fetch(uploadUrl, {
		method: "POST",
		headers: getStorageHeaders(file),
		body: file,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			normalizeStorageError(
				errorText || "Supabase Storage rejected the image upload."
			)
		);
	}

	return {
		path: objectPath,
		url: `${supabaseUrl}/storage/v1/object/public/${RECIPE_BUCKET}/${objectPath}`,
	};
};
