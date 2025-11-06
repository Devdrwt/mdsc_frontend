import { NotificationService } from '../services/notificationService';
import { ApiError } from '../services/api';

/**
 * Utilitaire pour afficher des notifications toast de manière simple
 * Remplace les appels à alert() par des notifications élégantes
 */

/**
 * Extrait un message d'erreur détaillé d'une erreur API
 * @param error - L'erreur à traiter (peut être ApiError, Error, ou any)
 * @param defaultMessage - Message par défaut si aucun message n'est trouvé
 * @returns Le message d'erreur formaté
 */
export function extractErrorMessage(error: any, defaultMessage: string = 'Une erreur est survenue'): string {
  // Si c'est une ApiError, extraire les détails
  if (error instanceof ApiError || (error && error.status)) {
    let errorMessage = error.message || defaultMessage;
    
    // Si l'erreur contient des détails (erreurs de validation, etc.)
    if (error.details) {
      if (Array.isArray(error.details)) {
        // Si c'est un tableau d'erreurs de validation
        const validationErrors = error.details
          .map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.field && err.message) return `${err.field}: ${err.message}`;
            return err.message || JSON.stringify(err);
          })
          .join('\n');
        errorMessage = validationErrors || errorMessage;
      } else if (typeof error.details === 'object') {
        // Si c'est un objet avec des erreurs par champ
        const fieldErrors = Object.entries(error.details)
          .map(([field, message]) => `${field}: ${message}`)
          .join('\n');
        errorMessage = fieldErrors || errorMessage;
      } else if (typeof error.details === 'string') {
        errorMessage = error.details;
      }
    }
    
    // Si l'erreur contient un champ errors (format Laravel)
    if (error.errors && typeof error.errors === 'object') {
      const fieldErrors = Object.entries(error.errors)
        .map(([field, messages]: [string, any]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : messages;
          return `${field}: ${msg}`;
        })
        .join('\n');
      errorMessage = fieldErrors || errorMessage;
    }
    
    return errorMessage;
  }
  
  // Si c'est une Error standard
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Si c'est une string
  if (typeof error === 'string') {
    return error;
  }
  
  // Si c'est un objet avec un message
  if (error && typeof error === 'object' && error.message) {
    return error.message;
  }
  
  return defaultMessage;
}

export const toast = {
  success: (title: string, message?: string) => {
    NotificationService.success(title, message, 4000);
  },

  error: (title: string, message?: string) => {
    NotificationService.error(title, message, 5000);
  },

  /**
   * Affiche une erreur avec extraction automatique du message depuis une ApiError
   */
  errorFromApi: (title: string, error: any, defaultMessage?: string) => {
    const message = extractErrorMessage(error, defaultMessage || 'Une erreur est survenue');
    NotificationService.error(title, message, 5000);
  },

  warning: (title: string, message?: string) => {
    NotificationService.warning(title, message, 4000);
  },

  info: (title: string, message?: string) => {
    NotificationService.info(title, message, 4000);
  },
};

// Export par défaut
export default toast;

