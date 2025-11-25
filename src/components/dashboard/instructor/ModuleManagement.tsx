'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  Users,
  GripVertical,
  Image,
  Upload,
  Loader,
  Clock,
  FileQuestion
} from 'lucide-react';
import { moduleService } from '../../../lib/services/moduleService';
import { courseService, Course } from '../../../lib/services/courseService';
import { FileService } from '../../../lib/services/fileService';
import { useAuthStore } from '../../../lib/stores/authStore';
import { Module } from '../../../types/course';
import toast from '../../../lib/utils/toast';
import { resolveMediaUrl } from '../../../lib/utils/media';
import ConfirmModal from '../../ui/ConfirmModal';
import { quizService } from '../../../lib/services/quizService';

export default function ModuleManagement() {
  const { user } = useAuthStore();
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [reorderTimeout, setReorderTimeout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 0,
    image_url: '',
  });

  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineTitle, setInlineTitle] = useState<string>('');
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<number, boolean>>({}); // moduleId -> hasQuiz
  const [moduleLessons, setModuleLessons] = useState<Record<number, any[]>>({}); // moduleId -> lessons
  
  // États pour l'upload d'image
  const [moduleImageFile, setModuleImageFile] = useState<File | null>(null);
  const [moduleImagePreview, setModuleImagePreview] = useState<string>('');
  const [uploadingModuleImage, setUploadingModuleImage] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourseId) {
      loadModules(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const list = await courseService.getInstructorCourses(user.id.toString(), { status: 'all', page: 1, limit: 100 });
      const arr = Array.isArray(list) ? list : (list as any)?.data || [];
      setCourses(arr);
      if (!selectedCourseId && arr[0]?.id) {
        setSelectedCourseId(String(arr[0].id));
      }
    } catch (e) {
      console.error('Erreur lors du chargement des cours:', e);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (courseId: string) => {
    try {
      setLoading(true);
      const modulesData = await moduleService.getCourseModules(Number(courseId));
      
      // Normaliser les modules pour compatibilité (le backend retourne maintenant image_url)
      const normalizedModules = (modulesData || []).map((m: any) => ({
        ...m,
        image_url: m.image_url || m.imageUrl || null,
        imageUrl: m.image_url || m.imageUrl || null, // Pour compatibilité
      }));
      
      setModules(normalizedModules);
      
      // Charger les leçons et quiz pour chaque module
      if (modulesData && modulesData.length > 0) {
        const lessonsMap: Record<number, any[]> = {};
        const quizzesMap: Record<number, boolean> = {};
        
        // Charger le cours complet pour avoir les leçons
        try {
          const fullCourse = await courseService.getCourseById(courseId);
          const courseAny = fullCourse as any;
          const allLessons = courseAny.lessons || [];
          
          // Grouper les leçons par module
          modulesData.forEach((module: Module) => {
            const moduleLessons = allLessons.filter((lesson: any) => 
              lesson.module_id === module.id || lesson.moduleId === module.id
            );
            lessonsMap[module.id] = moduleLessons;
          });
          
          setModuleLessons(lessonsMap);
        } catch (error) {
          console.error('Erreur lors du chargement des leçons:', error);
        }
        
        // Charger les quiz pour chaque module
        await Promise.all(
          modulesData.map(async (module: Module) => {
            try {
              const quiz = await quizService.getModuleQuiz(String(module.id));
              // Vérifier strictement si le quiz existe et est valide (a un id ou des questions)
              const hasQuiz = quiz !== null && 
                             quiz !== undefined && 
                             (quiz.id || (quiz.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0));
              quizzesMap[module.id] = !!hasQuiz;
            } catch (error) {
              // Si pas de quiz, c'est normal (404)
              quizzesMap[module.id] = false;
            }
          })
        );
        
        setModuleQuizzes(quizzesMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.warning('Sélection requise', 'Veuillez sélectionner un cours');
      return;
    }
    
    // Validation des champs obligatoires (trim pour éviter les espaces)
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      toast.error('Champ requis', 'Le titre du module est obligatoire');
      return;
    }
    
    try {
      if (editingModule) {
        await moduleService.updateModule(editingModule.id, {
          ...formData,
          title: trimmedTitle,
          description: formData.description.trim(),
          order_index: editingModule.order_index || 0,
        });
        toast.success('Module mis à jour', 'Les modifications ont été enregistrées');
      } else {
        await moduleService.createModule(Number(selectedCourseId), {
          ...formData,
          title: trimmedTitle,
          description: formData.description.trim(),
          order_index: modules.length,
        });
        toast.success('Module créé', 'Le module a été créé avec succès');
      }
      setShowCreateModal(false);
      setEditingModule(null);
      resetForm();
      // Recharger les modules pour avoir les données à jour du backend (incluant image_url)
      loadModules(selectedCourseId);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'opération');
    }
  };

  const handleDeleteClick = (id: number) => {
    setModuleToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;
    
    try {
      await moduleService.deleteModule(moduleToDelete);
      toast.success('Module supprimé', 'Le module a été supprimé avec succès');
      if (selectedCourseId) loadModules(selectedCourseId);
      setShowDeleteModal(false);
      setModuleToDelete(null);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Erreur lors de la suppression');
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      order_index: module.order_index || 0,
      image_url: module.image_url || '',
    });
    setModuleImageFile(null);
    setModuleImagePreview(module.image_url || '');
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      order_index: 0,
      image_url: '',
    });
    setModuleImageFile(null);
    setModuleImagePreview('');
  };

  const handleModuleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Format invalide', 'Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'L\'image ne doit pas dépasser 5 MB');
      return;
    }

    setUploadingModuleImage(true);
    try {
      const uploaded = await FileService.uploadFile(file, { category: 'module_identification' });
      const photoUrl = uploaded.url || (uploaded as any).storage_path;
      if (photoUrl) {
        setModuleImageFile(file);
        setModuleImagePreview(photoUrl);
        setFormData({ ...formData, image_url: photoUrl });
        toast.success('Image uploadée', 'Votre image de module a été uploadée avec succès');
      }
    } catch (error: any) {
      console.error('Error uploading module image:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingModuleImage(false);
    }
  };

  const filteredModules = modules.filter(module => {
    if (searchTerm && !module.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(module.description?.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Composant SortableCard avec Drag & Drop
  function SortableCard({ module }: { module: Module }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
      id: module.id,
      disabled: false 
    });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    } as React.CSSProperties;

    // Le backend retourne maintenant image_url formatée (URL complète)
    // Si l'URL est déjà complète (http://), on l'utilise telle quelle
    // Sinon, on utilise resolveMediaUrl pour les chemins relatifs
    const rawImageUrl = module.image_url || module.imageUrl;
    const moduleImageUrl = rawImageUrl 
      ? (rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://')
          ? rawImageUrl
          : resolveMediaUrl(rawImageUrl))
      : null;
    
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all ${isDragging ? 'border-blue-500' : ''}`}
      >
        {/* Image de couverture - toujours affichée */}
        <div className="relative w-full h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {moduleImageUrl ? (
            <>
              <img
                src={moduleImageUrl}
                alt={module.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // En cas d'erreur de chargement, masquer l'image et afficher le placeholder
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
              {/* Placeholder caché par défaut, affiché en cas d'erreur */}
              <div 
                className="absolute inset-0 flex items-center justify-center hidden"
                style={{ display: 'none' }}
              >
                <div className="text-center">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Image non disponible</p>
                </div>
              </div>
            </>
          ) : (
            /* Placeholder si pas d'image */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Aucune image</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          {/* Handle pour drag */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {inlineEditId === module.id ? (
                <input
                  autoFocus
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  onBlur={async () => {
                    try {
                      await moduleService.updateModule(module.id, { title: inlineTitle });
                      setModules(prev => prev.map(m => m.id === module.id ? { ...m, title: inlineTitle } : m));
                    } finally {
                      setInlineEditId(null);
                    }
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      try {
                        await moduleService.updateModule(module.id, { title: inlineTitle });
                        setModules(prev => prev.map(m => m.id === module.id ? { ...m, title: inlineTitle } : m));
                      } finally {
                        setInlineEditId(null);
                      }
                    } else if (e.key === 'Escape') {
                      setInlineEditId(null);
                    }
                  }}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 text-lg font-semibold text-gray-900"
                />
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 mb-2" title={module.title}>
                  {module.title}
                </h3>
              )}
              {module.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
              )}
            </div>
            {/* Drag handle */}
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing ml-3 p-2 hover:bg-gray-100 rounded"
              title="Glisser pour réorganiser"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Informations du module */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-3">
              {(() => {
                const lessons = moduleLessons[module.id] || [];
                const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration || l.duration_minutes || 0), 0);
                const lessonsCount = lessons.length || module.lessons_count || 0;
                // Vérifier strictement si le module a un quiz (doit être explicitement true)
                const hasQuiz = moduleQuizzes[module.id] === true;
                
                return (
                  <>
                    {totalMinutes > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{totalMinutes} min</span>
                      </div>
                    )}
                    {lessonsCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{lessonsCount} leçons</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <FileQuestion className="h-4 w-4" />
                      <span>{hasQuiz ? 1 : 0} quiz</span>
                    </div>
                  </>
                );
              })()}
              {module.is_unlocked ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Déverrouillé
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Verrouillé
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">Ordre: {module.order_index}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-3 border-t border-gray-200 space-x-2">
            <button
              onClick={() => { setInlineEditId(module.id); setInlineTitle(module.title); }}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded"
              title="Renommer"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(module)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteClick(module.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setModules((prev) => {
      const oldIndex = prev.findIndex(m => m.id === active.id);
      const newIndex = prev.findIndex(m => m.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((m, idx) => ({ ...m, order_index: idx }));
      
      // Debounce pour éviter trop d'appels API
      if (selectedCourseId) {
        if (reorderTimeout) clearTimeout(reorderTimeout);
        const t = setTimeout(() => {
          moduleService.reorderCourseModules(
            Number(selectedCourseId),
            reordered.map(m => ({ id: m.id, order_index: m.order_index }))
          ).catch(err => console.error('Erreur réorganisation:', err));
        }, 400);
        setReorderTimeout(t);
      }
      
      return reordered;
    });
  };

  if (loading && !selectedCourseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Modules</h1>
          <p className="text-gray-600 mt-1">Créez et gérez les modules de vos cours</p>
        </div>
        <button
          onClick={() => {
            if (!selectedCourseId) {
              toast.warning('Sélection requise', 'Veuillez d\'abord sélectionner un cours');
              return;
            }
            setShowCreateModal(true);
            setEditingModule(null);
            resetForm();
          }}
          className="btn-mdsc-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Module</span>
        </button>
      </div>

      {/* Sélection du cours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Cours :
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setModules([]);
            }}
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un cours...</option>
            {courses.map(c => (
              <option key={c.id} value={String(c.id)}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres et recherche */}
      {selectedCourseId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un module..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>{filteredModules.length} module{filteredModules.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Liste des modules avec DnD */}
      {selectedCourseId ? (
        <>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filteredModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module) => (
                  <SortableCard key={module.id} module={module} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {filteredModules.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun module trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'Aucun module ne correspond à votre recherche'
                  : 'Commencez par créer votre premier module'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => { setShowCreateModal(true); resetForm(); }}
                  className="btn-mdsc-primary inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Créer un module</span>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un cours</h3>
          <p className="text-gray-500">Veuillez sélectionner un cours pour gérer ses modules</p>
        </div>
      )}

      {/* Modal de création/édition */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingModule ? 'Modifier le Module' : 'Nouveau Module'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingModule(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du Module *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Module 1 - Introduction"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description détaillée du module..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image d'identification
                  </label>
                  {moduleImagePreview ? (
                    <div className="relative mb-2">
                      <img
                        src={moduleImagePreview}
                        alt="Aperçu"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                      />
                      {uploadingModuleImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <Loader className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-2">
                      <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune image sélectionnée</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModuleImageUpload}
                    className="hidden"
                    id="module-image-upload"
                  />
                  <label
                    htmlFor="module-image-upload"
                    className="inline-flex items-center px-4 py-2 bg-mdsc-gold text-white rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {moduleImagePreview ? 'Changer l\'image' : 'Uploader une image'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Formats acceptés : JPG, PNG (Max 5 MB)</p>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingModule(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-mdsc-primary"
                  >
                    {editingModule ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setModuleToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible."
        confirmText="Supprimer"
      />
    </div>
  );
}
