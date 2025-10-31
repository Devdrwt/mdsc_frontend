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
  Image
} from 'lucide-react';
import { moduleService } from '../../../lib/services/moduleService';
import { courseService, Course } from '../../../lib/services/courseService';
import { useAuthStore } from '../../../lib/stores/authStore';
import { Module } from '../../../types/course';
import toast from '../../../lib/utils/toast';

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
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 0,
    image_url: '',
  });

  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineTitle, setInlineTitle] = useState<string>('');

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
      setModules(modulesData || []);
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
    
    try {
      if (editingModule) {
        await moduleService.updateModule(editingModule.id, {
          ...formData,
          order_index: editingModule.order_index || 0,
        });
        toast.success('Module mis à jour', 'Les modifications ont été enregistrées');
      } else {
        await moduleService.createModule(Number(selectedCourseId), {
          ...formData,
          order_index: modules.length,
        });
        toast.success('Module créé', 'Le module a été créé avec succès');
      }
      setShowCreateModal(false);
      setEditingModule(null);
      resetForm();
      loadModules(selectedCourseId);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'opération');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) return;
    
    try {
      await moduleService.deleteModule(id);
      toast.success('Module supprimé', 'Le module a été supprimé avec succès');
      if (selectedCourseId) loadModules(selectedCourseId);
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
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      order_index: 0,
      image_url: '',
    });
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

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all ${isDragging ? 'border-blue-500' : ''}`}
      >
        {module.image_url && (
          <div className="relative w-full h-32 overflow-hidden">
            <img
              src={module.image_url}
              alt={module.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
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
              {module.lessons_count !== undefined && (
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{module.lessons_count} leçons</span>
                </div>
              )}
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
              onClick={() => handleDelete(module.id)}
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
                    URL de l'image d'identification
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemple.com/module-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Image pour identifier le module</p>
                </div>

                {formData.image_url && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Image className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Aperçu</span>
                    </div>
                    <img
                      src={formData.image_url}
                      alt="Aperçu"
                      className="w-full h-32 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

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
    </div>
  );
}
