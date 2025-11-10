const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  || API_BASE_URL.replace(/\/api(?:\/)?$/, '');

/**
 * Normalise une URL de média en tenant compte des chemins relatifs.
 * Retourne `null` si aucune URL n'est disponible.
 */
export function resolveMediaUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const base = MEDIA_BASE_URL.replace(/\/$/, '');
  const sanitizedPath = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;

  if (!base) {
    return `/${sanitizedPath}`;
  }

  return `${base}/${sanitizedPath}`;
}

export const DEFAULT_COURSE_IMAGE = '/apprenant.png';
export const DEFAULT_INSTRUCTOR_AVATAR = '/mdsc-logo.png';


