'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, AlertTriangle, MessageSquare, User, Calendar, BookOpen, Award } from 'lucide-react';
import { adminService, CourseApproval } from '../../../lib/services/adminService';
import { courseService } from '../../../lib/services/courseService';
import { QuizService } from '../../../lib/services/quizService';
import { resolveMediaUrl, DEFAULT_COURSE_IMAGE } from '../../../lib/utils/media';
import { createSanitizedHtml } from '../../../lib/utils/sanitizeHtml';
import toast from '../../../lib/utils/toast';

interface CourseApprovalPanelProps {
  courseId?: string; // Si fourni, affiche un seul cours
}

export default function CourseApprovalPanel({ courseId }: CourseApprovalPanelProps) {
  const [pendingCourses, setPendingCourses] = useState<CourseApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, any>>({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingCourses();
  }, [courseId]);

  const loadPendingCourses = async () => {
    try {
      setLoading(true);
      if (courseId) {
        // Charger un seul cours
        const course = await adminService.getCourseForApproval(courseId);
        setPendingCourses(Array.isArray(course) ? course : [course]);
      } else {
        // Charger tous les cours en attente
        const courses = await adminService.getPendingCourses();
        // S'assurer que c'est un tableau
        setPendingCourses(Array.isArray(courses) ? courses : []);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des cours:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les cours en attente');
      // En cas d'erreur, s'assurer que pendingCourses est un tableau vide
      setPendingCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCourse = async (course: CourseApproval) => {
    try {
      // Utiliser course_id, id, ou courseId selon ce qui est disponible
      const courseId = course.course_id || (course as any).id || (course as any).courseId;
      if (!courseId) {
        toast.error('Erreur', 'ID du cours manquant');
        console.error('Course ID manquant dans:', course);
        return;
      }
      console.log('🔍 [CourseApprovalPanel] Chargement détails cours:', courseId);
      const courseDetails = await adminService.getCourseForApproval(String(courseId));
      // Log détaillé pour déboguer
      console.log('✅ [CourseApprovalPanel] Détails chargés:', {
        hasModules: !!courseDetails.modules,
        modulesCount: courseDetails.modules?.length || 0,
        hasEvaluation: !!courseDetails.evaluation,
        evaluation: courseDetails.evaluation,
        courseTitle: courseDetails.title || courseDetails.course_title,
        thumbnail_url: courseDetails.thumbnail_url,
        thumbnail: courseDetails.thumbnail,
        imageFields: Object.keys(courseDetails).filter(key => key.toLowerCase().includes('image') || key.toLowerCase().includes('thumbnail') || key.toLowerCase().includes('photo')),
        allKeys: Object.keys(courseDetails),
        modulesWithQuizzes: courseDetails.modules?.map((m: any) => ({
          id: m.id,
          title: m.title,
          hasQuiz: !!m.quiz,
          quiz: m.quiz,
          hasQuizzes: !!m.quizzes,
          quizzes: m.quizzes,
          hasModuleQuiz: !!m.module_quiz,
          moduleQuiz: m.module_quiz,
          allKeys: Object.keys(m || {})
        })) || []
      });
      
      // Log complet des modules pour voir la structure exacte
      if (courseDetails.modules && Array.isArray(courseDetails.modules)) {
        console.log('📦 [CourseApprovalPanel] Modules détaillés:', courseDetails.modules.map((m: any, idx: number) => ({
          index: idx,
          id: m.id,
          title: m.title,
          keys: Object.keys(m),
          quiz: m.quiz,
          module_quiz: m.module_quiz,
          quizzes: m.quizzes,
          hasLessons: !!m.lessons,
          lessonsCount: m.lessons?.length || 0,
          allData: m // Log complet pour voir toutes les données
        })));
        
        // Charger les quiz de chaque module si ils ne sont pas déjà inclus
        const loadModuleQuizzes = async () => {
          setLoadingQuizzes(true);
          const quizzesMap: Record<string, any> = {};
          
          for (const module of courseDetails.modules) {
            const moduleId = module.id;
            if (!moduleId) continue;
            
            // Vérifier d'abord si le quiz est déjà dans les données du module
            if (module.quiz || module.module_quiz || module.quizzes) {
              quizzesMap[moduleId] = module.quiz || module.module_quiz || module.quizzes?.[0];
              console.log('✅ [CourseApprovalPanel] Quiz trouvé dans les données du module:', moduleId);
              continue;
            }
            
            // Sinon, essayer de récupérer le quiz via l'API
            try {
              const quiz = await QuizService.getModuleQuiz(String(moduleId));
              if (quiz) {
                quizzesMap[moduleId] = quiz;
                console.log('✅ [CourseApprovalPanel] Quiz chargé via API pour module:', moduleId);
              } else {
                console.log('ℹ️ [CourseApprovalPanel] Aucun quiz pour le module:', moduleId);
              }
            } catch (error: any) {
              // 404 est normal si le module n'a pas de quiz
              // 403 peut aussi être normal si l'endpoint nécessite des permissions spécifiques
              // Dans ce cas, on ignore silencieusement l'erreur
              if (error.status === 404 || error.status === 403) {
                // Erreur silencieuse - le module n'a peut-être pas de quiz ou l'accès est restreint
                if (process.env.NODE_ENV === 'development') {
                  console.log('ℹ️ [CourseApprovalPanel] Quiz non accessible pour le module', moduleId, '(status:', error.status, ')');
                }
              } else {
                // Pour les autres erreurs, logger seulement en développement
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ [CourseApprovalPanel] Erreur lors du chargement du quiz du module', moduleId, ':', error);
                }
              }
            }
          }
          
          setModuleQuizzes(quizzesMap);
          setLoadingQuizzes(false);
        };
        
        loadModuleQuizzes();
      }
      
      // Log de toutes les clés du cours pour trouver l'évaluation
      const evalKeys = Object.keys(courseDetails).filter(key => 
        key.toLowerCase().includes('evaluation') || 
        key.toLowerCase().includes('exam') ||
        key.toLowerCase().includes('final')
      );
      if (evalKeys.length > 0) {
        console.log('🔍 [CourseApprovalPanel] Clés d\'évaluation trouvées dans courseDetails:', evalKeys);
        evalKeys.forEach(key => {
          console.log(`  - ${key}:`, courseDetails[key]);
        });
      }
      setSelectedCourse(courseDetails);
      setShowPreviewModal(true);
    } catch (error: any) {
      console.error('❌ [CourseApprovalPanel] Erreur lors du chargement des détails du cours:', error);
      toast.error('Erreur', error.message || 'Impossible de charger les détails du cours');
    }
  };

  const handleOpenApprovalModal = (course: CourseApproval | any, action: 'approve' | 'reject') => {
    setSelectedCourse(course);
    setApprovalAction(action);
    setComments('');
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedCourse) return;

    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      toast.warning('Raison requise', 'Veuillez fournir une raison de rejet');
      return;
    }

    setProcessing(true);
    try {
      // Utiliser course_id, id, ou courseId selon ce qui est disponible
      const courseId = (selectedCourse as any).course_id || (selectedCourse as any).id || (selectedCourse as any).courseId;
      if (!courseId) {
        toast.error('Erreur', 'ID du cours manquant');
        setProcessing(false);
        return;
      }
      
      if (approvalAction === 'approve') {
        await adminService.approveCourse(String(courseId), comments);
        toast.success('Cours approuvé', 'Le cours a été approuvé et est maintenant publié');
      } else {
        await adminService.rejectCourse(String(courseId), rejectionReason, comments);
        toast.success('Cours rejeté', 'Le cours a été rejeté. Le formateur a été notifié.');
      }
      setShowApprovalModal(false);
      loadPendingCourses();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      
      // Gérer spécifiquement les erreurs de session expirée
      if (error.message && error.message.includes('session a expiré')) {
        toast.error('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
        // La déconnexion est déjà gérée par api.ts
      } else if (error.status === 403 && error.message && error.message.includes('Token expiré')) {
        toast.error('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else {
        toast.error('Erreur', error.message || 'Impossible de valider le cours');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pendingCourses.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours en attente</h3>
        <p className="text-gray-500">Tous les cours ont été validés ou il n'y a pas de demande en attente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Validation des Cours</h2>
            <p className="text-blue-100">
              {pendingCourses.length} cours en attente de validation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Liste des cours en attente */}
      <div className="space-y-4">
        {Array.isArray(pendingCourses) && pendingCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Titre du cours uniquement */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {course.title || course.course_title || `Cours #${course.course_id || course.id}`}
                    </h3>
                  </div>

                  {/* Informations du formateur et date */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Formateur */}
                      {(course.instructor_name || course.instructor_first_name || course.instructor_last_name) && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Formateur</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {course.instructor_name || 
                               `${course.instructor_first_name || ''} ${course.instructor_last_name || ''}`.trim() ||
                               'Non spécifié'}
                            </div>
                            {course.instructor_email && (
                              <div className="text-xs text-gray-500 mt-1">{course.instructor_email}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date de demande */}
                      {(course.request_date || course.created_at) && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de demande</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {new Date(course.request_date || course.created_at || '').toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(course.request_date || course.created_at || '').toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      En attente de validation
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handlePreviewCourse(course)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Prévisualiser</span>
                    </button>
                    <button
                      onClick={() => handleOpenApprovalModal(course, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approuver</span>
                    </button>
                    <button
                      onClick={() => handleOpenApprovalModal(course, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de prévisualisation */}
      {showPreviewModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Prévisualisation du cours</h3>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setSelectedCourse(null);
                    setModuleQuizzes({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Image de couverture */}
              {(() => {
                const thumbnailUrl = selectedCourse.thumbnail_url || selectedCourse.thumbnail || (selectedCourse as any).image_url || (selectedCourse as any).cover_image;
                const imageUrl = resolveMediaUrl(thumbnailUrl) || DEFAULT_COURSE_IMAGE;
                
                return (
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 relative">
                    <img
                      src={imageUrl}
                      alt={selectedCourse.title || selectedCourse.course_title || 'Cours'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // En cas d'erreur, utiliser l'image par défaut
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_COURSE_IMAGE;
                      }}
                    />
                  </div>
                );
              })()}

              {/* Titre */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedCourse.title || selectedCourse.course_title || 'Sans titre'}
                </h2>
                {selectedCourse.description && (
                  <p className="text-gray-600 mt-2">{selectedCourse.description}</p>
                )}
              </div>

              {/* Informations du cours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCourse.instructor_name && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Formateur</div>
                      <div className="text-sm font-medium text-gray-900">{selectedCourse.instructor_name}</div>
                    </div>
                  </div>
                )}


                {selectedCourse.duration && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Durée</div>
                      <div className="text-sm font-medium text-gray-900">{selectedCourse.duration}</div>
                    </div>
                  </div>
                )}

                {selectedCourse.status && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Statut</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedCourse.status === 'pending_approval' ? 'En attente de validation' : selectedCourse.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contenu du cours */}
              {selectedCourse.content && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Contenu du cours</h3>
                  <div className="prose max-w-none text-gray-600">
                    {typeof selectedCourse.content === 'string' ? (
                      <div dangerouslySetInnerHTML={createSanitizedHtml(selectedCourse.content)} />
                    ) : (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selectedCourse.content, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}

              {/* Modules avec leçons */}
              {selectedCourse.modules && Array.isArray(selectedCourse.modules) && selectedCourse.modules.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Modules ({selectedCourse.modules.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedCourse.modules.map((module: any, index: number) => (
                      <div key={module.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-base">
                              {index + 1}. {module.title || module.name || `Module ${index + 1}`}
                            </div>
                            {module.description && (
                              <div className="text-sm text-gray-600 mt-1">{module.description}</div>
                            )}
                          </div>
                          {module.order_index !== undefined && (
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                              Ordre: {module.order_index}
                            </span>
                          )}
                        </div>
                        
                        {/* Leçons du module */}
                        {module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <div className="text-xs text-gray-500 uppercase mb-2">
                              Leçons ({module.lessons.length})
                            </div>
                            <div className="space-y-2">
                              {module.lessons.map((lesson: any, lessonIndex: number) => (
                                <div key={lesson.id || lessonIndex} className="pl-3 border-l-2 border-blue-200 bg-white p-2 rounded">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        {lessonIndex + 1}. {lesson.title || lesson.name || `Leçon ${lessonIndex + 1}`}
                                      </div>
                                      {lesson.description && (
                                        <div className="text-xs text-gray-600 mt-1">{lesson.description}</div>
                                      )}
                                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                        {lesson.duration && (
                                          <span className="flex items-center space-x-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{lesson.duration} min</span>
                                          </span>
                                        )}
                                        {lesson.type && (
                                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                            {lesson.type}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quiz du module */}
                        {(() => {
                          // Vérifier plusieurs formats possibles pour les quiz
                          // 1. Dans les données du module directement
                          // 2. Dans moduleQuizzes (chargés séparément)
                          const moduleId = String(module.id);
                          const moduleQuiz = module.quiz || 
                                            module.module_quiz || 
                                            module.quizzes?.[0] ||
                                            moduleQuizzes[moduleId];
                          
                          // Log pour déboguer seulement si aucun quiz n'est trouvé
                          if (!moduleQuiz) {
                            // Log silencieux (seulement en développement)
                            if (process.env.NODE_ENV === 'development' && false) {
                              console.log('🔍 [CourseApprovalPanel] Module sans quiz:', {
                                moduleId: module.id,
                                moduleTitle: module.title,
                                hasQuiz: !!module.quiz,
                                hasModuleQuiz: !!module.module_quiz,
                                hasQuizzes: !!module.quizzes,
                                hasInQuizzesMap: !!moduleQuizzes[moduleId],
                                allKeys: Object.keys(module)
                              });
                            }
                            return null;
                          }
                          
                          // Log seulement en développement
                          if (process.env.NODE_ENV === 'development' && false) {
                            console.log('✅ [CourseApprovalPanel] Quiz trouvé pour module:', {
                              moduleId: module.id,
                              moduleTitle: module.title,
                              quizId: moduleQuiz.id,
                              quizTitle: moduleQuiz.title,
                              questionsCount: (moduleQuiz.questions || moduleQuiz.question || []).length
                            });
                          }
                          
                          const questions = moduleQuiz.questions || moduleQuiz.question || [];
                          const questionsCount = Array.isArray(questions) ? questions.length : 0;
                          
                          return (
                            <div className="mt-3 pt-3 border-t border-gray-300 bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Quiz du module</span>
                                {questionsCount > 0 && (
                                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                    {questionsCount} question{questionsCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {moduleQuiz.title && (
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {moduleQuiz.title}
                                </div>
                              )}
                              {moduleQuiz.description && (
                                <div className="text-xs text-gray-600 mb-2">
                                  {moduleQuiz.description}
                                </div>
                              )}
                              {moduleQuiz.passing_score !== undefined && (
                                <div className="text-xs text-gray-600 mb-2">
                                  Score de passage: {moduleQuiz.passing_score}%
                                </div>
                              )}
                              
                              {/* Questions du quiz */}
                              {(() => {
                                const questions = moduleQuiz.questions || moduleQuiz.question || [];
                                if (!Array.isArray(questions) || questions.length === 0) {
                                  return null;
                                }
                                
                                return (
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="text-xs text-gray-500 uppercase mb-2">
                                      Questions ({questions.length})
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {questions.map((q: any, qIndex: number) => (
                                        <div key={q.id || qIndex} className="bg-white p-2 rounded border border-blue-100">
                                          <div className="text-xs font-medium text-gray-900 mb-1">
                                            {qIndex + 1}. {q.question_text || q.questionText || q.question || 'Question sans texte'}
                                          </div>
                                          {q.question_type && (
                                            <div className="text-xs text-gray-500 mb-1">
                                              Type: {q.question_type === 'multiple_choice' ? 'Choix multiple' : 
                                                      q.question_type === 'true_false' ? 'Vrai/Faux' : 
                                                      q.question_type === 'short_answer' ? 'Réponse courte' : q.question_type}
                                            </div>
                                          )}
                                          {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                                            <div className="text-xs text-gray-600 mt-1">
                                              Options: {q.options.join(', ')}
                                            </div>
                                          )}
                                          {q.points !== undefined && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Points: {q.points}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Évaluation finale */}
              {(() => {
                // Vérifier plusieurs formats possibles pour l'évaluation
                // Priorité: final_evaluation > evaluation > course_evaluation > evaluations[0]
                const evaluation = selectedCourse.final_evaluation ||
                                   selectedCourse.evaluation || 
                                   selectedCourse.course_evaluation || 
                                   selectedCourse.evaluations?.[0];
                
                if (!evaluation) {
                  return null;
                }
                
                console.log('✅ [CourseApprovalPanel] Évaluation trouvée:', {
                  id: evaluation.id,
                  title: evaluation.title,
                  questionsCount: (evaluation.questions || evaluation.question || []).length
                });
                
                const questions = evaluation.questions || evaluation.question || [];
                const questionsCount = Array.isArray(questions) ? questions.length : 0;
                
                return (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Évaluation finale</h3>
                    </div>
                    {evaluation.title && (
                      <div className="text-base font-medium text-gray-900 mb-2">
                        {evaluation.title}
                      </div>
                    )}
                    {evaluation.description && (
                      <div className="text-sm text-gray-600 mb-3">{evaluation.description}</div>
                    )}
                    <div className="flex items-center space-x-4 text-sm mb-3">
                      {questionsCount > 0 && (
                        <div className="text-gray-700">
                          <span className="font-medium">{questionsCount}</span> question{questionsCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {evaluation.passing_score !== undefined && (
                        <div className="text-gray-700">
                          Score de passage: <span className="font-medium">{evaluation.passing_score}%</span>
                        </div>
                      )}
                      {evaluation.type && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {evaluation.type}
                        </div>
                      )}
                    </div>
                    
                    {/* Questions de l'évaluation */}
                    {questionsCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-xs text-gray-500 uppercase mb-2">
                          Questions ({questionsCount})
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {questions.map((q: any, qIndex: number) => (
                            <div key={q.id || qIndex} className="bg-white p-3 rounded border border-blue-100">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                {qIndex + 1}. {q.question_text || q.questionText || q.question || 'Question sans texte'}
                              </div>
                              {q.question_type && (
                                <div className="text-xs text-gray-500 mb-2">
                                  Type: {q.question_type === 'multiple_choice' ? 'Choix multiple' : 
                                          q.question_type === 'true_false' ? 'Vrai/Faux' : 
                                          q.question_type === 'short_answer' ? 'Réponse courte' : 
                                          q.question_type === 'essay' ? 'Dissertation' : q.question_type}
                                </div>
                              )}
                              {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-xs text-gray-600 font-medium mb-1">Options:</div>
                                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                    {q.options.map((opt: string, optIndex: number) => (
                                      <li key={optIndex}>{opt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {q.correct_answer && (
                                <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded mt-2">
                                  <span className="font-medium">Réponse correcte:</span> {q.correct_answer}
                                </div>
                              )}
                              {q.points !== undefined && (
                                <div className="text-xs text-gray-500 mt-2">
                                  Points: <span className="font-medium">{q.points}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedCourse(null);
                  setModuleQuizzes({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleOpenApprovalModal(selectedCourse, 'approve');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approuver</span>
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleOpenApprovalModal(selectedCourse, 'reject');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Rejeter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'approbation/rejet */}
      {showApprovalModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {approvalAction === 'approve' ? 'Approuver le cours' : 'Rejeter le cours'}
                </h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {approvalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du rejet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Sélectionner une raison</option>
                    <option value="content_quality">Qualité du contenu insuffisante</option>
                    <option value="incomplete">Cours incomplet</option>
                    <option value="inappropriate">Contenu inapproprié</option>
                    <option value="policy_violation">Violation des règles de la plateforme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaires {approvalAction === 'reject' ? '(optionnel)' : '(optionnel)'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    approvalAction === 'approve'
                      ? 'Commentaires pour le formateur (optionnel)...'
                      : 'Détails supplémentaires sur le rejet (optionnel)...'
                  }
                />
              </div>

              {approvalAction === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Le cours sera publié et visible dans le catalogue
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Le formateur recevra une notification de confirmation
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {approvalAction === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Le cours sera rejeté et retourné à l'état "Brouillon"
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Le formateur recevra une notification avec les raisons du rejet
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitApproval}
                disabled={processing || (approvalAction === 'reject' && !rejectionReason)}
                className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    {approvalAction === 'approve' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Approuver</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Rejeter</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

