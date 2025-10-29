// Fichier de référence pour mettre à jour mediaService.ts
// Remplacer le contenu existant par cette implémentation

import { apiRequest } from './api';
import { MediaFile } from '../../types/course';

export class MediaService {
  /**
   * Upload un fichier
   */
  static async uploadFile(
    file: File,
    options: {
      lesson_id?: number;
      course_id?: number;
      file_category: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other';
    }
  ): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_category', options.file_category);
    if (options.lesson_id) formData.append('lesson_id', options.lesson_id.toString());
    if (options.course_id) formData.append('course_id', options.course_id.toString());

    const response = await apiRequest('/media/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas définir Content-Type manuellement pour FormData
      },
    });
    return response.data;
  }

  /**
   * Upload multiple fichiers
   */
  static async uploadBulkFiles(
    files: File[],
    options: {
      lesson_id?: number;
      course_id?: number;
      file_category: 'video' | 'document' | 'audio' | 'image' | 'presentation' | 'h5p' | 'other';
    }
  ): Promise<MediaFile[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    formData.append('file_category', options.file_category);
    if (options.lesson_id) formData.append('lesson_id', options.lesson_id.toString());
    if (options.course_id) formData.append('course_id', options.course_id.toString());

    const response = await apiRequest('/media/upload-bulk', {
      method: 'POST',
      body: formData,
    });
    return response.data;
  }

  /**
   * Récupérer un fichier média
   */
  static async getMediaFile(mediaId: number): Promise<MediaFile> {
    const response = await apiRequest(`/media/${mediaId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer les fichiers d'une leçon
   */
  static async getLessonMediaFiles(lessonId: number): Promise<MediaFile[]> {
    const response = await apiRequest(`/media/lesson/${lessonId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Récupérer les fichiers d'un cours
   */
  static async getCourseMediaFiles(courseId: number): Promise<MediaFile[]> {
    const response = await apiRequest(`/media/course/${courseId}`, {
      method: 'GET',
    });
    return response.data;
  }

  /**
   * Télécharger un fichier
   */
  static async downloadMediaFile(mediaId: number, filename?: string): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/media/${mediaId}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'file');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Supprimer un fichier
   */
  static async deleteMediaFile(mediaId: number): Promise<void> {
    await apiRequest(`/media/${mediaId}`, {
      method: 'DELETE',
    });
  }
}

export const mediaService = MediaService;
