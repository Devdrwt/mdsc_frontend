import { useState, useEffect } from 'react';
import { progressService } from '../../lib/services/progressService';
import { gamificationService } from '../../lib/services/gamificationService';
import { certificateService } from '../../lib/services/certificateService';

interface UseAutoProgressTrackingResult {
  progress: number;
  isCompleting: boolean;
  markAsCompleted: (timeSpent: number) => Promise<void>;
  checkCertificateEligibility: () => Promise<boolean>;
  xpGained: number;
  certificateGenerated: boolean;
  error: string | null;
}

interface UseAutoProgressTrackingOptions {
  enrollmentId?: string;
  courseId: string;
  lessonId: string;
  onProgressUpdated?: (progress: number) => void;
  onCertificateGenerated?: () => void;
}

/**
 * Hook personnalisé pour le traçage automatique de la progression
 * - Marque les leçons comme complétées
 * - Ajoute les XP automatiquement
 * - Vérifie l'éligibilité aux certificats
 * - Génère les certificats automatiquement
 */
export function useAutoProgressTracking({
  enrollmentId,
  courseId,
  lessonId,
  onProgressUpdated,
  onCertificateGenerated,
}: UseAutoProgressTrackingOptions): UseAutoProgressTrackingResult {
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger la progression initiale
    loadProgress();
  }, [enrollmentId, lessonId]);

  const loadProgress = async () => {
    if (!enrollmentId) return;

    try {
      const progressData = await progressService.getEnrollmentProgress(Number(enrollmentId));
      const lessonProgress = progressData.find(p => p.lesson_id === lessonId);
      
      if (lessonProgress) {
        setProgress(lessonProgress.completion_percentage || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
    }
  };

  const markAsCompleted = async (timeSpent: number) => {
    if (!enrollmentId) {
      console.warn('Enrollment ID manquant, impossible de marquer comme complété');
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      // 1. Marquer la leçon comme complétée
      await progressService.updateLessonProgress(
        Number(enrollmentId),
        Number(lessonId),
        {
          status: 'completed',
          completion_percentage: 100,
          time_spent: timeSpent,
        }
      );

      setProgress(100);
      
      // 2. Ajouter des points XP pour complétion de leçon
      try {
        await gamificationService.addXP(50, `Leçon complétée : ${lessonId}`);
        setXpGained(50);
        console.log('✅ +50 XP ajoutés pour complétion de leçon');
      } catch (xpError) {
        console.warn('Erreur lors de l\'ajout de XP:', xpError);
        // Ne pas bloquer le processus si l'ajout de XP échoue
      }

      // 3. Appeler le callback de progression
      onProgressUpdated?.(100);

      // 4. Vérifier l'éligibilité au certificat après un court délai
      setTimeout(async () => {
        try {
          await checkCertificateEligibility();
        } catch (certError) {
          console.warn('Erreur lors de la vérification du certificat:', certError);
        }
      }, 1000);

    } catch (err: any) {
      console.error('Erreur lors de la complétion de la leçon:', err);
      setError(err.message || 'Erreur lors de la complétion');
      throw err;
    } finally {
      setIsCompleting(false);
    }
  };

  const checkCertificateEligibility = async (): Promise<boolean> => {
    if (!courseId) return false;

    try {
      // Récupérer la progression du cours
      const courseProgress = await progressService.getCourseProgress(Number(courseId));
      
      // Vérifier si la progression est à 100%
      const isComplete = courseProgress.progress === 100;

      if (isComplete && !certificateGenerated) {
        // Générer le certificat automatiquement
        try {
          const certificate = await certificateService.generateCertificate(courseId);
          console.log('🎉 Certificat généré automatiquement:', certificate);
          
          setCertificateGenerated(true);
          onCertificateGenerated?.();
          
          return true;
        } catch (certError) {
          console.error('Erreur lors de la génération du certificat:', certError);
          // Ne pas bloquer si la génération échoue
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'éligibilité:', error);
      return false;
    }
  };

  return {
    progress,
    isCompleting,
    markAsCompleted,
    checkCertificateEligibility,
    xpGained,
    certificateGenerated,
    error,
  };
}

export default useAutoProgressTracking;

