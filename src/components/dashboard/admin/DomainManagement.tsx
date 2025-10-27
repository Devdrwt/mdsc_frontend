'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Building
} from 'lucide-react';
import { ProfessionalService, Domain } from '../../../lib/services/professionalService';

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'folder-open',
    color: '#3b82f6',
  });

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await ProfessionalService.getDomains();
      setDomains(data);
    } catch (error) {
      console.error('Erreur lors du chargement des domaines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDomain) {
        await ProfessionalService.updateDomain(editingDomain.id, formData);
        alert('Domaine mis à jour avec succès');
      } else {
        await ProfessionalService.createDomain(formData);
        alert('Domaine créé avec succès');
      }
      setShowCreateModal(false);
      setEditingDomain(null);
      setFormData({ name: '', description: '', icon: 'folder-open', color: '#3b82f6' });
      loadDomains();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce domaine ?')) return;
    
    try {
      await ProfessionalService.deleteDomain(id);
      alert('Domaine supprimé avec succès');
      loadDomains();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      description: domain.description,
      icon: domain.icon,
      color: domain.color,
    });
    setShowCreateModal(true);
  };

  const filteredDomains = domains.filter(domain =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClass = (color: string) => {
    return color;
  };

  const getIconComponent = (iconName: string, size: number = 24) => {
    switch (iconName) {
      case 'building':
        return <Building size={size} />;
      case 'folder-open':
        return <FolderOpen size={size} />;
      default:
        return <FolderOpen size={size} />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Domaines</h1>
          <p className="text-gray-600 mt-1">Organisez vos formations par domaines professionnels</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setEditingDomain(null);
            setFormData({ name: '', description: '', icon: 'folder-open', color: '#3b82f6' });
          }}
          className="btn-mdsc-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Domaine</span>
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un domaine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Liste des domaines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDomains.map((domain) => (
          <div
            key={domain.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${getColorClass(domain.color)}20`, color: getColorClass(domain.color) }}
              >
                {getIconComponent(domain.icon, 28)}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(domain)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(domain.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{domain.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{domain.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {domain.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Eye className="h-3 w-3 mr-1" />
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inactif
                  </span>
                )}
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Voir modules
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun domaine trouvé</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Aucun domaine ne correspond à votre recherche' : 'Commencez par créer votre premier domaine'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-mdsc-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Créer un domaine</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de création/édition */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDomain ? 'Modifier le Domaine' : 'Nouveau Domaine'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Domaine *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Santé, IT, Finance..."
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
                  placeholder="Décrivez le domaine professionnel..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icône
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="folder-open">Dossier</option>
                    <option value="building">Bâtiment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDomain(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-mdsc-primary"
                >
                  {editingDomain ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
