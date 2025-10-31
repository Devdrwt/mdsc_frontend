import { apiRequest } from './api';
import { MediaFile, UploadFileData } from '../../types/course';

export class MediaService {
  /**
   * Upload un fichier
   */
  static async uploadFile(data: UploadFileData, onProgress?: (progress: number) => void): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('content_type', data.contentType);
    if (data.lessonId) formData.append('lesson_id', data.lessonId);
    if (data.courseId) formData.append('course_id', data.courseId);

    // Utiliser fetch avec onProgress pour le tracking
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Upload multiple fichiers
   */
  static async uploadBulkFiles(
    files: File[],
    contentType: string,
    courseId?: string
  ): Promise<MediaFile[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('content_type', contentType);
    if (courseId) formData.append('course_id', courseId);

    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/media/upload-bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'upload');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Récupérer les infos d'un fichier
   */
  static async getMediaFile(id: string): Promise<MediaFile> {
    const response = await apiRequest(`/media/${id}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Supprimer un fichier
   */
  static async deleteMediaFile(id: string): Promise<void> {
    await apiRequest(`/media/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Télécharger un fichier
   */
  static getDownloadUrl(id: string): string {
    const token = localStorage.getItem('token');
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/media/${id}/download?token=${token}`;
  }

  /**
   * Récupérer les fichiers d'une leçon
   */
  static async getLessonMedia(lessonId: string): Promise<MediaFile[]> {
    const response = await apiRequest(`/media/lesson/${lessonId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer tous les fichiers d'un cours
   */
  static async getCourseMedia(courseId: string): Promise<MediaFile[]> {
    const response = await apiRequest(`/media/course/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Obtenir les types de fichiers acceptés selon le type de contenu
   */
  static getAllowedFileTypes(contentType: string): string[] {
    const types: Record<string, string[]> = {
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      presentation: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      h5p: ['application/zip'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };
    return types[contentType] || [];
  }

  /**
   * Obtenir la taille maximale selon le type de contenu
   */
  static getMaxFileSize(contentType: string): number {
    const sizes: Record<string, number> = {
      video: 500 * 1024 * 1024, // 500MB
      document: 50 * 1024 * 1024, // 50MB
      audio: 100 * 1024 * 1024, // 100MB
      presentation: 100 * 1024 * 1024, // 100MB
      h5p: 200 * 1024 * 1024, // 200MB
      image: 10 * 1024 * 1024, // 10MB
    };
    return sizes[contentType] || 50 * 1024 * 1024; // 50MB par défaut
  }

  /**
   * Formater la taille du fichier
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Valider le type de fichier
   */
  static validateFileType(file: File, contentType: string): boolean {
    const allowedTypes = this.getAllowedFileTypes(contentType);
    return allowedTypes.includes(file.type);
  }
}

export const mediaService = MediaService;