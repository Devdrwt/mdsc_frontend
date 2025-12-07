import DOMPurify from 'dompurify';

/**
 * Sanitize HTML pour protéger contre XSS
 * Utilise DOMPurify pour nettoyer le contenu HTML avant l'affichage
 * 
 * @param html - Le contenu HTML à sanitizer
 * @param options - Options de configuration DOMPurify (optionnel)
 * @returns Le HTML sanitizé et sécurisé
 */
export function sanitizeHtml(html: string | null | undefined, options?: DOMPurify.Config): string {
  if (!html) {
    return '';
  }

  // Configuration par défaut pour une sécurité maximale
  const defaultOptions: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr', 'sub', 'sup'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id',
      'target', 'rel', 'colspan', 'rowspan', 'align', 'valign'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Empêcher les event handlers
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Nettoyer les styles inline (peuvent contenir des expressions JavaScript)
    ALLOW_DATA_ATTR: false,
  };

  // Fusionner avec les options personnalisées
  const config = { ...defaultOptions, ...options };

  // Sanitizer le HTML
  return DOMPurify.sanitize(html, config);
}

/**
 * Créer un objet pour dangerouslySetInnerHTML avec HTML sanitizé
 * 
 * @param html - Le contenu HTML à sanitizer
 * @param options - Options de configuration DOMPurify (optionnel)
 * @returns Objet avec __html sanitizé pour dangerouslySetInnerHTML
 */
export function createSanitizedHtml(html: string | null | undefined, options?: DOMPurify.Config): { __html: string } {
  return {
    __html: sanitizeHtml(html, options),
  };
}

