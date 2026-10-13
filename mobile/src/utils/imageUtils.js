// mobile/src/utils/imageUtils.js
// Image source normalization + thumbnail URL helpers.

// Inline SVG so the fallback never needs a network request (and can't itself 404).
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
      '<rect width="400" height="500" fill="#F1F5F9"/>' +
      '<g fill="none" stroke="#CBD5E1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" transform="translate(140 190) scale(5)">' +
      '<path d="M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9"/>' +
      '</g></svg>'
  );

export const isPlaceholder = (src) => src === PLACEHOLDER_IMAGE;

/**
 * Accept only absolute http(s) URLs. Rejects blob:, data:, file:, relative
 * paths, empty strings, "null"/"undefined" strings and non-strings.
 */
export const isValidImageUrl = (src) => {
  if (typeof src !== 'string') return false;
  const s = src.trim();
  if (!s || s === 'null' || s === 'undefined') return false;
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname;
  } catch {
    return false;
  }
};

/**
 * Clean an images value from the API into a de-duplicated list of valid URLs.
 * Accepts an array, a single string, or a JSON-encoded array string.
 * With { fallback: true } an empty result becomes [PLACEHOLDER_IMAGE].
 */
export const normalizeImageList = (images, { fallback = false } = {}) => {
  let list = images;
  if (typeof list === 'string') {
    const t = list.trim();
    if (t.startsWith('[')) {
      try { list = JSON.parse(t); } catch { list = []; }
    } else {
      list = [t];
    }
  }
  if (!Array.isArray(list)) list = [];

  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const src = typeof raw === 'string' ? raw.trim() : raw?.url;
    if (!isValidImageUrl(src) || seen.has(src)) continue;
    seen.add(src);
    out.push(src);
  }

  if (!out.length && fallback) return [PLACEHOLDER_IMAGE];
  return out;
};

export const normalizeImageUrl = (src) => (isValidImageUrl(src) ? src.trim() : null);

const SUPABASE_TRANSFORMS_ENABLED =
  import.meta.env?.VITE_SUPABASE_IMAGE_TRANSFORMS === 'true';

const dpr = () =>
  Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

/**
 * Return a resized/compressed URL for a listing image.
 *  - Cloudinary: inserts a c_limit,w_<px>,q_auto,f_auto transform.
 *  - Supabase:   switches to the /render/image endpoint (needs image
 *                transformations enabled on the project → VITE_SUPABASE_IMAGE_TRANSFORMS=true).
 *  - Anything else is returned unchanged.
 * `width` is in CSS pixels; device pixel ratio (capped at 2) is applied here.
 */
export const getThumbnailUrl = (src, { width = 400, quality } = {}) => {
  if (!isValidImageUrl(src)) return src;
  const px = Math.round(width * dpr());

  try {
    const u = new URL(src);

    if (u.hostname === 'res.cloudinary.com' && u.pathname.includes('/image/upload/')) {
      const q = quality ? `q_${quality}` : 'q_auto:eco';
      const t = `c_limit,w_${px},${q},f_auto`;
      u.pathname = u.pathname.replace('/image/upload/', `/image/upload/${t}/`);
      return u.toString();
    }

    if (
      SUPABASE_TRANSFORMS_ENABLED &&
      u.pathname.includes('/storage/v1/object/public/')
    ) {
      u.pathname = u.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      u.searchParams.set('width', String(px));
      u.searchParams.set('quality', String(quality || 60));
      u.searchParams.set('resize', 'contain');
      return u.toString();
    }
  } catch {
    /* fall through */
  }
  return src;
};

/** onError handler: swap a broken image for the placeholder exactly once. */
export const handleImageError = (e) => {
  const img = e?.currentTarget;
  if (!img || img.dataset.fallback === '1') return;
  img.dataset.fallback = '1';
  img.removeAttribute('srcset');
  img.src = PLACEHOLDER_IMAGE;
};
