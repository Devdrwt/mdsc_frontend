'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import DataTable from '../shared/DataTable';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin: string;
  createdAt: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalPoints: number;
  isEmailVerified: boolean;
  organization?: string;
  country?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'pending'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        // Simulation des données utilisateurs - dans un vrai projet, on récupérerait depuis l'API
        const mockUsers: User[] = [
          {
            id: '1',
            firstName: 'Marie',
            lastName: 'Koné',
            email: 'marie.kone@example.com',
            role: 'student',
            status: 'active',
            lastLogin: '2024-01-15 14:30',
            createdAt: '2024-01-10',
            coursesEnrolled: 3,
            coursesCompleted: 1,
            totalPoints: 450,
            isEmailVerified: true,
            organization: 'ONG Développement',
            country: 'CI'
          },
          {
            id: '2',
            firstName: 'Dr. Jean',
            lastName: 'Traoré',
            email: 'jean.traore@example.com',
            role: 'instructor',
            status: 'active',
            lastLogin: '2024-01-15 13:45',
            createdAt: '2024-01-05',
            coursesEnrolled: 0,
            coursesCompleted: 0,
            totalPoints: 0,
            isEmailVerified: true,
            organization: 'Université d\'Abidjan',
            country: 'CI'
          },
          {
            id: '3',
            firstName: 'Fatou',
            lastName: 'Diabaté',
            email: 'fatou.diabate@example.com',
            role: 'student',
            status: 'pending',
            lastLogin: '2024-01-14 10:20',
            createdAt: '2024-01-14',
            coursesEnrolled: 2,
            coursesCompleted: 0,
            totalPoints: 120,
            isEmailVerified: false,
            organization: 'Association Femmes',
            country: 'CI'
          },
          {
            id: '4',
            firstName: 'Paul',
            lastName: 'N\'Guessan',
            email: 'paul.nguessan@example.com',
            role: 'admin',
            status: 'active',
            lastLogin: '2024-01-15 15:00',
            createdAt: '2023-12-01',
            coursesEnrolled: 0,
            coursesCompleted: 0,
            totalPoints: 0,
            isEmailVerified: true,
            organization: 'MdSC',
            country: 'CI'
          },
          {
            id: '5',
            firstName: 'Aminata',
            lastName: 'Ouattara',
            email: 'aminata.ouattara@example.com',
            role: 'student',
            status: 'suspended',
            lastLogin: '2024-01-10 09:15',
            createdAt: '2024-01-08',
            coursesEnrolled: 1,
            coursesCompleted: 0,
            totalPoints: 50,
            isEmailVerified: true,
            organization: 'Coopérative Agricole',
            country: 'CI'
          }
        ];

        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filtrage par rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Inactif
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <UserX className="h-3 w-3 mr-1" />
            Suspendu
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      case 'instructor':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mdsc-gold text-white">
            <Award className="h-3 w-3 mr-1" />
            Formateur
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Users className="h-3 w-3 mr-1" />
            Étudiant
          </span>
        );
      default:
        return null;
    }
  };

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Action ${action} sur l'utilisateur ${userId}`);
    // Implémenter les actions selon le type
  };

  const handleBulkAction = (action: string) => {
    console.log(`Action en masse ${action} sur ${selectedUsers.length} utilisateurs`);
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
      key: 'user',
      label: 'Utilisateur',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-mdsc-blue-dark rounded-full flex items-center justify-center text-white font-semibold">
            {((user?.firstName ?? user?.name ?? user?.email ?? '?').toString().charAt(0) || '?').toUpperCase()}
            {((user?.lastName ?? user?.role ?? '').toString().charAt(0) || '').toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'Utilisateur'}</div>
            <div className="text-sm text-gray-500">{user?.email || 'Email indisponible'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (user: User) => getRoleBadge(user.role)
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (user: User) => getStatusBadge(user.status)
    },
    {
      key: 'activity',
      label: 'Activité',
      sortable: true,
      render: (user: User) => (
        <div className="text-sm">
          <div className="text-gray-900">{(user as any)?.coursesEnrolled ?? (user as any)?.courses ?? 0} cours</div>
          <div className="text-gray-500">Dernière connexion: {(user as any)?.lastLogin || (user as any)?.last_login || 'Inconnue'}</div>
        </div>
      )
    },
    {
      key: 'verification',
      label: 'Vérification',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          {user.isEmailVerified ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm text-gray-600">
            {user.isEmailVerified ? 'Vérifié' : 'Non vérifié'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleUserAction(user.id, 'edit')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleUserAction(user.id, 'email')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Envoyer un email"
          >
            <Mail className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleUserAction(user.id, 'suspend')}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Suspendre"
          >
            <UserX className="h-4 w-4" />
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
            <h1 className="text-2xl font-bold mb-2">Gestion des Utilisateurs 👥</h1>
            <p className="text-gray-300">
              Gérez les comptes utilisateurs, les rôles et les permissions de votre plateforme.
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
              onClick={() => handleBulkAction('invite')}
              className="bg-mdsc-gold hover:bg-yellow-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Inviter des utilisateurs
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-mdsc-gold rounded-lg mr-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Formateurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'instructor').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'pending').length}
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
                placeholder="Rechercher un utilisateur..."
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
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="student">Étudiants</option>
                <option value="instructor">Formateurs</option>
                <option value="admin">Administrateurs</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="suspended">Suspendus</option>
                <option value="pending">En attente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchable={false}
        filterable={false}
        pagination={true}
        pageSize={10}
      />
    </div>
  );
}
