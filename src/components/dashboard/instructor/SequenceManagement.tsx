'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  GripVertical,
  Award,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  Copy
} from 'lucide-react';
import { ProfessionalService, Sequence } from '../../../lib/services/professionalService';
import { courseService, Course } from '../../../lib/services/courseService';

export default function SequenceManagement() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState<number | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    sequence_order: 1,
    has_mini_control: false,
    mini_control_points: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getMyCourses();
      setCourses(coursesData);
      
      // Charger les séquences pour tous les cours
      const allSequences: Sequence[] = [];
      for (const course of coursesData) {
        try {
          const courseSequences = await ProfessionalService.getSequencesByCourse(parseInt(course.id));
          allSequences.push(...courseSequences);
        } catch (error) {
          console.error(`Error loading sequences for course ${course.id}:`, error);
        }
      }
      setSequences(allSequences);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSequence) {
        await ProfessionalService.updateSequence(editingSequence.id, {
          ...formData,
          course_id: parseInt(formData.course_id),
        });
        alert('Séquence mise à jour avec succès');
      } else {
        await ProfessionalService.createSequence({
          ...formData,
          course_id: parseInt(formData.course_id),
        });
        alert('Séquence créée avec succès');
      }
      setShowCreateModal(false);
      setEditingSequence(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.message || 'Erreur lors de l\'opération');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séquence ?')) return;
    
    try {
      await ProfessionalService.deleteSequence(id);
      alert('Séquence supprimée avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (sequence: Sequence) => {
    setEditingSequence(sequence);
    setFormData({
      course_id: sequence.course_id.toString(),
      title: sequence.title,
      description: sequence.description,
      sequence_order: sequence.sequence_order,
      has_mini_control: sequence.has_mini_control,
      mini_control_points: sequence.mini_control_points,
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      course_id: '',
      title: '',
      description: '',
      sequence_order: 1,
      has_mini_control: false,
      mini_control_points: 10,
    });
  };

  const filteredSequences = sequences.filter(sequence => {
    if (searchTerm && !sequence.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !sequence.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterCourse !== 'all' && sequence.course_id !== filterCourse) return false;
    return true;
  });

  const getCourseTitle = (courseId: number) => {
    const course = courses.find(c => parseInt(c.id) === courseId);
    return course?.title || 'Cours inconnu';
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Séquences</h1>
          <p className="text-gray-600 mt-1">Organisez le contenu de vos cours par séquences pédagogiques</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setEditingSequence(null);
            resetForm();
          }}
          className="btn-mdsc-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Séquence</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une séquence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les cours</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des séquences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Séquences
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ordre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mini-contrôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSequences
              .sort((a, b) => a.sequence_order - b.sequence_order)
              .map((sequence) => (
              <tr key={sequence.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-lg mr-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sequence.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{sequence.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getCourseTitle(sequence.course_id)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    #{sequence.sequence_order}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sequence.has_mini_control ? (
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-900">{sequence.mini_control_points} pts</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => console.log('Voir contenus', sequence.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Voir les contenus"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(sequence)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sequence.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSequences.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune séquence trouvée</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCourse !== 'all'
                ? 'Aucune séquence ne correspond à vos critères de recherche'
                : 'Commencez par créer votre première séquence'}
            </p>
            {!searchTerm && filterCourse === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-mdsc-primary inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Créer une séquence</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSequence ? 'Modifier la Séquence' : 'Nouvelle Séquence'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cours *
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un cours</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la Séquence *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Introduction à l'Anatomie"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez le contenu de cette séquence..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre dans le cours *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sequence_order}
                    onChange={(e) => setFormData({ ...formData, sequence_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points du mini-contrôle
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.mini_control_points}
                    onChange={(e) => setFormData({ ...formData, mini_control_points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="has_mini_control"
                  checked={formData.has_mini_control}
                  onChange={(e) => setFormData({ ...formData, has_mini_control: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="has_mini_control" className="text-sm font-medium text-gray-700">
                  Ajouter un mini-contrôle à cette séquence
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSequence(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-mdsc-primary"
                >
                  {editingSequence ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
