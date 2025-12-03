const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  || API_BASE_URL.replace(/\/api(?:\/)?$/, '');

/**
 * Normalise une URL de média en tenant compte des chemins relatifs.
 * Retourne `null` si aucune URL n'est disponible.
 * Utilise toujours le proxy Next.js pour les URLs du backend pour éviter les problèmes CORS.
 */
export function resolveMediaUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  // Si l'URL est complète (http:// ou https://)
  if (/^https?:\/\//i.test(rawUrl)) {
    // Si c'est une URL du backend, extraire le chemin et utiliser le proxy Next.js
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const backendBaseUrl = apiUrl.replace(/\/api(?:\/)?$/, '');
    const backendBaseUrlAlt = apiUrl;
    
    // Extraire le domaine de l'URL du backend pour une meilleure détection
    let backendDomain = '';
    try {
      const apiUrlObj = new URL(apiUrl);
      backendDomain = apiUrlObj.hostname;
    } catch (e) {
      // Si l'URL ne peut pas être parsée, utiliser une détection simple
      backendDomain = backendBaseUrl.replace(/^https?:\/\//, '').split('/')[0];
    }
    
    // Vérifier si c'est une URL du backend (plusieurs variantes possibles)
    // En production, les URLs peuvent être différentes, donc on vérifie aussi le chemin /uploads/
    const isBackendUrl = rawUrl.includes(backendBaseUrl) || 
        rawUrl.includes(backendBaseUrlAlt) || 
        rawUrl.includes(backendDomain) ||
        rawUrl.includes('localhost:5000') ||
        rawUrl.includes('/uploads/') ||
        rawUrl.includes('/api/media/');
    
    if (isBackendUrl) {
      // Extraire le chemin depuis l'URL complète
      try {
        const url = new URL(rawUrl);
        let path = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        
        // Si le chemin commence par "api/media/", le retirer car c'est déjà géré par le proxy
        if (path.startsWith('api/media/')) {
          path = path.replace(/^api\/media\//, '');
        }
        
        // Utiliser le proxy Next.js pour éviter les problèmes CORS
        return `/api/media/${path}`;
      } catch (e) {
        // Si l'URL ne peut pas être parsée, essayer une extraction simple
        const match = rawUrl.match(/https?:\/\/[^/]+(\/.+)$/);
        if (match) {
          let path = match[1].startsWith('/') ? match[1].slice(1) : match[1];
          
          // Si le chemin commence par "api/media/", le retirer
          if (path.startsWith('api/media/')) {
            path = path.replace(/^api\/media\//, '');
          }
          
          return `/api/media/${path}`;
        }
      }
    }
    // Si c'est une URL externe (CDN, etc.), la retourner telle quelle
    return rawUrl;
  }

  // URL relative
  // Si c'est une image locale (dans /public), la retourner telle quelle
  // Sinon, utiliser le proxy Next.js pour éviter les problèmes CORS
  if (rawUrl.startsWith('/') && !rawUrl.startsWith('/uploads/')) {
    // Image locale (ex: /apprenant.png, /mdsc-logo.png)
    return rawUrl;
  }
  
  // URL relative du backend (ex: uploads/...), utiliser le proxy
  const sanitizedPath = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
  return `/api/media/${sanitizedPath}`;
}

export const DEFAULT_COURSE_IMAGE = '/apprenant.png';
export const DEFAULT_INSTRUCTOR_AVATAR = '/mdsc-logo.png';

/**
 * Décode correctement un nom de fichier UTF-8 qui pourrait être mal encodé
 * Gère les cas où le texte est encodé en Latin-1 mais devrait être en UTF-8
 * Exemple: "vidÃ©o" -> "vidéo"
 */
export function decodeFilename(filename: string | null | undefined): string {
  // Si pas de nom de fichier, retourner chaîne vide
  if (!filename) {
    return '';
  }

  try {
    // Vérifier si le nom de fichier contient des caractères mal encodés
    const hasMalformedChars = /Ã|â€™|â€œ|â€|â€"/.test(filename);
    
    // Si pas de caractères mal formés, retourner tel quel
    if (!hasMalformedChars) {
      return filename;
    }

    // Méthode 1: Décoder comme Latin-1 puis réencoder en UTF-8
    // C'est la méthode la plus fiable pour corriger "vidÃ©o" -> "vidéo"
    try {
      // Convertir chaque caractère en byte Latin-1, puis décoder en UTF-8
      const bytes = new Uint8Array(filename.length);
      for (let i = 0; i < filename.length; i++) {
        bytes[i] = filename.charCodeAt(i) & 0xFF;
      }
      const decoded = new TextDecoder('latin1').decode(bytes);
      
      // Vérifier que le résultat est meilleur (moins de caractères mal formés)
      if (decoded && !/Ã|â€™/.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      // Continuer avec les autres méthodes
    }

    // Méthode 2: Remplacements manuels pour les cas courants
    const replacements: Record<string, string> = {
      'Ã©': 'é',
      'Ã¨': 'è',
      'Ãª': 'ê',
      'Ã«': 'ë',
      'Ã ': 'à',
      'Ã¢': 'â',
      'Ã§': 'ç',
      'Ã´': 'ô',
      'Ã¹': 'ù',
      'Ã»': 'û',
      'Ã¯': 'ï',
      'Ã°': 'ð',
      'Ã±': 'ñ',
    };
    
    let result = filename;
    for (const [wrong, correct] of Object.entries(replacements)) {
      result = result.replace(new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
    }
    
    // Si le résultat est différent et meilleur, l'utiliser
    if (result && result !== filename && !/Ã|â€™/.test(result)) {
      return result;
    }
    
    // Toujours retourner le nom original si on ne peut pas le décoder
    return filename;
  } catch (error) {
    console.warn('Erreur lors du décodage du nom de fichier:', error);
    // En cas d'erreur, retourner le nom original
    return filename || '';
  }
}


