/**
 * Service d'upload direct vers MinIO avec URLs pré-signées
 * Évite les timeouts en contournant le serveur Node.js
 */

import { apiPost } from './api';

export interface PresignedUploadOptions {
  file: File;
  contentType?: string;
  lessonId?: number;
  moduleId?: number;
  onProgress?: (progress: number) => void;
}

export interface PresignedUploadResult {
  success: boolean;
  data?: {
    mediaFileId: number;
    url: string;
    objectName: string;
    bucket: string;
  };
  error?: string;
}

/**
 * Upload un fichier directement vers MinIO via une URL pré-signée
 * Cette méthode évite les timeouts car l'upload se fait en direct vers MinIO
 */
export async function uploadFileToMinIO(
  options: PresignedUploadOptions
): Promise<PresignedUploadResult> {
  const { file, contentType, lessonId, moduleId, onProgress } = options;

  try {
    console.log('🚀 [MINIO UPLOAD] Début upload direct:', {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      contentType: contentType || file.type
    });

    // ÉTAPE 1 : Demander une URL pré-signée au backend
    const presignedResponse = await apiPost('/media/upload/presigned-url', {
      fileName: file.name,
      fileType: file.type,
      contentType: contentType || file.type,
      lessonId,
      moduleId
    });

    if (!presignedResponse.success || !presignedResponse.data) {
      throw new Error('Impossible de générer l\'URL d\'upload');
    }

    const { uploadUrl, objectName, bucket, publicUrl } = presignedResponse.data;

    console.log('✅ [MINIO UPLOAD] URL pré-signée reçue:', {
      objectName,
      bucket,
      expiresIn: '2 heures'
    });

    // ÉTAPE 2 : Upload direct vers MinIO avec XMLHttpRequest pour suivre la progression
    await uploadToPresignedUrl(uploadUrl, file, onProgress);

    console.log('✅ [MINIO UPLOAD] Fichier uploadé vers MinIO');

    // ÉTAPE 3 : Confirmer l'upload au backend pour enregistrer en BDD
    const confirmResponse = await apiPost('/media/upload/confirm', {
      objectName,
      bucket,
      fileName: file.name,
      fileSize: file.size,
      contentType: contentType || file.type,
      lessonId,
      moduleId
    });

    if (!confirmResponse.success) {
      throw new Error('Erreur lors de la confirmation de l\'upload');
    }

    console.log('✅ [MINIO UPLOAD] Upload confirmé en BDD:', confirmResponse.data);

    return {
      success: true,
      data: confirmResponse.data
    };

  } catch (error: any) {
    console.error('❌ [MINIO UPLOAD] Erreur:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'upload'
    };
  }
}

/**
 * Upload vers une URL pré-signée avec suivi de progression
 */
function uploadToPresignedUrl(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Suivi de la progression
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
        console.log(`📊 [MINIO UPLOAD] Progression: ${progress}%`);
      }
    });

    // Succès
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('✅ [MINIO UPLOAD] Upload réussi vers MinIO');
        resolve();
      } else {
        console.error('❌ [MINIO UPLOAD] Erreur HTTP:', xhr.status, xhr.statusText);
        reject(new Error(`Erreur HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    });

    // Erreur réseau
    xhr.addEventListener('error', () => {
      console.error('❌ [MINIO UPLOAD] Erreur réseau');
      reject(new Error('Erreur réseau lors de l\'upload'));
    });

    // Timeout
    xhr.addEventListener('timeout', () => {
      console.error('❌ [MINIO UPLOAD] Timeout');
      reject(new Error('Timeout lors de l\'upload'));
    });

    // Abort
    xhr.addEventListener('abort', () => {
      console.error('⚠️ [MINIO UPLOAD] Upload annulé');
      reject(new Error('Upload annulé'));
    });

    // Configuration
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    
    // Timeout de 2 heures (même que l'expiration de l'URL)
    xhr.timeout = 2 * 60 * 60 * 1000;

    // Envoyer le fichier
    xhr.send(file);
  });
}

/**
 * Upload multiple fichiers vers MinIO
 */
export async function uploadMultipleFilesToMinIO(
  files: File[],
  options: {
    contentType?: string;
    lessonId?: number;
    moduleId?: number;
    onFileProgress?: (fileIndex: number, progress: number) => void;
    onOverallProgress?: (progress: number) => void;
  }
): Promise<PresignedUploadResult[]> {
  const results: PresignedUploadResult[] = [];
  const { contentType, lessonId, moduleId, onFileProgress, onOverallProgress } = options;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    console.log(`📤 [MINIO UPLOAD] Upload ${i + 1}/${files.length}: ${file.name}`);

    const result = await uploadFileToMinIO({
      file,
      contentType,
      lessonId,
      moduleId,
      onProgress: (progress) => {
        if (onFileProgress) {
          onFileProgress(i, progress);
        }
        
        // Calculer progression globale
        if (onOverallProgress) {
          const overallProgress = Math.round(
            ((i + progress / 100) / files.length) * 100
          );
          onOverallProgress(overallProgress);
        }
      }
    });

    results.push(result);

    // Arrêter si une erreur survient
    if (!result.success) {
      console.error(`❌ [MINIO UPLOAD] Échec pour ${file.name}`);
      break;
    }
  }

  return results;
}
