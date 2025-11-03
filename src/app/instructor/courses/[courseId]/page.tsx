'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useNotification } from '../../../../lib/hooks/useNotification';
import { courseService } from '../../../../lib/services/courseService';
import { moduleService } from '../../../../lib/services/moduleService';
import { mediaService } from '../../../../lib/services/mediaService';
import ModuleList from '../../../../components/courses/ModuleList';
import MediaUpload from '../../../../components/media/MediaUpload';
import LessonEditor from '../../../../components/instructor/LessonEditor';
import LessonManagement from '../../../../components/dashboard/instructor/LessonManagement';
import { Settings, Save, Globe, DollarSign, Calendar, Users, Lock, Eye, EyeOff, Loader as LoaderIcon } from 'lucide-react';

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const courseIdParam = params?.courseId as string;
  const courseIdNum = useMemo(() => {
    const n = Number(courseIdParam);
    return Number.isFinite(n) ? n : undefined;
  }, [courseIdParam]);

  const [course, setCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [courseMedia, setCourseMedia] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'modules' | 'lessons' | 'medias' | 'settings'>('modules');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const { success, error: notifyError } = useNotification() as any;
  
  // Paramètres du cours
  const [courseSettings, setCourseSettings] = useState({
    is_published: false,
    is_featured: false,
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
        setCourseSettings({
          is_published: c.is_published || c.isPublished || false,
          is_featured: c.is_featured || false,
          language: c.language || 'fr',
          price: c.price || 0,
          currency: c.currency || 'XOF',
          max_students: c.max_students || null,
          enrollment_deadline: c.enrollment_deadline || '',
          course_start_date: c.course_start_date || '',
          course_end_date: c.course_end_date || '',
        });
        
        if (courseIdNum) {
          const m = await moduleService.getCourseModules(courseIdNum);
          setModules(m);
          try {
            const media = await mediaService.getCourseMedia(courseIdNum.toString());
            setCourseMedia(media);
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

  const content = (
    <DashboardLayout userRole="instructor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{course?.title || 'Cours'}</h1>
          <div className="flex items-center gap-2">
            {(['modules', 'lessons', 'medias', 'settings'] as const).map(tab => (
              <button
                key={tab}
                className={`px-3 py-2 rounded-lg text-sm border ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-white'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'modules' ? 'Modules' : tab === 'lessons' ? 'Leçons' : tab === 'medias' ? 'Médias' : 'Paramètres'}
              </button>
            ))}
          </div>
        </div>

        {loading && (<div className="bg-white rounded-lg border p-6">Chargement...</div>)}
        {error && (<div className="bg-red-50 rounded-lg border border-red-200 p-6 text-red-700">{error}</div>)}

        {!loading && !error && (
          <div className="space-y-6">
            {activeTab === 'modules' && (
              <div className="space-y-6">
                <ModuleList
                  courseId={courseIdNum || Number(course?.id)}
                  modules={modules}
                  onReorder={async (ordered) => {
                    // Recalculer order_index et persister
                    const updates = ordered.map((m: any, idx: number) => ({ id: m.id, order_index: idx + 1 }));
                    for (const u of updates) {
                      try { await moduleService.updateModule(u.id, { order_index: u.order_index }); } catch {}
                    }
                    setModules(ordered.map((m: any, i: number) => ({ ...m, order_index: i + 1 })));
                    try { success?.('Modules réordonnés'); } catch {}
                  }}
                />
              </div>
            )}

            {activeTab === 'lessons' && (
              <div>
                <LessonManagement courseId={courseIdParam} />
              </div>
            )}

            {activeTab === 'medias' && (
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Ajouter un média au cours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <MediaUpload
                      contentType="document"
                      courseId={String(course?.id)}
                      onUploadSuccess={() => { success?.('Média ajouté'); }}
                    />
                    <MediaUpload
                      contentType="image"
                      courseId={String(course?.id)}
                      onUploadSuccess={() => { success?.('Média ajouté'); }}
                    />
                    <MediaUpload
                      contentType="video"
                      courseId={String(course?.id)}
                      onUploadSuccess={() => { success?.('Média ajouté'); }}
                    />
                  </div>
                </div>

                {/* Liste des médias du cours */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Médias du cours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courseMedia.map((mf: any) => (
                      <div key={mf.id} className="border rounded p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mf.original_filename || mf.filename}</div>
                          <div className="text-xs text-gray-500">{mf.file_category} • {(mf.file_size/1024/1024).toFixed(2)} MB</div>
                        </div>
                        <button
                          className="text-red-600 text-sm"
                          onClick={async () => {
                            try {
                              await mediaService.deleteMediaFile(mf.id);
                              setCourseMedia((prev) => prev.filter((x) => x.id !== mf.id));
                              success?.('Média supprimé');
                            } catch (e: any) {
                              notifyError?.('Erreur', e.message || 'Suppression échouée');
                            }
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                    {courseMedia.length === 0 && (
                      <div className="text-sm text-gray-500">Aucun média pour ce cours.</div>
                    )}
                  </div>
                </div>

                {modules.map((m) => (
                  <div key={m.id} className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Module: {m.title}</h4>
                    {m.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="mb-3">
                        <div className="text-sm text-gray-700 mb-2">Leçon: {lesson.title}</div>
                        <MediaUpload
                          contentType="video"
                          lessonId={String(lesson.id)}
                          onUploadSuccess={() => { success?.('Média ajouté'); }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Settings className="h-6 w-6 text-mdsc-gold" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres du Cours</h2>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSaving(true);
                    try {
                      await courseService.updateCourse(courseIdParam, courseSettings as any);
                      success?.('Paramètres enregistrés avec succès');
                      const updated = await courseService.getCourseById(courseIdParam);
                      setCourse(updated);
                    } catch (err: any) {
                      notifyError?.('Erreur', err.message || 'Impossible de sauvegarder les paramètres');
                    } finally {
                      setSaving(false);
                    }
                  }} className="space-y-6">
                    {/* Statut et visibilité */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-blue-600" />
                        Visibilité
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={courseSettings.is_published}
                            onChange={(e) => setCourseSettings({ ...courseSettings, is_published: e.target.checked })}
                            className="rounded border-gray-300 dark:border-gray-600 text-mdsc-gold focus:ring-mdsc-gold h-5 w-5 dark:bg-gray-700"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">Publier le cours</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Rendre le cours accessible aux étudiants</div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={courseSettings.is_featured}
                            onChange={(e) => setCourseSettings({ ...courseSettings, is_featured: e.target.checked })}
                            className="rounded border-gray-300 dark:border-gray-600 text-mdsc-gold focus:ring-mdsc-gold h-5 w-5 dark:bg-gray-700"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">Mettre en vedette</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Afficher le cours en avant-première</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Paramètres linguistiques */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Globe className="h-5 w-5 mr-2 text-green-600" />
                        Paramètres linguistiques
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Langue du cours
                        </label>
                        <select
                          value={courseSettings.language}
                          onChange={(e) => setCourseSettings({ ...courseSettings, language: e.target.value })}
                          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                        >
                          <option value="fr">Français</option>
                          <option value="en">Anglais</option>
                        </select>
                      </div>
                    </div>

                    {/* Prix et paiement */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
                        Prix et Paiement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Prix
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={courseSettings.price}
                            onChange={(e) => setCourseSettings({ ...courseSettings, price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Devise
                          </label>
                          <select
                            value={courseSettings.currency}
                            onChange={(e) => setCourseSettings({ ...courseSettings, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                          >
                            <option value="XOF">XOF (Franc CFA)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="USD">USD (Dollar)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Dates importantes */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        Dates importantes
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date limite d'inscription
                          </label>
                          <input
                            type="datetime-local"
                            value={courseSettings.enrollment_deadline}
                            onChange={(e) => setCourseSettings({ ...courseSettings, enrollment_deadline: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date de début du cours
                          </label>
                          <input
                            type="datetime-local"
                            value={courseSettings.course_start_date}
                            onChange={(e) => setCourseSettings({ ...courseSettings, course_start_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date de fin du cours
                          </label>
                          <input
                            type="datetime-local"
                            value={courseSettings.course_end_date}
                            onChange={(e) => setCourseSettings({ ...courseSettings, course_end_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Limites */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-indigo-600" />
                        Limites d'inscription
                      </h3>
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre maximum d'étudiants (optionnel)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={courseSettings.max_students || ''}
                          onChange={(e) => setCourseSettings({ ...courseSettings, max_students: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-gold dark:bg-gray-700 dark:text-white"
                          placeholder="Illimité si vide"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Laissez vide pour une inscription illimitée
                        </p>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-mdsc-gold text-white rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <LoaderIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <Save className="h-5 w-5" />
                        )}
                        <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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


