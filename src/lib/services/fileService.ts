import { apiRequest } from './api';

export interface FileUpload {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  quality?: number;
  tags?: string[];
  description?: string;
  category?: string;
  isPublic?: boolean;
  isProcessed?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
}

export interface FileUploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface FileUploadOptions {
  category?: string;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
  quality?: number;
  format?: string;
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
  compress?: boolean;
  generateThumbnail?: boolean;
}

export interface FileFilter {
  userId?: string;
  category?: string;
  mimeType?: string;
  isPublic?: boolean;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  size?: {
    min?: number;
    max?: number;
  };
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  filesByCategory: Array<{
    category: string;
    count: number;
    size: number;
  }>;
  filesByType: Array<{
    mimeType: string;
    count: number;
    size: number;
  }>;
  filesByMonth: Array<{
    month: string;
    count: number;
    size: number;
  }>;
  averageFileSize: number;
  storageUsed: number;
  storageLimit: number;
}

export interface FileExport {
  format: 'csv' | 'xlsx' | 'pdf';
  data: FileUpload[];
  filename: string;
  generatedAt: string;
}

// Service principal
export class FileService {
  // Uploader un fichier
  static async uploadFile(
    file: File,
    options?: FileUploadOptions,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await apiRequest('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas définir Content-Type, laissez le navigateur le faire
      },
    });

    return response.data;
  }

  // Uploader plusieurs fichiers
  static async uploadFiles(
    files: File[],
    options?: FileUploadOptions,
    onProgress?: (progress: FileUploadProgress[]) => void
  ): Promise<FileUpload[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await apiRequest('/files/upload-multiple', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas définir Content-Type, laissez le navigateur le faire
      },
    });

    return response.data;
  }

  // Récupérer tous les fichiers de l'utilisateur
  static async getMyFiles(filter?: FileFilter): Promise<FileUpload[]> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.mimeType) params.append('mimeType', filter.mimeType);
    if (filter?.isPublic !== undefined) params.append('isPublic', filter.isPublic.toString());
    if (filter?.tags) params.append('tags', filter.tags.join(','));
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.size?.min) params.append('sizeMin', filter.size.min.toString());
    if (filter?.size?.max) params.append('sizeMax', filter.size.max.toString());

    const response = await apiRequest(`/files/my?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer tous les fichiers
  static async getAllFiles(filter?: FileFilter): Promise<FileUpload[]> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.mimeType) params.append('mimeType', filter.mimeType);
    if (filter?.isPublic !== undefined) params.append('isPublic', filter.isPublic.toString());
    if (filter?.tags) params.append('tags', filter.tags.join(','));
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.size?.min) params.append('sizeMin', filter.size.min.toString());
    if (filter?.size?.max) params.append('sizeMax', filter.size.max.toString());

    const response = await apiRequest(`/files?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer un fichier par ID
  static async getFile(fileId: string): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Mettre à jour un fichier
  static async updateFile(fileId: string, updates: Partial<FileUpload>): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  // Supprimer un fichier
  static async deleteFile(fileId: string): Promise<void> {
    await apiRequest(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Supprimer plusieurs fichiers
  static async deleteFiles(fileIds: string[]): Promise<void> {
    await apiRequest('/files/delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ fileIds }),
    });
  }

  // Télécharger un fichier
  static async downloadFile(fileId: string): Promise<Blob> {
    const response = await apiRequest(`/files/${fileId}/download`, {
      method: 'GET',
    });
    return new Blob([response.data], { type: 'application/octet-stream' });
  }

  // Télécharger plusieurs fichiers
  static async downloadFiles(fileIds: string[]): Promise<Blob> {
    const response = await apiRequest('/files/download-multiple', {
      method: 'POST',
      body: JSON.stringify({ fileIds }),
    });
    return new Blob([response.data], { type: 'application/zip' });
  }

  // Générer une URL de téléchargement
  static async generateDownloadUrl(fileId: string, expiresIn?: number): Promise<string> {
    const response = await apiRequest(`/files/${fileId}/download-url`, {
      method: 'POST',
      body: JSON.stringify({ expiresIn }),
    });
    return response.data.url;
  }

  // Générer une URL de prévisualisation
  static async generatePreviewUrl(fileId: string, expiresIn?: number): Promise<string> {
    const response = await apiRequest(`/files/${fileId}/preview-url`, {
      method: 'POST',
      body: JSON.stringify({ expiresIn }),
    });
    return response.data.url;
  }

  // Récupérer les fichiers par catégorie
  static async getFilesByCategory(category: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par type MIME
  static async getFilesByMimeType(mimeType: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/mime-type/${mimeType}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par utilisateur
  static async getFilesByUser(userId: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/user/${userId}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par tags
  static async getFilesByTags(tags: string[]): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/tags?tags=${tags.join(',')}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers publics
  static async getPublicFiles(): Promise<FileUpload[]> {
    const response = await apiRequest('/files/public', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers récents
  static async getRecentFiles(limit: number = 10): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/recent?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers populaires
  static async getPopularFiles(limit: number = 10): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/popular?limit=${limit}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Rechercher des fichiers
  static async searchFiles(query: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les statistiques des fichiers
  static async getFileStats(): Promise<FileStats> {
    const response = await apiRequest('/files/stats', {
      method: 'GET',
    });
    return response.data;
  }

  // Exporter les fichiers
  static async exportFiles(filter?: FileFilter, format: string = 'csv'): Promise<FileExport> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.mimeType) params.append('mimeType', filter.mimeType);
    if (filter?.isPublic !== undefined) params.append('isPublic', filter.isPublic.toString());
    if (filter?.tags) params.append('tags', filter.tags.join(','));
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.size?.min) params.append('sizeMin', filter.size.min.toString());
    if (filter?.size?.max) params.append('sizeMax', filter.size.max.toString());
    params.append('format', format);

    const response = await apiRequest(`/files/export?${params.toString()}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Redimensionner une image
  static async resizeImage(fileId: string, width: number, height: number, maintainAspectRatio: boolean = true): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/resize`, {
      method: 'POST',
      body: JSON.stringify({ width, height, maintainAspectRatio }),
    });
    return response.data;
  }

  // Compresser un fichier
  static async compressFile(fileId: string, quality: number): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/compress`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    });
    return response.data;
  }

  // Générer une miniature
  static async generateThumbnail(fileId: string, size: number = 150): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/thumbnail`, {
      method: 'POST',
      body: JSON.stringify({ size }),
    });
    return response.data;
  }

  // Convertir un fichier
  static async convertFile(fileId: string, targetFormat: string): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/convert`, {
      method: 'POST',
      body: JSON.stringify({ targetFormat }),
    });
    return response.data;
  }

  // Extraire les métadonnées d'un fichier
  static async extractMetadata(fileId: string): Promise<FileMetadata> {
    const response = await apiRequest(`/files/${fileId}/metadata`, {
      method: 'POST',
    });
    return response.data;
  }

  // Traiter un fichier
  static async processFile(fileId: string, processingOptions: any): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/process`, {
      method: 'POST',
      body: JSON.stringify({ processingOptions }),
    });
    return response.data;
  }

  // Récupérer le statut de traitement d'un fichier
  static async getProcessingStatus(fileId: string): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/processing-status`, {
      method: 'GET',
    });
    return response.data;
  }

  // Annuler le traitement d'un fichier
  static async cancelProcessing(fileId: string): Promise<void> {
    await apiRequest(`/files/${fileId}/cancel-processing`, {
      method: 'POST',
    });
  }

  // Récupérer les fichiers en cours de traitement
  static async getProcessingFiles(): Promise<FileUpload[]> {
    const response = await apiRequest('/files/processing', {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers échoués
  static async getFailedFiles(): Promise<FileUpload[]> {
    const response = await apiRequest('/files/failed', {
      method: 'GET',
    });
    return response.data;
  }

  // Relancer le traitement d'un fichier
  static async retryProcessing(fileId: string): Promise<FileUpload> {
    const response = await apiRequest(`/files/${fileId}/retry-processing`, {
      method: 'POST',
    });
    return response.data;
  }

  // Récupérer les fichiers par période
  static async getFilesByPeriod(startDate: string, endDate: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/period?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par taille
  static async getFilesBySize(minSize: number, maxSize: number): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/size?min=${minSize}&max=${maxSize}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par format
  static async getFilesByFormat(format: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/format/${format}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par qualité
  static async getFilesByQuality(minQuality: number, maxQuality: number): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/quality?min=${minQuality}&max=${maxQuality}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par durée
  static async getFilesByDuration(minDuration: number, maxDuration: number): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/duration?min=${minDuration}&max=${maxDuration}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par résolution
  static async getFilesByResolution(minWidth: number, minHeight: number): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/resolution?minWidth=${minWidth}&minHeight=${minHeight}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par description
  static async getFilesByDescription(description: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/description?description=${encodeURIComponent(description)}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par statut de traitement
  static async getFilesByProcessingStatus(status: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/processing-status/${status}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par visibilité
  static async getFilesByVisibility(isPublic: boolean): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/visibility?isPublic=${isPublic}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par utilisateur et catégorie
  static async getFilesByUserAndCategory(userId: string, category: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/user/${userId}/category/${category}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par utilisateur et type MIME
  static async getFilesByUserAndMimeType(userId: string, mimeType: string): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/user/${userId}/mime-type/${mimeType}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Récupérer les fichiers par utilisateur et tags
  static async getFilesByUserAndTags(userId: string, tags: string[]): Promise<FileUpload[]> {
    const response = await apiRequest(`/files/user/${userId}/tags?tags=${tags.join(',')}`, {
      method: 'GET',
    });
    return response.data;
  }

  // Upload de photo de profil
  static async uploadProfilePhoto(file: File): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'profile-photo');

    const response = await apiRequest('/files/upload', {
      method: 'POST',
      body: formData,
    });

    return response.data;
  }

  // Upload de pièce d'identité (pour instructeurs)
  static async uploadIdentityDocument(file: File): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'identity-document');

    const response = await apiRequest('/files/upload', {
      method: 'POST',
      body: formData,
    });

    return response.data;
  }

  // Récupérer la photo de profil
  static async getProfilePhoto(): Promise<FileUpload | null> {
    try {
      const files = await this.getMyFiles({ category: 'profile-photo' });
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Error fetching profile photo:', error);
      return null;
    }
  }

  // Récupérer la pièce d'identité
  static async getIdentityDocument(): Promise<FileUpload | null> {
    try {
      const files = await this.getMyFiles({ category: 'identity-document' });
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Error fetching identity document:', error);
      return null;
    }
  }
}

// Export par défaut
export default FileService;
