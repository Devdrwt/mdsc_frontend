'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  Star,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Award
} from 'lucide-react';
import DataTable from '../shared/DataTable';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorEmail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  studentsEnrolled: number;
  averageRating: number;
  totalLessons: number;
  duration: string;
  price: number;
  tags: string[];
  isPublic: boolean;
  hasCertificate: boolean;
}

export default function CourseModeration() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'published'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'Débutant' | 'Intermédiaire' | 'Avancé'>('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        
        // Simulation des données de cours - dans un vrai projet, on récupérerait depuis l'API
        const mockCourses: Course[] = [
          {
            id: '1',
            title: 'Leadership et Management d\'Équipe',
            description: 'Développez vos compétences en leadership et apprenez à gérer des équipes performantes.',
            instructor: 'Dr. Kouassi Jean',
            instructorEmail: 'jean.kouassi@example.com',
            category: 'Management',
            level: 'Intermédiaire',
            status: 'published',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-15',
            studentsEnrolled: 45,
            averageRating: 4.5,
            totalLessons: 12,
            duration: '8 semaines',
            price: 0,
            tags: ['leadership', 'management', 'équipe'],
            isPublic: true,
            hasCertificate: true
          },
          {
            id: '2',
            title: 'Communication Efficace et Prise de Parole',
            description: 'Maîtrisez l\'art de la communication professionnelle et développez votre aisance à l\'oral.',
            instructor: 'Mme. Traoré Aminata',
            instructorEmail: 'aminata.traore@example.com',
            category: 'Communication',
            level: 'Débutant',
            status: 'pending',
            createdAt: '2024-01-14',
            updatedAt: '2024-01-14',
            studentsEnrolled: 0,
            averageRating: 0,
            totalLessons: 8,
            duration: '6 semaines',
            price: 15000,
            tags: ['communication', 'prise de parole', 'professionnel'],
            isPublic: false,
            hasCertificate: true
          },
          {
            id: '3',
            title: 'Gestion de Projet Agile',
            description: 'Apprenez les méthodologies agiles et devenez un chef de projet efficace.',
            instructor: 'Prof. N\'Guessan Paul',
            instructorEmail: 'paul.nguessan@example.com',
            category: 'Gestion de projet',
            level: 'Avancé',
            status: 'approved',
            createdAt: '2024-01-12',
            updatedAt: '2024-01-15',
            studentsEnrolled: 32,
            averageRating: 4.2,
            totalLessons: 15,
            duration: '10 semaines',
            price: 25000,
            tags: ['agile', 'gestion projet', 'méthodologie'],
            isPublic: true,
            hasCertificate: true
          },
          {
            id: '4',
            title: 'Mobilisation communautaire',
            description: 'Techniques éprouvées pour mobiliser et engager efficacement les communautés.',
            instructor: 'M. Koné Ibrahim',
            instructorEmail: 'ibrahim.kone@example.com',
            category: 'Mobilisation',
            level: 'Intermédiaire',
            status: 'draft',
            createdAt: '2024-01-13',
            updatedAt: '2024-01-13',
            studentsEnrolled: 0,
            averageRating: 0,
            totalLessons: 6,
            duration: '5 semaines',
            price: 0,
            tags: ['mobilisation', 'communauté', 'engagement'],
            isPublic: false,
            hasCertificate: false
          },
          {
            id: '5',
            title: 'Cours de qualité insuffisante',
            description: 'Description très courte et peu détaillée.',
            instructor: 'M. Test',
            instructorEmail: 'test@example.com',
            category: 'Test',
            level: 'Débutant',
            status: 'rejected',
            createdAt: '2024-01-11',
            updatedAt: '2024-01-15',
            studentsEnrolled: 0,
            averageRating: 0,
            totalLessons: 2,
            duration: '1 semaine',
            price: 1000,
            tags: ['test'],
            isPublic: false,
            hasCertificate: false
          }
        ];

        setCourses(mockCourses);
        setFilteredCourses(mockCourses);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    let filtered = courses;

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(course => course.status === filterStatus);
    }

    // Filtrage par niveau
    if (filterLevel !== 'all') {
      filtered = filtered.filter(course => course.level === filterLevel);
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterStatus, filterLevel]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Publié
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Shield className="h-3 w-3 mr-1" />
            Approuvé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Edit className="h-3 w-3 mr-1" />
            Brouillon
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </span>
        );
      default:
        return null;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Débutant':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Débutant
          </span>
        );
      case 'Intermédiaire':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Intermédiaire
          </span>
        );
      case 'Avancé':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Avancé
          </span>
        );
      default:
        return null;
    }
  };

  const handleCourseAction = (courseId: string, action: string) => {
    console.log(`Action ${action} sur le cours ${courseId}`);
    // Implémenter les actions selon le type
  };

  const handleBulkAction = (action: string) => {
    console.log(`Action en masse ${action} sur ${selectedCourses.length} cours`);
    // Implémenter les actions en masse
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark"></div>
      </div>
    );
  }

  const columns = [
    {
      key: 'course',
      label: 'Cours',
      sortable: true,
      render: (course: Course) => (
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 bg-mdsc-gold rounded-lg flex items-center justify-center text-white font-semibold">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 line-clamp-1">{course.title}</div>
            <div className="text-sm text-gray-500 line-clamp-2">{course.description}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">{course.instructor}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{course.category}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'level',
      label: 'Niveau',
      sortable: true,
      render: (course: Course) => getLevelBadge(course.level)
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (course: Course) => getStatusBadge(course.status)
    },
    {
      key: 'metrics',
      label: 'Métriques',
      sortable: true,
      render: (course: Course) => (
        <div className="text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{course.studentsEnrolled}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{course.averageRating > 0 ? course.averageRating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {course.totalLessons} leçons • {course.duration}
          </div>
        </div>
      )
    },
    {
      key: 'pricing',
      label: 'Tarification',
      sortable: true,
      render: (course: Course) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {course.price === 0 ? 'Gratuit' : `${course.price.toLocaleString()} FCFA`}
          </div>
          <div className="text-xs text-gray-500">
            {course.isPublic ? 'Public' : 'Privé'}
          </div>
        </div>
      )
    },
    {
      key: 'created',
      label: 'Créé le',
      sortable: true,
      render: (course: Course) => (
        <div className="text-sm text-gray-600">
          {new Date(course.createdAt).toLocaleDateString('fr-FR')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (course: Course) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCourseAction(course.id, 'view')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Voir le cours"
          >
            <Eye className="h-4 w-4" />
          </button>
          {course.status === 'pending' && (
            <>
              <button
                onClick={() => handleCourseAction(course.id, 'approve')}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Approuver"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCourseAction(course.id, 'reject')}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Rejeter"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleCourseAction(course.id, 'edit')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-mdsc-blue-dark to-gray-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Modération des Cours 📚</h1>
            <p className="text-gray-300">
              Validez, modérez et gérez tous les cours de votre plateforme d'apprentissage.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleBulkAction('export')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Exporter
            </button>
            <button
              onClick={() => handleBulkAction('approve')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Approuver en masse
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total cours</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Publiés</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'published').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Rejetés</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-4">
              <Edit className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
              >
                <option value="all">Tous les niveaux</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des cours */}
      <DataTable
        columns={columns}
        data={filteredCourses}
        searchable={false}
        filterable={false}
        pagination={true}
        pageSize={10}
      />
    </div>
  );
}
