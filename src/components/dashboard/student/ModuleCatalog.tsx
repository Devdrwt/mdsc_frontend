'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Star, 
  Users,
  PlayCircle,
  Award,
  TrendingUp,
  ChevronRight,
  MapPin,
  Target
} from 'lucide-react';
import { ProfessionalService, Module } from '../../../lib/services/professionalService';

export default function ModuleCatalog() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterDomain, setFilterDomain] = useState<string>('all');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      // Récupérer tous les modules disponibles
      const allModules: Module[] = [];
      
      // Charger les modules via les domaines
      const response = await fetch('http://localhost:5000/api/professional/domains', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const domains = await response.json();
        for (const domain of domains) {
          try {
            const modulesResponse = await fetch(`http://localhost:5000/api/professional/domains/${domain.id}/modules`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            if (modulesResponse.ok) {
              const domainModules = await modulesResponse.json();
              allModules.push(...domainModules);
            }
          } catch (error) {
            console.error(`Error loading modules for domain ${domain.id}:`, error);
          }
        }
      }
      
      setModules(allModules);
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (moduleId: number) => {
    if (!confirm('Voulez-vous vous inscrire à ce module ?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/professional/modules/${moduleId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('Inscription réussie !');
        loadModules();
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'inscription');
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = !searchTerm || 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = filterDifficulty === 'all' || module.difficulty === filterDifficulty;
    
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      expert: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[difficulty as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[difficulty as keyof typeof labels] || difficulty}
      </span>
    );
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catalogue de Modules</h1>
        <p className="text-gray-600 mt-2">Découvrez et inscrivez-vous aux modules de formation professionnelle</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les niveaux</option>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé{filteredModules.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des modules */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun module trouvé</h3>
          <p className="text-gray-500">Aucun module ne correspond à vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image du module */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white opacity-50" />
              </div>

              {/* Contenu */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {module.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {module.description}
                </p>

                <div className="flex items-center flex-wrap gap-2 mb-4">
                  {getDifficultyBadge(module.difficulty)}
                  {module.certification_required && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Award className="h-3 w-3 mr-1" />
                      Certification
                    </span>
                  )}
                </div>

                {/* Statistiques */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {module.duration_hours}h
                    </span>
                    {module.price > 0 && (
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {module.price}€
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleEnroll(module.id)}
                  className="w-full btn-mdsc-primary flex items-center justify-center space-x-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>S'inscrire</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
