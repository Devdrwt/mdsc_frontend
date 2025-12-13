/**
 * EXEMPLE D'INTÉGRATION - Upload direct MinIO
 * 
 * Ce fichier montre comment utiliser le nouveau service d'upload direct MinIO
 * dans votre composant existant de création/édition de leçon
 */

import { useState } from 'react';
import { uploadFileToMinIO } from '@/lib/services/minioUpload';

// Exemple 1: Composant simple d'upload
export function SimpleVideoUpload({ lessonId }: { lessonId: number }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Réinitialiser l'état
    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);

    try {
      const result = await uploadFileToMinIO({
        file,
        contentType: file.type,
        lessonId,
        onProgress: (p) => {
          setProgress(p);
          console.log(`Upload: ${p}%`);
        }
      });

      if (result.success && result.data) {
        console.log('✅ Upload réussi!', result.data);
        setUploadedUrl(result.data.url);
        alert('Vidéo uploadée avec succès !');
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      console.error('❌ Erreur upload:', err);
      setError(err.message);
      alert(`Erreur: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h3>Upload Vidéo (Direct MinIO)</h3>
      
      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {uploading && (
        <div className="progress-container">
          <p>Upload en cours... {progress}%</p>
          <progress value={progress} max={100} style={{ width: '100%' }} />
          <p className="text-sm text-gray-500">
            Fichiers volumineux supportés (jusqu'à 500MB)
          </p>
        </div>
      )}

      {uploadedUrl && (
        <div className="success-message">
          <p className="text-green-600">✅ Upload réussi !</p>
          <p className="text-sm">URL: {uploadedUrl}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p className="text-red-600">❌ Erreur: {error}</p>
        </div>
      )}
    </div>
  );
}

// Exemple 2: Remplacement dans un formulaire existant
export function LessonFormWithDirectUpload() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoFileId: null as number | null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoUpload = async (file: File, lessonId: number) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFileToMinIO({
        file,
        contentType: 'video/mp4',
        lessonId,
        onProgress: setUploadProgress
      });

      if (result.success && result.data) {
        // Mettre à jour le formulaire avec les données de la vidéo
        setFormData(prev => ({
          ...prev,
          videoUrl: result.data!.url,
          videoFileId: result.data!.mediaFileId
        }));
        
        console.log('✅ Vidéo uploadée:', result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Upload échoué');
      }
    } catch (error: any) {
      console.error('❌ Erreur upload:', error);
      alert(`Erreur: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Soumettre le formulaire avec videoFileId
    // qui a été défini après l'upload
    console.log('Soumission formulaire:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Titre de la leçon</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>

      <div>
        <label>Vidéo de la leçon</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Uploader immédiatement quand le fichier est sélectionné
              handleVideoUpload(file, 123); // Remplacer par lessonId réel
            }
          }}
          disabled={uploading}
        />
        
        {uploading && (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span>Upload en cours...</span>
              <span>{uploadProgress}%</span>
            </div>
            <progress value={uploadProgress} max={100} className="w-full" />
          </div>
        )}

        {formData.videoUrl && !uploading && (
          <div className="mt-2 p-2 bg-green-50 text-green-700 rounded">
            ✅ Vidéo uploadée avec succès
          </div>
        )}
      </div>

      <button type="submit" disabled={uploading || !formData.videoUrl}>
        {uploading ? 'Upload en cours...' : 'Créer la leçon'}
      </button>
    </form>
  );
}

// Exemple 3: Upload multiple avec suivi détaillé
import { uploadMultipleFilesToMinIO } from '@/lib/services/minioUpload';

export function MultipleFilesUpload({ lessonId }: { lessonId: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<Record<number, number>>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  const handleMultipleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);

    const uploadResults = await uploadMultipleFilesToMinIO(files, {
      lessonId,
      onFileProgress: (fileIndex, progress) => {
        setFileProgress(prev => ({ ...prev, [fileIndex]: progress }));
      },
      onOverallProgress: (progress) => {
        setOverallProgress(progress);
      }
    });

    setResults(uploadResults);
    setUploading(false);

    const successCount = uploadResults.filter(r => r.success).length;
    alert(`${successCount}/${files.length} fichiers uploadés avec succès`);
  };

  return (
    <div>
      <h3>Upload Multiple (Vidéos, PDFs, Audio...)</h3>
      
      <input
        type="file"
        multiple
        accept="video/*,audio/*,application/pdf"
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          setFiles(selectedFiles);
        }}
        disabled={uploading}
      />

      {files.length > 0 && !uploading && (
        <div className="mt-2">
          <p>{files.length} fichier(s) sélectionné(s)</p>
          <button onClick={handleMultipleUpload}>
            Uploader tous les fichiers
          </button>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <h4>Progression globale: {overallProgress}%</h4>
          <progress value={overallProgress} max={100} className="w-full mb-4" />

          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="border p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-sm">{fileProgress[index] || 0}%</span>
                </div>
                <progress value={fileProgress[index] || 0} max={100} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h4>Résultats:</h4>
          {results.map((result, index) => (
            <div key={index} className={result.success ? 'text-green-600' : 'text-red-600'}>
              {result.success ? '✅' : '❌'} {files[index].name}
              {result.error && ` - ${result.error}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NOTES D'UTILISATION:
 * 
 * 1. Importer le service:
 *    import { uploadFileToMinIO } from '@/lib/services/minioUpload';
 * 
 * 2. Utiliser dans votre composant existant:
 *    - Remplacer l'ancien uploadFile() par uploadFileToMinIO()
 *    - Ajouter onProgress pour afficher la progression
 *    - Gérer result.success et result.data
 * 
 * 3. Avantages:
 *    ✅ Plus de timeout pour les gros fichiers
 *    ✅ Upload direct vers MinIO (plus rapide)
 *    ✅ Progression précise en temps réel
 *    ✅ Fichiers jusqu'à 500MB (ou plus)
 * 
 * 4. Migration simple:
 *    - Copier minioUpload.ts dans votre projet
 *    - Remplacer les appels d'upload existants
 *    - Tester avec un gros fichier (200-300 MB)
 */
