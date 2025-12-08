'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useNotification } from '../../../../lib/hooks/useNotification';
import { courseService } from '../../../../lib/services/courseService';
import { moduleService } from '../../../../lib/services/moduleService';
import { mediaService } from '../../../../lib/services/mediaService';
import ModuleList from '../../../../components/courses/ModuleList';
import MediaUpload from '../../../../components/media/MediaUpload';
import CourseMediaManager from '../../../../components/dashboard/instructor/CourseMediaManager';
import LessonEditor from '../../../../components/instructor/LessonEditor';
import LessonManagement from '../../../../components/dashboard/instructor/LessonManagement';
import EvaluationBuilder from '../../../../components/dashboard/instructor/EvaluationBuilder';
import ModuleQuizBuilder from '../../../../components/dashboard/instructor/ModuleQuizBuilder';
import LiveCourseWorkflow from '../../../../components/dashboard/instructor/LiveCourseWorkflow';
import { evaluationService } from '../../../../lib/services/evaluationService';
import { quizService } from '../../../../lib/services/quizService';
import { Settings, Save, Globe, DollarSign, Calendar, Users, Lock, Eye, EyeOff, Loader as LoaderIcon, FileText, Send, CheckCircle2, AlertCircle, XCircle, Award } from 'lucide-react';

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const courseIdParam = params?.courseId as string;
  const courseIdNum = useMemo(() => {
    const n = Number(courseIdParam);
    return Number.isFinite(n) ? n : undefined;
  }, [courseIdParam]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [course, setCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [courseMedia, setCourseMedia] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [courseStatus, setCourseStatus] = useState<'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'>('draft');
  type TabKey = 'modules' | 'lessons' | 'medias' | 'evaluations' | 'settings';
  const tabKeys: TabKey[] = ['modules', 'lessons', 'medias', 'evaluations', 'settings'];
  const [activeTab, setActiveTab] = useState<TabKey>('modules');
  const [selectedModuleForQuiz, setSelectedModuleForQuiz] = useState<{ moduleId: string; quiz: any | null } | null>(null);
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizReloadTrigger, setQuizReloadTrigger] = useState(0); // Pour forcer le rechargement des quiz
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [requestingPublication, setRequestingPublication] = useState(false);
  const { success, error: notifyError } = useNotification() as any;
  
  // Paramètres du cours
  const [courseSettings, setCourseSettings] = useState({
    is_published: false,
    language: 'fr',
    price: 0,
    currency: 'XOF',
    max_students: null as number | null,
    enrollment_deadline: '',
    course_start_date: '',
    course_end_date: '',
  });

  useEffect(() => {
    if (!courseIdParam) return;
    const load = async () => {
      try {
        setLoading(true);
        const c = await courseService.getCourseById(courseIdParam);
        setCourse(c);
        
        // Charger les catégories
        const cats = await courseService.getCategories();
        setCategories(cats);
        
        // Charger les paramètres du cours
        const courseAny = c as any;
        setCourseSettings({
          is_published: courseAny.is_published || courseAny.isPublished || false,
          language: courseAny.language || 'fr',
          price: courseAny.price || 0,
          currency: courseAny.currency || 'XOF',
          max_students: courseAny.max_students || courseAny.maxStudents || null,
          enrollment_deadline: courseAny.enrollment_deadline || courseAny.enrollmentDeadline || '',
          course_start_date: courseAny.course_start_date || courseAny.courseStartDate || '',
          course_end_date: courseAny.course_end_date || courseAny.courseEndDate || '',
        });
        
        // Déterminer le statut du cours
        const status = courseAny.status || courseAny.publication_status || 
          (courseAny.is_published || courseAny.isPublished ? 'published' : 'draft');
        setCourseStatus(status);
        
        if (courseIdNum) {
          const m = await moduleService.getCourseModules(courseIdNum);
          setModules(m);
          try {
            const media = await mediaService.getCourseMedia(courseIdNum.toString());
            setCourseMedia(media);
          } catch {}
          try {
            const evalData = await evaluationService.getCourseEvaluation(courseIdParam);
            setEvaluation(evalData);
          } catch {}
        }
      } catch (e: any) {
        const msg = e.message || 'Erreur de chargement du cours';
        setError(msg);
        try { notifyError?.('Erreur', msg); } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseIdParam, courseIdNum]);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (!tabParam) return;
    const normalized = tabParam.toLowerCase();
    if (tabKeys.includes(normalized as TabKey) && normalized !== activeTab) {
      setActiveTab(normalized as TabKey);
    }
  }, [searchParams]);

  const changeTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.replace(`/instructor/courses/${courseIdParam}?${params.toString()}`, { scroll: false });
  };

  // Vérifier si c'est un cours en live
  const isLiveCourse = useMemo(() => {
    const courseAny = course as any;
    return courseAny?.course_type === 'live' || 
           courseAny?.courseType === 'live' ||
           courseAny?.is_live === true ||
           courseAny?.isLive === true;
  }, [course]);

  const content = (
    <DashboardLayout userRole="instructor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{course?.title || 'Cours'}</h1>
          {!isLiveCourse && (
            <div className="flex items-center gap-2">
              {tabKeys.map(tab => (
                <button
                  key={tab}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center space-x-2 ${activeTab === tab ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => changeTab(tab)}
                >
                  {tab === 'evaluations' && <FileText className="h-4 w-4" />}
                  <span>
                    {tab === 'modules' ? 'Modules' : tab === 'lessons' ? 'Leçons' : tab === 'medias' ? 'Médias' : tab === 'evaluations' ? 'Évaluations' : 'Paramètres'}
                  </span>
                  {tab === 'evaluations' && !evaluation && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">⚠️</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (<div className="bg-white rounded-lg border p-6 text-gray-700">Chargement...</div>)}
        {error && (<div className="bg-red-50 rounded-lg border border-red-200 p-6 text-red-700">{error}</div>)}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Afficher le workflow guidé pour les cours en live */}
            {isLiveCourse && (
              <LiveCourseWorkflow
                courseId={courseIdParam}
                course={course}
                courseStatus={courseStatus}
                onComplete={async () => {
                  // Recharger le cours pour mettre à jour le statut
                  try {
                    const updated = await courseService.getCourseById(courseIdParam);
                    setCourse(updated);
                    const courseAny = updated as any;
                    setCourseStatus(courseAny.status || 'pending_approval');
                  } catch (err) {
                    console.error('Erreur lors du rechargement du cours:', err);
                  }
                }}
              />
            )}

            {/* Interface normale pour les cours à la demande */}
            {!isLiveCourse && (
              <>
            {activeTab === 'modules' && (
              <div className="space-y-6">
                <ModuleList
                  courseId={courseIdNum || Number(course?.id)}
                  modules={modules}
                  quizReloadTrigger={quizReloadTrigger}
                  onReorder={async (ordered) => {
                    // Recalculer order_index et persister
                    const updates = ordered.map((m: any, idx: number) => ({ id: m.id, order_index: idx + 1 }));
                    for (const u of updates) {
                      try { await moduleService.updateModule(u.id, { order_index: u.order_index }); } catch {}
                    }
                    setModules(ordered.map((m: any, i: number) => ({ ...m, order_index: i + 1 })));
                    try { success?.('Modules réordonnés'); } catch {}
                  }}
                  onQuizClick={(moduleId: string) => {
                    // Charger le quiz existant si disponible
                    quizService.getModuleQuiz(moduleId).then((quiz) => {
                      setSelectedModuleForQuiz({ moduleId, quiz });
                    }).catch(() => {
                      setSelectedModuleForQuiz({ moduleId, quiz: null });
                    });
                  }}
                  onAddLessonClick={(moduleId: number) => {
                    // Basculer vers l'onglet "Leçons" et pré-sélectionner le module
                    setSelectedModuleForLesson(moduleId);
                    changeTab('lessons');
                  }}
                />
                
                {/* Modal pour créer/modifier un quiz */}
                {selectedModuleForQuiz && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">
                            {selectedModuleForQuiz.quiz ? 'Modifier le quiz du module' : 'Créer un quiz pour le module'}
                          </h3>
                          <button
                            onClick={() => setSelectedModuleForQuiz(null)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <ModuleQuizBuilder
                          moduleId={selectedModuleForQuiz.moduleId}
                          courseId={courseIdParam}
                          initialQuiz={selectedModuleForQuiz.quiz}
                          onSave={async () => {
                            setSelectedModuleForQuiz(null);
                            // Recharger les modules pour mettre à jour les informations (quiz, durée, etc.)
                            if (courseIdNum) {
                              try {
                                const updatedModules = await moduleService.getCourseModules(courseIdNum);
                                setModules(updatedModules);
                                // Recharger aussi le cours complet pour mettre à jour les leçons
                                const updatedCourse = await courseService.getCourseById(courseIdParam);
                                const courseAny = updatedCourse as any;
                                const allLessons = courseAny.lessons || [];
                                // Mettre à jour les leçons par module
                                const lessonsMap: Record<number, any[]> = {};
                                updatedModules.forEach((module: any) => {
                                  const moduleLessons = allLessons.filter((lesson: any) => 
                                    lesson.module_id === module.id || lesson.moduleId === module.id
                                  );
                                  lessonsMap[module.id] = moduleLessons;
                                });
                                // Note: Si ModuleList utilise moduleLessons, il faudrait le passer en prop
                                // Pour l'instant, on recharge juste les modules
                                // Forcer le rechargement des quiz dans ModuleList
                                setQuizReloadTrigger(prev => prev + 1);
                              } catch (error) {
                                console.error('Erreur lors du rechargement des modules:', error);
                              }
                            }
                            success?.('Quiz sauvegardé avec succès');
                          }}
                          onCancel={() => setSelectedModuleForQuiz(null)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lessons' && (
              <div>
                <LessonManagement 
                  courseId={course?.id ? String(course.id) : courseIdParam} 
                  moduleId={selectedModuleForLesson ? String(selectedModuleForLesson) : undefined}
                  onLessonCreated={() => {
                    setSelectedModuleForLesson(null);
                    // Recharger les modules pour mettre à jour les leçons
                    if (courseIdNum) {
                      moduleService.getCourseModules(courseIdNum).then(setModules);
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'evaluations' && (
              <div>
                <EvaluationBuilder
                  courseId={courseIdParam}
                  initialEvaluation={evaluation}
                  onSave={async () => {
                    try {
                      const evalData = await evaluationService.getCourseEvaluation(courseIdParam);
                      setEvaluation(evalData);
                      success?.('Évaluation sauvegardée avec succès');
                    } catch (e) {
                      notifyError?.('Erreur', 'Impossible de recharger l\'évaluation');
                    }
                  }}
                  onCancel={() => changeTab('modules')}
                />
              </div>
            )}

            {activeTab === 'medias' && (
              <CourseMediaManager
                courseId={course?.id || courseIdParam}
                modules={(() => {
                  // Enrichir les modules avec leurs leçons depuis le cours
                  const courseAny = course as any;
                  const allLessons = courseAny?.lessons || [];
                  return modules.map((m: any) => {
                    const moduleLessons = allLessons.filter(
                      (lesson: any) => lesson.module_id === m.id || lesson.moduleId === m.id
                    );
                    return {
                      id: m.id,
                      title: m.title,
                      lessons: moduleLessons.map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        content_type: l.content_type || l.contentType || 'text',
                      })),
                    };
                  });
                })()}
                onMediaUpdated={() => {
                  // Recharger les médias après mise à jour
                  if (courseIdNum) {
                    mediaService.getCourseMedia(courseIdNum.toString())
                      .then(setCourseMedia)
                      .catch(() => {});
                  }
                }}
              />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-mdsc-gold/10 rounded-lg">
                        <Settings className="h-5 w-5 text-mdsc-gold" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Paramètres du Cours</h2>
                        <p className="text-sm text-gray-600">Configurez les options de visibilité, prix et accès</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="p-6 space-y-8">
                    {/* Statut et visibilité */}
                    <div className="bg-blue-50/50 rounded-lg p-6 border border-blue-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Eye className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Visibilité</h3>
                          <p className="text-sm text-gray-600">Contrôlez qui peut voir ce cours</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-lg border border-blue-200 bg-white p-4 flex items-start space-x-3">
                          <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">La publication est gérée par l'équipe d'administration</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Enregistrer vos paramètres ne publie pas le cours. Utilisez le bouton « Demander la publication » ci-dessus ; un administrateur devra valider la mise en ligne.
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            courseStatus === 'published'
                              ? 'bg-green-100 text-green-700'
                              : courseStatus === 'pending_approval'
                              ? 'bg-yellow-100 text-yellow-700'
                              : courseStatus === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Statut actuel : {
                            courseStatus === 'published'
                            ? 'Publié'
                            : courseStatus === 'pending_approval'
                            ? 'En attente de validation admin'
                            : courseStatus === 'rejected'
                            ? 'Rejeté'
                            : 'Brouillon'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Paramètres linguistiques */}
                    <div className="bg-green-50/50 rounded-lg p-6 border border-green-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Globe className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Paramètres linguistiques</h3>
                          <p className="text-sm text-gray-600">Langue principale du cours</p>
                        </div>
                      </div>
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Langue du cours
                        </label>
                        <select
                          value={courseSettings.language}
                          onChange={(e) => setCourseSettings({ ...courseSettings, language: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                        >
                          <option value="fr">🇫🇷 Français</option>
                          <option value="en">🇬🇧 Anglais</option>
                        </select>
                      </div>
                    </div>

                    {/* Prix et paiement */}
                    <div className="bg-yellow-50/50 rounded-lg p-6 border border-yellow-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <DollarSign className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Prix et Paiement</h3>
                          <p className="text-sm text-gray-600">Tarification du cours</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prix du cours
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={courseSettings.price}
                              onChange={(e) => setCourseSettings({ ...courseSettings, price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Devise
                          </label>
                          <select
                            value={courseSettings.currency}
                            onChange={(e) => setCourseSettings({ ...courseSettings, currency: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                          >
                            <option value="XOF">XOF - Franc CFA</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="USD">USD - Dollar</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Dates importantes */}
                    <div className="bg-purple-50/50 rounded-lg p-6 border border-purple-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Dates importantes</h3>
                          <p className="text-sm text-gray-600">Calendrier du cours</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date limite d'inscription
                          </label>
                          <input
                            type="datetime-local"
                            value={courseSettings.enrollment_deadline}
                            onChange={(e) => setCourseSettings({ ...courseSettings, enrollment_deadline: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de début
                          </label>
                          <input
                            type="datetime-local"
                            value={courseSettings.course_start_date}
                            onChange={(e) => setCourseSettings({ ...courseSettings, course_start_date: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de fin
                          </label>
                          <input
                            type="datetime-local"
                            value={courseSettings.course_end_date}
                            onChange={(e) => setCourseSettings({ ...courseSettings, course_end_date: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Limites */}
                    <div className="bg-indigo-50/50 rounded-lg p-6 border border-indigo-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Limites d'inscription</h3>
                          <p className="text-sm text-gray-600">Contrôle des effectifs</p>
                        </div>
                      </div>
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre maximum d'utilisateurs
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={courseSettings.max_students || ''}
                          onChange={(e) => setCourseSettings({ ...courseSettings, max_students: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mdsc-gold transition-colors"
                          placeholder="Illimité"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Laissez vide pour une inscription illimitée
                        </p>
                      </div>
                    </div>

                    {/* Section : Demande de publication */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Send className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Publication du cours</h3>
                          <p className="text-sm text-gray-600">Demander la validation pour publier le cours</p>
                        </div>
                        {/* Badge de statut */}
                        {courseStatus === 'pending_approval' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Lock className="h-3 w-3 mr-1" />
                            En attente de validation
                          </span>
                        )}
                        {courseStatus === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approuvé
                          </span>
                        )}
                        {courseStatus === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeté
                          </span>
                        )}
                        {courseStatus === 'published' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Publié
                          </span>
                        )}
                      </div>

                      {/* Vérification des conditions */}
                      <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Conditions de publication :</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            {modules.length > 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={modules.length > 0 ? 'text-gray-700' : 'text-red-600'}>
                              Au moins un module créé {modules.length > 0 && `(${modules.length})`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            {evaluation ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={evaluation ? 'text-gray-700' : 'text-red-600'}>
                              Évaluation finale créée {evaluation ? '(Obligatoire)' : '(⚠️ Obligatoire)'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            {course?.title && course.title.length >= 5 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={course?.title && course.title.length >= 5 ? 'text-gray-700' : 'text-red-600'}>
                              Titre valide (min. 5 caractères)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            {course?.description && course.description.length >= 10 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={course?.description && course.description.length >= 10 ? 'text-gray-700' : 'text-red-600'}>
                              Description valide (min. 10 caractères)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bouton de demande de publication */}
                      {courseStatus === 'draft' || courseStatus === 'rejected' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            // Vérifier les conditions
                            // Pour les cours en live, les modules/leçons ne sont pas obligatoires
                            if (!isLiveCourse) {
                              if (modules.length === 0) {
                                notifyError?.('Conditions non remplies', 'Vous devez créer au moins un module pour ce cours');
                                return;
                              }
                              // Vérifier qu'au moins un module a au moins une leçon publiée
                              const hasPublishedLesson = modules.some(module => 
                                module.lessons && module.lessons.length > 0 && 
                                module.lessons.some((lesson: any) => 
                                  lesson.is_published !== false && lesson.isPublished !== false
                                )
                              );
                              if (!hasPublishedLesson) {
                                notifyError?.('Conditions non remplies', 'Le cours doit contenir au moins un module avec au moins une leçon publiée');
                                return;
                              }
                            }
                            if (!evaluation) {
                              notifyError?.('Évaluation requise', 'Vous devez créer une évaluation finale avant de demander la publication');
                              changeTab('evaluations');
                              return;
                            }
                            if (!course?.title || course.title.length < 5) {
                              notifyError?.('Titre invalide', 'Le titre doit contenir au moins 5 caractères');
                              return;
                            }
                            if (!course?.description || course.description.length < 10) {
                              notifyError?.('Description invalide', 'La description doit contenir au moins 10 caractères');
                              return;
                            }

                            setRequestingPublication(true);
                            try {
                              await courseService.requestCoursePublication(courseIdParam);
                              // Le backend crée automatiquement une notification pour tous les admins
                              success?.('Demande envoyée', 'Votre demande de publication a été envoyée. Elle sera examinée par un administrateur.');
                              const updated = await courseService.getCourseById(courseIdParam);
                              setCourse(updated);
                              const courseAny = updated as any;
                              setCourseStatus(courseAny.status || 'pending_approval');
                            } catch (error: any) {
                              console.error('Erreur lors de la demande de publication:', error);
                              
                              // Extraire un message d'erreur plus détaillé
                              let errorMessage = error.message || 'Impossible d\'envoyer la demande de publication';
                              
                              // Si l'erreur contient des détails, les utiliser
                              if (error.details) {
                                if (typeof error.details === 'string') {
                                  errorMessage = error.details;
                                } else if (error.details.detailsMessage) {
                                  errorMessage = error.details.detailsMessage;
                                } else if (error.details.message) {
                                  errorMessage = error.details.message;
                                } else if (error.details.reason) {
                                  errorMessage = error.details.reason;
                                } else if (Array.isArray(error.details.errors)) {
                                  errorMessage = error.details.errors.join('. ');
                                }
                              }
                              
                              // Détecter spécifiquement l'erreur de modules/leçons pour les cours en live
                              const isModuleLessonError = errorMessage.includes('module') && 
                                                         (errorMessage.includes('leçon') || errorMessage.includes('leçon publiée'));
                              
                              if (isLiveCourse && isModuleLessonError) {
                                errorMessage = '⚠️ Erreur de validation backend : Pour un cours en live, les modules et leçons ne sont normalement pas obligatoires. ' +
                                              'Cette erreur indique que le backend applique une validation qui ne devrait pas s\'appliquer aux cours en live. ' +
                                              'Veuillez contacter le support technique pour résoudre ce problème. ' +
                                              'En attendant, assurez-vous que l\'évaluation finale est créée et que toutes les informations du cours sont complètes (dates, nombre maximum d\'utilisateurs, etc.).';
                              }
                              
                              // Messages d'erreur spécifiques selon le code d'erreur
                              if (error.code) {
                                switch (error.code) {
                                  case 'COURSE_INCOMPLETE':
                                    if (isLiveCourse && !isModuleLessonError) {
                                      errorMessage = 'Le cours n\'est pas complet. Pour un cours en live, vérifiez que l\'évaluation finale est créée et que toutes les informations requises sont renseignées (dates, nombre maximum d\'utilisateurs, etc.).';
                                    } else if (!isLiveCourse) {
                                      errorMessage = 'Le cours n\'est pas complet. Vérifiez que tous les modules ont des leçons et que l\'évaluation finale est créée.';
                                    }
                                    break;
                                  case 'MISSING_REQUIRED_FIELDS':
                                    errorMessage = 'Certains champs requis sont manquants. Vérifiez le titre, la description et tous les champs obligatoires.';
                                    break;
                                  case 'NO_MODULES':
                                    if (isLiveCourse) {
                                      errorMessage = '⚠️ Pour un cours en live, cette validation ne devrait pas s\'appliquer. Veuillez contacter le support si cette erreur persiste.';
                                    } else {
                                      errorMessage = 'Le cours doit contenir au moins un module avec au moins une leçon publiée pour être publié.';
                                    }
                                    break;
                                  case 'NO_EVALUATION':
                                    errorMessage = 'L\'évaluation finale est obligatoire pour publier le cours.';
                                    break;
                                }
                              }
                              
                              notifyError?.('Erreur de publication', errorMessage);
                            } finally {
                              setRequestingPublication(false);
                            }
                          }}
                          disabled={
                            requestingPublication || 
                            (!isLiveCourse && modules.length === 0) || 
                            !evaluation
                          }
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                        >
                          {requestingPublication ? (
                            <>
                              <LoaderIcon className="h-5 w-5 animate-spin" />
                              <span>Envoi de la demande...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5" />
                              <span>Demander la publication</span>
                            </>
                          )}
                        </button>
                      ) : courseStatus === 'pending_approval' ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-900">
                                Demande en attente de validation
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Votre demande de publication est en cours d'examen par un administrateur.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : courseStatus === ('rejected' as typeof courseStatus) ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-900">
                                Demande rejetée
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Votre demande a été rejetée. Vous pouvez corriger les problèmes et renvoyer une demande.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );

  return (
    <AuthGuard requiredRole="instructor">
      {content}
    </AuthGuard>
  );
}


