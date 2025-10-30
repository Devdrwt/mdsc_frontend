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
  const [activeTab, setActiveTab] = useState<'modules' | 'medias' | 'settings'>('modules');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: notifyError } = useNotification() as any;

  useEffect(() => {
    if (!courseIdParam) return;
    const load = async () => {
      try {
        setLoading(true);
        const c = await courseService.getCourseById(courseIdParam);
        setCourse(c);
        if (courseIdNum) {
          const m = await moduleService.getCourseModules(courseIdNum);
          setModules(m);
          try {
            const media = await mediaService.getCourseMediaFiles(courseIdNum);
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
            {(['modules','medias','settings'] as const).map(tab => (
              <button
                key={tab}
                className={`px-3 py-2 rounded-lg text-sm border ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-white'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'modules' ? 'Modules' : tab === 'medias' ? 'Médias' : 'Paramètres'}
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

                {/* Édition rapide: premier module/première leçon si dispo */}
                {modules[0]?.lessons?.[0] && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Édition rapide: {modules[0].lessons[0].title}</h2>
                    <LessonEditor
                      courseId={course?.id}
                      lesson={modules[0].lessons[0]}
                      onSaved={(l) => {
                        // rafraîchir minimalement en mémoire
                        const updated = modules.slice();
                        updated[0].lessons[0] = l;
                        setModules(updated);
                      }}
                    />
                  </div>
                )}
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
              <div className="bg-white rounded-lg border p-6 text-sm text-gray-600">Paramètres cours (à compléter)</div>
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


