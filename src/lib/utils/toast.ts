import { NotificationService } from '../services/notificationService';

/**
 * Utilitaire pour afficher des notifications toast de manière simple
 * Remplace les appels à alert() par des notifications élégantes
 */

export const toast = {
  success: (title: string, message?: string) => {
    NotificationService.success(title, message, 4000);
  },

  error: (title: string, message?: string) => {
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

