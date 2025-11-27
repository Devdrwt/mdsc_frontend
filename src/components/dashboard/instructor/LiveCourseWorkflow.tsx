'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileText, 
  Send, 
  Calendar, 
  Users, 
  BookOpen,
  Loader as LoaderIcon,
  ArrowRight,
  ArrowLeft,
  X,
  File,
  CheckCircle,
  Clock,
  Lock as LockIcon
} from 'lucide-react';
import { courseService } from '../../../lib/services/courseService';
import { evaluationService } from '../../../lib/services/evaluationService';
import { mediaService } from '../../../lib/services/mediaService';
import EvaluationBuilder from './EvaluationBuilder';
import toast from '../../../lib/utils/toast';
import { useNotification } from '../../../lib/hooks/useNotification';

interface LiveCourseWorkflowProps {
  courseId: string;
  course: any;
  onComplete?: () => void;
  courseStatus?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
}

type WorkflowStep = 'recap' | 'support' | 'evaluation' | 'approval';

export default function LiveCourseWorkflow({ courseId, course, onComplete, courseStatus }: LiveCourseWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('recap');
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [supportFiles, setSupportFiles] = useState<any[]>([]);
  const [uploadingSupport, setUploadingSupport] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const { success, error: notifyError } = useNotification() as any;

  useEffect(() => {
    // Charger l'évaluation si elle existe
    const loadEvaluation = async () => {
      try {
        setLoadingEvaluation(true);
        const evalData = await evaluationService.getCourseEvaluation(courseId);
        if (evalData) {
          setEvaluation(evalData);
          // Si l'évaluation existe, permettre d'aller à l'étape d'approbation
          if (currentStep === 'evaluation') {
            setCurrentStep('approval');
          }
        }
      } catch (err) {
        // Pas d'évaluation encore créée, c'est normal
        console.log('Aucune évaluation trouvée pour ce cours');
      } finally {
        setLoadingEvaluation(false);
      }
    };

    // Charger les fichiers de support existants
    const loadSupportFiles = async () => {
      try {
        const courseIdNum = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
        if (courseIdNum) {
          const media = await mediaService.getCourseMedia(courseIdNum.toString());
          // Filtrer les fichiers de type document
          const docs = media.filter((m: any) => 
            m.file_category === 'document' || 
            m.fileCategory === 'document' ||
            m.file_type?.includes('pdf') ||
            m.file_type?.includes('document')
          );
          setSupportFiles(docs);
        }
      } catch (err) {
        console.log('Erreur lors du chargement des fichiers de support:', err);
      }
    };

    loadEvaluation();
    loadSupportFiles();
  }, [courseId]);

  const handleSupportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingSupport(true);
    try {
      const courseIdNum = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
      if (!courseIdNum) {
        throw new Error('ID de cours invalide');
      }

      const fileArray = Array.from(files);
      // Utiliser l'ancienne signature pour compatibilité
      const uploaded = await mediaService.uploadBulkFiles(fileArray, 'document', courseIdNum.toString());

      setSupportFiles(prev => [...prev, ...uploaded]);
      toast.success('Fichiers uploadés', `${uploaded.length} fichier(s) de support uploadé(s) avec succès`);
    } catch (err: any) {
      console.error('Erreur upload support:', err);
      notifyError?.('Erreur', err.message || 'Impossible d\'uploader les fichiers de support');
    } finally {
      setUploadingSupport(false);
      // Réinitialiser l'input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteSupport = async (fileId: number | string) => {
    try {
      await mediaService.deleteMediaFile(String(fileId));
      setSupportFiles(prev => prev.filter(f => f.id !== fileId && (f as any).media_id !== fileId));
      toast.success('Fichier supprimé', 'Le fichier de support a été supprimé');
    } catch (err: any) {
      notifyError?.('Erreur', err.message || 'Impossible de supprimer le fichier');
    }
  };

  const handleEvaluationSaved = async () => {
    try {
      const evalData = await evaluationService.getCourseEvaluation(courseId);
      setEvaluation(evalData);
      success?.('Évaluation sauvegardée', 'L\'évaluation finale a été créée avec succès');
      // Passer automatiquement à l'étape d'approbation
      setCurrentStep('approval');
    } catch (err) {
      notifyError?.('Erreur', 'Impossible de recharger l\'évaluation');
    }
  };

  const handleRequestApproval = async () => {
    if (!evaluation) {
      notifyError?.('Évaluation requise', 'Vous devez créer une évaluation finale avant de demander l\'approbation');
      setCurrentStep('evaluation');
      return;
    }

    setRequestingApproval(true);
    try {
      await courseService.requestCoursePublication(courseId);
      success?.('Demande envoyée', 'Votre demande de publication a été envoyée. Elle sera examinée par un administrateur.');
      onComplete?.();
    } catch (err: any) {
      console.error('Erreur demande approbation:', err);
      notifyError?.('Erreur', err.message || 'Impossible d\'envoyer la demande de publication');
    } finally {
      setRequestingApproval(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const steps: { key: WorkflowStep; label: string; icon: React.ReactNode }[] = [
    { key: 'recap', label: 'Récapitulatif', icon: <BookOpen className="h-5 w-5" /> },
    { key: 'support', label: 'Support de cours', icon: <Upload className="h-5 w-5" /> },
    { key: 'evaluation', label: 'Évaluation finale', icon: <FileText className="h-5 w-5" /> },
    { key: 'approval', label: 'Demande d\'approbation', icon: <Send className="h-5 w-5" /> },
  ];

  const getStepStatus = (step: WorkflowStep): 'completed' | 'current' | 'pending' => {
    const stepIndex = steps.findIndex(s => s.key === step);
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Indicateur de progression */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Configuration du cours en Live</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Cours en Live
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key);
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : status === 'current'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'étape actuelle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 'recap' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Récapitulatif des informations du cours</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Informations générales</h4>
                <div>
                  <span className="text-sm text-gray-600">Titre :</span>
                  <p className="font-medium text-gray-900">{course?.title || 'Non défini'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Description :</span>
                  <p className="text-gray-700 mt-1">{course?.description || 'Non définie'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Catégorie :</span>
                  <p className="font-medium text-gray-900">
                    {course?.category_name || 
                     (typeof course?.category === 'string' ? course.category : course?.category?.name) || 
                     'Non définie'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Niveau :</span>
                  <p className="font-medium text-gray-900">
                    {course?.difficulty === 'beginner' ? 'Débutant' :
                     course?.difficulty === 'intermediate' ? 'Intermédiaire' :
                     course?.difficulty === 'advanced' ? 'Avancé' : course?.difficulty || 'Non défini'}
                  </p>
                </div>
              </div>

              {/* Dates et limites */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Dates et limites</h4>
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600">Date limite d'inscription :</span>
                    <p className="font-medium text-gray-900">
                      {formatDate(course?.enrollment_deadline || course?.enrollmentDeadline)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600">Date de début :</span>
                    <p className="font-medium text-gray-900">
                      {formatDate(course?.course_start_date || course?.courseStartDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600">Date de fin :</span>
                    <p className="font-medium text-gray-900">
                      {formatDate(course?.course_end_date || course?.courseEndDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-600">Nombre maximum d'étudiants :</span>
                    <p className="font-medium text-gray-900">
                      {course?.max_students || course?.maxStudents || 'Illimité'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setCurrentStep('support')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Continuer</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'support' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Support de cours (optionnel)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vous pouvez uploader des documents de support pour vos étudiants (PDF, Word, etc.)
                </p>
              </div>
            </div>

            {/* Upload de fichiers */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleSupportUpload}
                  className="hidden"
                  disabled={uploadingSupport}
                />
                <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {uploadingSupport ? (
                    <>
                      <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                      <span>Upload en cours...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      <span>Choisir des fichiers de support</span>
                    </>
                  )}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés : PDF, Word, PowerPoint, Texte (Max 50 MB par fichier)
              </p>
            </div>

            {/* Liste des fichiers uploadés */}
            {supportFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Fichiers de support uploadés :</h4>
                {supportFiles.map((file) => (
                  <div
                    key={file.id || (file as any).media_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {file.original_filename || file.originalFilename || file.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file_size || file.fileSize || 0) / 1024 / 1024} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSupport(file.id || (file as any).media_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => setCurrentStep('recap')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>
              <button
                onClick={() => setCurrentStep('evaluation')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Continuer vers l'évaluation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'evaluation' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Création de l'évaluation finale</h3>
              <p className="text-sm text-gray-600 mt-1">
                L'évaluation finale est <strong className="text-red-600">obligatoire</strong> pour permettre aux étudiants d'obtenir un certificat.
              </p>
            </div>

            {loadingEvaluation ? (
              <div className="flex items-center justify-center py-12">
                <LoaderIcon className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Chargement de l'évaluation...</span>
              </div>
            ) : (
              <>
                {evaluation ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        Évaluation finale créée avec succès
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Vous pouvez modifier l'évaluation ci-dessous ou continuer vers la demande d'approbation.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">
                        Aucune évaluation finale créée
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      Vous devez créer une évaluation finale avant de pouvoir demander l'approbation du cours.
                    </p>
                  </div>
                )}

                <EvaluationBuilder
                  courseId={courseId}
                  initialEvaluation={evaluation}
                  onSave={handleEvaluationSaved}
                  onCancel={() => {}}
                />
              </>
            )}
          </div>
        )}

        {currentStep === 'approval' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Demande d'approbation</h3>
              <p className="text-sm text-gray-600 mt-1">
                Vérifiez que toutes les conditions sont remplies avant de demander l'approbation de l'administrateur.
              </p>
            </div>

            {/* Vérification des conditions */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Conditions de publication :</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {course?.title && course.title.length >= 5 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={course?.title && course.title.length >= 5 ? 'text-gray-700' : 'text-red-600'}>
                    Titre valide (min. 5 caractères)
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {course?.description && course.description.length >= 10 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={course?.description && course.description.length >= 10 ? 'text-gray-700' : 'text-red-600'}>
                    Description valide (min. 10 caractères)
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {course?.enrollment_deadline || course?.enrollmentDeadline ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={course?.enrollment_deadline || course?.enrollmentDeadline ? 'text-gray-700' : 'text-red-600'}>
                    Date limite d'inscription définie
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {course?.course_start_date || course?.courseStartDate ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={course?.course_start_date || course?.courseStartDate ? 'text-gray-700' : 'text-red-600'}>
                    Date de début définie
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {course?.course_end_date || course?.courseEndDate ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={course?.course_end_date || course?.courseEndDate ? 'text-gray-700' : 'text-red-600'}>
                    Date de fin définie
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {course?.max_students || course?.maxStudents ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={course?.max_students || course?.maxStudents ? 'text-gray-700' : 'text-red-600'}>
                    Nombre maximum d'étudiants défini
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {evaluation ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={evaluation ? 'text-gray-700' : 'text-red-600'}>
                    Évaluation finale créée <span className="text-red-600">(Obligatoire)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => setCurrentStep('evaluation')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>
              <div className="flex-1 ml-4">
                {courseStatus === 'pending_approval' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                    <LockIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Demande envoyée</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Ce cours est actuellement en attente de validation par un administrateur.
                      </p>
                    </div>
                  </div>
                )}
                {(courseStatus === 'published' || courseStatus === 'approved') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {courseStatus === 'approved' ? 'Cours approuvé' : 'Cours publié'}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        {courseStatus === 'approved'
                          ? 'Le cours sera publié dès finalisation par l’équipe.'
                          : 'Ce cours est disponible pour les étudiants.'}
                      </p>
                    </div>
                  </div>
                )}
                {(courseStatus === 'draft' || courseStatus === 'rejected' || !courseStatus) && (
                  <button
                    onClick={handleRequestApproval}
                    disabled={requestingApproval || !evaluation}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {requestingApproval ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Demander l'approbation</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

