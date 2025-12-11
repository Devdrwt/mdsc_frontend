'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Play, CheckCircle, Award, Filter, Search, X, Trash2, AlertTriangle, Users, User, MessageCircle } from 'lucide-react';
import { courseService, Course } from '../../../lib/services/courseService';
import { useAuthStore } from '../../../lib/stores/authStore';
import { evaluationService } from '../../../lib/services/evaluationService';
import DataTable from '../shared/DataTable';
import toast from '../../../lib/utils/toast';
import { resolveMediaUrl } from '../../../lib/utils/media';
// import { BookOpen } from "heroicons-react" ;

type StudentCourse = Course & {
  progressValue: number;
  categoryLabel: string;
  createdAt?: string | null;
};

export default function MyCourses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');
  const [unenrollingCourse, setUnenrollingCourse] = useState<string | number | null>(null);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState<StudentCourse | null>(null);
  const [evaluationStatuses, setEvaluationStatuses] = useState<Map<number, { hasEvaluation: boolean; isPassed: boolean }>>(new Map());
  const [courseMaterialUrls, setCourseMaterialUrls] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userCourses = await courseService.getMyCourses();
        const normalizedCourses: StudentCourse[] = (userCourses || []).map((course: any) => {
          const categoryLabel = typeof course.category === 'string'
            ? course.category
            : course.category?.name || 'Sans catégorie';

          const progressRaw = course.progress ?? course.progressValue ?? course.enrollment?.progress_percentage ?? course.progress_percentage ?? 0;
          const progressValue = Number(progressRaw);

          const createdAt = course.createdAt || course.created_at || course.enrollment?.enrolled_at || null;

          return {
            ...course,
            category: categoryLabel,
            categoryLabel,
            progressValue: Number.isFinite(progressValue) ? Math.min(Math.max(progressValue, 0), 100) : 0,
            createdAt,
          } as StudentCourse;
        });

        setCourses(normalizedCourses);
        setFilteredCourses(normalizedCourses);

        // Charger les URLs de contenu pour les cours live en parallèle
        const liveCourses = normalizedCourses.filter((course: any) => 
          course.course_type === 'live' || course.courseType === 'live'
        );
        
        // Charger les URLs de contenu pour les cours live (en parallèle)
        const materialUrlPromises = liveCourses.map(async (course) => {
          const courseIdNum = typeof course.id === 'number' ? course.id : Number(course.id);
          if (!courseIdNum || isNaN(courseIdNum)) return null;
          
          try {
            // Essayer d'abord de récupérer les médias du cours (fichiers uploadés directement pour le cours)
            try {
              const { MediaService } = await import('../../../lib/services/mediaService');
              const courseMedia = await MediaService.getCourseMedia(String(courseIdNum));
              console.log(`[MyCourses] 🔍 Médias du cours ${courseIdNum}:`, courseMedia);
              
              // Chercher un média de type "document" uploadé directement pour le cours (sans lesson_id)
              const courseDocument = courseMedia.find((m: any) => 
                (m.file_category === 'document' || m.fileCategory === 'document') &&
                (!m.lesson_id && !m.lessonId) &&
                m.url
              );
              
              if (courseDocument) {
                const materialUrl = courseDocument.url;
                console.log(`[MyCourses] ✅ URL de contenu trouvée dans les médias du cours ${courseIdNum}:`, materialUrl);
                return { courseId: courseIdNum, url: materialUrl };
              }
            } catch (mediaError) {
              console.warn(`[MyCourses] Erreur lors du chargement des médias du cours ${courseIdNum}:`, mediaError);
            }
            
            // Essayer ensuite de récupérer les ressources du cours
            try {
              const { getCourseResources } = await import('../../../lib/services/modernCourseService');
              const resources = await getCourseResources(String(courseIdNum));
              console.log(`[MyCourses] 🔍 Ressources du cours ${courseIdNum}:`, resources);
              
              // Chercher une ressource de type "document" qui pourrait être le contenu téléchargeable
              const documentResource = resources.find((r: any) => 
                r.type === 'document' || 
                r.type === 'link' ||
                (r.url || r.filePath)
              );
              
              if (documentResource) {
                const materialUrl = documentResource.url || documentResource.filePath;
                if (materialUrl) {
                  console.log(`[MyCourses] ✅ URL de contenu trouvée dans les ressources du cours ${courseIdNum}:`, materialUrl);
                  return { courseId: courseIdNum, url: materialUrl };
                }
              }
            } catch (resourcesError) {
              console.warn(`[MyCourses] Erreur lors du chargement des ressources du cours ${courseIdNum}:`, resourcesError);
            }
            
            // Essayer ensuite de récupérer les détails complets du cours
            const courseDetails = await courseService.getCourseById(courseIdNum);
            const courseDetailsAny = courseDetails as any;
            
            // Chercher l'URL du contenu dans les détails complets
            const materialUrl = 
              courseDetailsAny.course_material_url ||
              courseDetailsAny.courseMaterialUrl ||
              courseDetailsAny.material_url ||
              courseDetailsAny.materialUrl ||
              courseDetailsAny.materials_url ||
              courseDetailsAny.materialsUrl ||
              courseDetailsAny.content_url ||
              courseDetailsAny.contentUrl ||
              courseDetailsAny.materials ||
              courseDetailsAny.course_materials ||
              courseDetailsAny.courseMaterials ||
              courseDetailsAny.material_file_url ||
              courseDetailsAny.materialFileUrl ||
              courseDetailsAny.document_url ||
              courseDetailsAny.documentUrl ||
              courseDetailsAny.file_url ||
              courseDetailsAny.fileUrl ||
              courseDetailsAny.resource_url ||
              courseDetailsAny.resourceUrl ||
              null;
            
            if (materialUrl) {
              console.log(`[MyCourses] ✅ URL de contenu trouvée dans les détails du cours live ${courseIdNum}:`, materialUrl);
              return { courseId: courseIdNum, url: materialUrl };
            } else {
              console.log(`[MyCourses] ⚠️ Aucune URL de contenu trouvée pour le cours live ${courseIdNum}`);
              return null;
            }
          } catch (error) {
            console.warn(`[MyCourses] Erreur lors du chargement des détails du cours live ${courseIdNum}:`, error);
            return null;
          }
        });
        
        // Attendre tous les chargements en parallèle
        const materialUrlResults = await Promise.all(materialUrlPromises);
        const materialUrlMap = new Map<number, string>();
        materialUrlResults.forEach((result) => {
          if (result) {
            materialUrlMap.set(result.courseId, result.url);
          }
        });
        
        setCourseMaterialUrls(materialUrlMap);

        // Charger les statuts d'évaluation pour les cours en live avec date de fin passée
        const evaluationStatusMap = new Map<number, { hasEvaluation: boolean; isPassed: boolean }>();
        
        for (const course of normalizedCourses) {
          const courseAny = course as any;
          const isLiveCourse = courseAny.course_type === 'live' || courseAny.courseType === 'live';
          const courseEndDate = courseAny.course_end_date || courseAny.courseEndDate;
          const enrollmentId = courseAny.enrollment?.id || courseAny.enrollment_id || courseAny.enrollmentId;
          const courseIdNum = typeof course.id === 'number' ? course.id : Number(course.id);
          
          // Vérifier l'évaluation seulement pour les cours en live avec date de fin passée
          if (isLiveCourse && courseEndDate) {
            const now = new Date();
            const endDate = new Date(courseEndDate);
            const isEndDatePassed = now >= endDate;
            
            // Si la date de fin est passée, vérifier l'évaluation
            if (isEndDatePassed && enrollmentId) {
              try {
                const evalData = await evaluationService.getEnrollmentEvaluation(Number(enrollmentId));
                if (evalData?.evaluation) {
                  // Vérifier si au moins une tentative est réussie (validée)
                  const hasPassedAttempt = evalData.previous_attempts?.some((attempt: any) => 
                    attempt.is_passed === true || attempt.is_passed === 1
                  ) || false;
                  evaluationStatusMap.set(courseIdNum, {
                    hasEvaluation: true,
                    isPassed: hasPassedAttempt
                  });
                  console.log(`[MyCourses] Évaluation trouvée pour le cours ${courseIdNum}:`, {
                    hasEvaluation: true,
                    isPassed: hasPassedAttempt,
                    attemptsCount: evalData.previous_attempts?.length || 0
                  });
                } else {
                  // Pas d'évaluation trouvée
                  evaluationStatusMap.set(courseIdNum, {
                    hasEvaluation: false,
                    isPassed: false
                  });
                  console.log(`[MyCourses] Pas d'évaluation pour le cours ${courseIdNum}`);
                }
              } catch (error: any) {
                // 404 est attendu si l'évaluation n'existe pas
                if (error?.status === 404 || error?.response?.status === 404) {
                  evaluationStatusMap.set(courseIdNum, {
                    hasEvaluation: false,
                    isPassed: false
                  });
                  console.log(`[MyCourses] Pas d'évaluation pour le cours ${courseIdNum} (404)`);
                } else {
                  console.warn(`[MyCourses] Erreur lors du chargement de l'évaluation pour le cours ${courseIdNum}:`, error);
                  // En cas d'erreur, considérer qu'il n'y a pas d'évaluation
                  evaluationStatusMap.set(courseIdNum, {
                    hasEvaluation: false,
                    isPassed: false
                  });
                }
              }
            } else if (isEndDatePassed && !enrollmentId) {
              // Date de fin passée mais pas d'enrollmentId : considérer qu'il n'y a pas d'évaluation
              console.warn(`[MyCourses] Cours ${courseIdNum} en live avec date de fin passée mais sans enrollmentId`);
              evaluationStatusMap.set(courseIdNum, {
                hasEvaluation: false,
                isPassed: false
              });
            }
          }
        }
        
        setEvaluationStatuses(evaluationStatusMap);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user]);

  useEffect(() => {
    let filtered = courses;

    // Filtrage par statut
    switch (filterStatus) {
      case 'in-progress':
        filtered = filtered.filter(course => course.progressValue > 0 && course.progressValue < 100);
        break;
      case 'completed':
        filtered = filtered.filter(course => course.progressValue === 100);
        break;
      case 'not-started':
        filtered = filtered.filter(course => course.progressValue === 0);
        break;
    }

    // Filtrage par recherche
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        (course.title || '').toLowerCase().includes(lower) ||
        (course.description || '').toLowerCase().includes(lower) ||
        (course.categoryLabel || '').toLowerCase().includes(lower)
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterStatus]);

  const getStatusBadge = (course: StudentCourse) => {
    const courseAny = course as any;
    const isLiveCourse = courseAny.course_type === 'live' || courseAny.courseType === 'live';
    // Ne pas afficher le badge "Non commencé" pour les cours live
    if (isLiveCourse && course.progressValue === 0) {
      return null;
    }

    if (course.progressValue === 100) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Terminé
        </span>
      );
    } else if (course.progressValue > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Play className="h-3 w-3 mr-1" />
          En cours
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Non commencé
        </span>
      );
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCategoryLabel = (category: any): string => {
    if (!category) return 'Autre';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      const categoryAny = category as any;
      if (categoryAny?.name || categoryAny?.label || categoryAny?.title) {
        return categoryAny.name || categoryAny.label || categoryAny.title;
      }
      if (Array.isArray(categoryAny)) {
        const labels = categoryAny
          .map((item: any) => item?.name || item?.label || item?.title)
          .filter(Boolean);
        return labels.length ? labels.join(', ') : 'Autre';
      }
      return 'Autre';
    }
    return String(category);
  };

  // Fonction pour déterminer le texte et l'URL du bouton pour les cours en live
  const getLiveCourseButtonInfo = (course: StudentCourse): { text: string; href: string } => {
    const courseAny = course as any;
    const isLiveCourse = courseAny.course_type === 'live' || courseAny.courseType === 'live';
    const courseEndDate = courseAny.course_end_date || courseAny.courseEndDate;
    
    if (!isLiveCourse || !courseEndDate) {
      // Cours normal : utiliser la logique standard
      return {
        text: course.progressValue === 100 ? 'Revoir' : course.progressValue > 0 ? 'Continuer' : 'Commencer',
        href: `/learn/${course.id}`
      };
    }
    
    // Vérifier si la date de fin est passée
    const now = new Date();
    const endDate = new Date(courseEndDate);
    const isEndDatePassed = now >= endDate;
    
    if (!isEndDatePassed) {
      // Date de fin pas encore passée : logique standard
      return {
        text: course.progressValue === 100 ? 'Revoir' : course.progressValue > 0 ? 'Continuer' : 'Commencer',
        href: `/learn/${course.id}`
      };
    }
    
    // Si la progression est à 100% (backend a marqué complété), afficher terminé
    if (course.progressValue >= 100) {
      return {
        text: 'Live terminé',
        href: `/learn/${course.id}`
      };
    }

    // Date de fin passée : vérifier l'évaluation
    const courseIdNum = typeof course.id === 'number' ? course.id : Number(course.id);
    const evalStatus = evaluationStatuses.get(courseIdNum);

    // Cas 1 : évaluation validée
    if (evalStatus?.isPassed) {
      return {
        text: 'Live terminé',
        href: `/learn/${course.id}`
      };
    }

    // Cas 2 : évaluation existe et non validée
    if (evalStatus?.hasEvaluation === true && evalStatus.isPassed === false) {
      return {
        text: "Passer à l'évaluation",
        href: `/learn/${course.id}?evaluation=true`
      };
    }

    // Cas 3 : évaluation non détectée (pas dans le map ou hasEvaluation === false)
    // On laisse l'accès pour que le joueur de cours vérifie et affiche l'évaluation si elle existe
    return {
      text: "Passer à l'évaluation",
      href: `/learn/${course.id}?evaluation=true`
    };
  };

  const handleUnenroll = async () => {
    if (!courseToUnenroll) return;
    
    setUnenrollingCourse(String(courseToUnenroll.id));
    try {
      await courseService.unenrollFromCourse(String(courseToUnenroll.id));
      // Retirer le cours de la liste
      setCourses(courses.filter(c => String(c.id) !== String(courseToUnenroll.id)));
      setFilteredCourses(filteredCourses.filter(c => String(c.id) !== String(courseToUnenroll.id)));
      setShowUnenrollModal(false);
      setCourseToUnenroll(null);
      toast.success('Désinscription réussie', `Vous avez été désinscrit du cours "${courseToUnenroll.title}"`);
    } catch (error: any) {
      console.error('Erreur lors de la désinscription:', error);
      const errorMessage = error?.message || 'Erreur lors de la désinscription. Veuillez réessayer.';
      toast.error('Erreur de désinscription', errorMessage);
    } finally {
      setUnenrollingCourse(null);
    }
  };

  const openUnenrollModal = (course: StudentCourse) => {
    setCourseToUnenroll(course);
    setShowUnenrollModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-mdsc-blue-primary rounded-lg p-6 text-white">
  <div className="flex items-center space-x-2 mb-2">
    <BookOpen className="h-7 w-7" />
    <h1 className="text-2xl font-bold">Mes Cours</h1>
  </div>
  <p className="text-mdsc-gray-light">
    Gérez vos cours, suivez votre progression et accédez à vos contenus d'apprentissage.
  </p>
</div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total des cours</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.progressValue === 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Play className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.progressValue > 0 && c.progressValue < 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Progression moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length > 0 
                  ? Math.round(courses.reduce((acc, c) => acc + c.progressValue, 0) / courses.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              >
                <option value="all">Tous les cours</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminés</option>
                <option value="not-started">Non commencés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredCourses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 transition-colors bg-white hover:bg-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      {getStatusBadge(course)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description || 'Aucune description disponible'}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.categoryLabel || getCategoryLabel((course as any).category)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Pas de date'}
                        </span>
                      </div>
                      <Link
                        href={`/courses/${course.id}/forum`}
                        className="inline-flex items-center space-x-1 text-mdsc-blue-primary hover:text-mdsc-blue-dark font-semibold transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Forum</span>
                      </Link>
                      {(() => {
                        const courseAny = course as any;
                        // Vérifier si c'est un cours live avec plusieurs variantes possibles
                        const isLiveCourse = 
                          courseAny.course_type === 'live' || 
                          courseAny.courseType === 'live' ||
                          courseAny.is_live === true ||
                          courseAny.isLive === true;
                        
                        if (!isLiveCourse) return null;
                        
                        const courseIdNum = typeof course.id === 'number' ? course.id : Number(course.id);
                        
                        // Chercher l'URL du contenu d'abord dans l'état (chargée depuis getCourseById)
                        let downloadUrlRaw = courseMaterialUrls.get(courseIdNum) || null;
                        
                        // Si pas trouvée dans l'état, chercher dans les données du cours
                        if (!downloadUrlRaw) {
                          downloadUrlRaw =
                            courseAny.course_material_url ||
                            courseAny.courseMaterialUrl ||
                            courseAny.material_url ||
                            courseAny.materialUrl ||
                            courseAny.materials_url ||
                            courseAny.materialsUrl ||
                            courseAny.content_url ||
                            courseAny.contentUrl ||
                            courseAny.materials ||
                            courseAny.course_materials ||
                            courseAny.courseMaterials ||
                            courseAny.material_file_url ||
                            courseAny.materialFileUrl ||
                            courseAny.document_url ||
                            courseAny.documentUrl ||
                            courseAny.file_url ||
                            courseAny.fileUrl ||
                            courseAny.resource_url ||
                            courseAny.resourceUrl ||
                            courseAny.recording_url ||
                            courseAny.recordingUrl ||
                            courseAny.session_materials ||
                            courseAny.sessionMaterials ||
                            null;
                        }
                        
                        if (!downloadUrlRaw) {
                          // Si pas d'URL trouvée, logger pour débogage
                          console.log(`[MyCourses] ⚠️ Cours live ${courseIdNum} - Aucune URL de contenu trouvée (ni dans courseMaterialUrls ni dans courseAny)`);
                          console.log(`[MyCourses] 🔍 courseMaterialUrls contient:`, Array.from(courseMaterialUrls.entries()));
                          console.log(`[MyCourses] 🔍 Toutes les clés de courseAny pour cours ${courseIdNum}:`, Object.keys(courseAny));
                          // Afficher toutes les clés qui contiennent "url", "material", "content", "file", "document"
                          const relevantKeys = Object.keys(courseAny).filter(key => 
                            key.toLowerCase().includes('url') || 
                            key.toLowerCase().includes('material') || 
                            key.toLowerCase().includes('content') ||
                            key.toLowerCase().includes('file') ||
                            key.toLowerCase().includes('document') ||
                            key.toLowerCase().includes('resource')
                          );
                          console.log(`[MyCourses] 🔍 Clés pertinentes du cours ${courseIdNum}:`, relevantKeys);
                          relevantKeys.forEach(key => {
                            console.log(`[MyCourses]   - ${key}:`, courseAny[key]);
                          });
                          return null;
                        }
                        
                        const downloadUrl = resolveMediaUrl(downloadUrlRaw) || downloadUrlRaw;
                        return (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-mdsc-blue-primary hover:text-mdsc-blue-dark font-semibold transition-colors"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>Télécharger le contenu</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end space-y-3">
                    {/* Barre de progression - Masquée pour les cours en live */}
                    {(() => {
                      const courseAny = course as any;
                      const isLiveCourse = courseAny.course_type === 'live' || courseAny.courseType === 'live';
                      
                      if (isLiveCourse) {
                        return (
                          <div className="w-32 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Cours en live
                            </span>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progression</span>
                            <span>{course.progressValue}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.progressValue)}`}
                              style={{ width: `${course.progressValue}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="flex flex-col items-end space-y-2">
                      {/* Bouton d'action */}
                      {(() => {
                        const buttonInfo = getLiveCourseButtonInfo(course);
                        const isLiveTerminated = buttonInfo.text === 'Live terminé';
                        
                        if (isLiveTerminated) {
                          return (
                            <span className="btn-mdsc-primary text-sm opacity-60 cursor-not-allowed inline-block">
                              {buttonInfo.text}
                            </span>
                          );
                        }
                        
                        return (
                          <a
                            href={buttonInfo.href}
                            className="btn-mdsc-primary text-sm"
                          >
                            {buttonInfo.text}
                          </a>
                        );
                      })()}
                      
                      {/* Bouton de désinscription */}
                      <button
                        onClick={() => openUnenrollModal(course)}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                        disabled={unenrollingCourse === course.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Se désinscrire</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun cours ne correspond à vos critères de recherche.'
                : 'Vous n\'êtes inscrit à aucun cours pour le moment.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <a
                href="/dashboard/student/courses/catalogue"
                className="mt-4 inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-md hover:bg-mdsc-blue-dark transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Découvrir les cours
              </a>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation de désinscription */}
      {showUnenrollModal && courseToUnenroll && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center border-2 border-red-500">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-red-900 mb-2">Confirmer la désinscription</h2>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir vous désinscrire de ce cours ?
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-3">
              <p className="font-semibold text-gray-900 text-lg mb-2">{courseToUnenroll.title}</p>
              
              {/* Nombre d'inscrits */}
              {(() => {
                const enrollmentCount = (courseToUnenroll as any).enrollment_count || (courseToUnenroll as any).metrics?.enrollment_count || 0;
                return enrollmentCount > 0 ? (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span>{enrollmentCount} personne{enrollmentCount > 1 ? 's' : ''} inscrite{enrollmentCount > 1 ? 's' : ''}</span>
                  </div>
                ) : null;
              })()}
              
              {/* Nom du formateur */}
              {(() => {
                const instructor = (courseToUnenroll as any).instructor;
                let instructorName = '';
                if (typeof instructor === 'string' && instructor && instructor !== 'Formateur') {
                  instructorName = instructor;
                } else if (instructor && typeof instructor === 'object') {
                  instructorName = instructor.name || [instructor.first_name, instructor.last_name].filter(Boolean).join(' ') || '';
                } else if ((courseToUnenroll as any).instructor_first_name || (courseToUnenroll as any).instructor_last_name) {
                  instructorName = [(courseToUnenroll as any).instructor_first_name, (courseToUnenroll as any).instructor_last_name].filter(Boolean).join(' ') || '';
                }
                return instructorName && instructorName.trim() && instructorName !== 'Formateur' ? (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                    <User className="h-4 w-4 text-gray-600" />
                    <span>Formateur : {instructorName}</span>
                  </div>
                ) : null;
              })()}
              
              <div className="flex items-center justify-center space-x-2 text-sm text-red-600 pt-2 border-t border-gray-200">
                <AlertTriangle className="h-4 w-4" />
                <span>Vos progrès dans ce cours seront perdus</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowUnenrollModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={unenrollingCourse === courseToUnenroll.id}
              >
                Annuler
              </button>
              <button
                onClick={handleUnenroll}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
                disabled={unenrollingCourse === courseToUnenroll.id}
              >
                {unenrollingCourse === courseToUnenroll.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Désinscription...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Confirmer la désinscription</span>
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
