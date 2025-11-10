'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Clock,
  RefreshCw,
  Ban,
  Undo2,
} from 'lucide-react';
import DataTable from '../shared/DataTable';
import AdminService, { AdminUserEntry } from '../../../lib/services/adminService';
import { useNotification } from '../../../lib/hooks/useNotification';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<Record<string, boolean>>({});
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  const { error: notifyError, success: notifySuccess } = useNotification();
  const notifyErrorRef = useRef(notifyError);
  const notifySuccessRef = useRef(notifySuccess);

  useEffect(() => {
    notifyErrorRef.current = notifyError;
    notifySuccessRef.current = notifySuccess;
  }, [notifyError, notifySuccess]);

  const normalizeUser = useCallback((entry: AdminUserEntry): User => {
    const fallbackId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `user-${Math.random().toString(36).slice(2, 10)}`;
    const resolvedId =
      entry.id ?? entry.user_id ?? entry.uuid ?? entry.email ?? fallbackId;
    const resolvedRole = (entry.role || entry.role_name || 'student').toString().toLowerCase();
    const role: User['role'] =
      resolvedRole === 'admin'
        ? 'admin'
        : resolvedRole === 'instructor'
          ? 'instructor'
          : 'student';

    const rawStatus = (entry.status || entry.account_status || 'active')?.toString().toLowerCase();
    const status: User['status'] =
      rawStatus === 'inactive'
        ? 'inactive'
        : rawStatus === 'suspended'
          ? 'suspended'
          : rawStatus === 'pending'
            ? 'pending'
            : 'active';

    const firstName =
      entry.first_name ||
      (entry.name ? entry.name.split(' ')[0] : undefined) ||
      '';
    const lastName =
      entry.last_name ||
      (entry.name ? entry.name.split(' ').slice(1).join(' ') : undefined) ||
      '';

    const displayName =
      entry.name ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      entry.email ||
      '';

    const toNumber = (value: unknown, fallback = 0) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };

    return {
      id: String(resolvedId),
      firstName,
      lastName,
      name: displayName,
      email: entry.email || 'Email indisponible',
      role,
      status,
      lastLogin: entry.last_login || entry.lastLogin || 'Inconnue',
      createdAt: entry.created_at || entry.createdAt || '',
      coursesEnrolled: toNumber(
        (entry as any)?.courses_enrolled ?? (entry as any)?.coursesEnrolled,
        0
      ),
      coursesCompleted: toNumber(
        (entry as any)?.courses_completed ?? (entry as any)?.coursesCompleted,
        0
      ),
      totalPoints: toNumber(entry.total_points ?? entry.totalPoints, 0),
      isEmailVerified: Boolean(
        entry.is_email_verified ?? entry.email_verified ?? false
      ),
      organization: entry.organization,
      country: entry.country,
    };
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getUsers();
      const normalized = response.users.map(normalizeUser);
      setUsers(normalized);
      setFilteredUsers(normalized);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer la liste des utilisateurs.';
      setError(message);
      notifyErrorRef.current?.('Chargement des utilisateurs', message);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const handleRoleToggle = async (user: User) => {
    if (user.role === 'admin') {
      notifyError('Action impossible', 'Le rôle de l\'administrateur ne peut pas être modifié.');
      return;
    }

    const nextRole: User['role'] = user.role === 'instructor' ? 'student' : 'instructor';
    setRoleUpdating(prev => ({ ...prev, [user.id]: true }));

    try {
      await AdminService.updateUserRole(user.id, nextRole);
      notifySuccessRef.current?.(
        'Rôle mis à jour',
        `Le compte ${user.email} est désormais ${nextRole === 'instructor' ? 'formateur' : 'apprenant'}.`
      );
      await loadUsers();
    } catch (err) {
      console.error(`Erreur lors de la mise à jour du rôle pour ${user.id}:`, err);
      const message =
        err instanceof Error
          ? err.message
          : 'La mise à jour du rôle a échoué. Veuillez réessayer.';
      notifyErrorRef.current?.('Mise à jour du rôle', message);
    } finally {
      setRoleUpdating(prev => {
        const updated = { ...prev };
        delete updated[user.id];
        return updated;
      });
    }
  };

  const handleSuspendToggle = async (user: User) => {
    if (user.role === 'admin') {
      notifyErrorRef.current?.('Action impossible', 'Impossible de suspendre un administrateur.');
      return;
    }

    const isSuspended = user.status === 'suspended';
    const actionLabel = isSuspended ? 'réactiver' : 'suspendre';

  if (
    !window.confirm(
      `Voulez-vous vraiment ${actionLabel} ${user.email || 'cet utilisateur'} ?\n\nVoulez-vous continuer ?`
    )
  ) {
      return;
    }

    setStatusUpdating(prev => ({ ...prev, [user.id]: true }));

    try {
      if (isSuspended) {
        await AdminService.reactivateUser(user.id);
        notifySuccessRef.current?.('Réactivation réussie', `${user.email || 'Utilisateur'} est à nouveau actif.`);
      } else {
        await AdminService.suspendUser(user.id);
        notifySuccessRef.current?.('Utilisateur suspendu', `${user.email || 'Utilisateur'} a été suspendu.`);
      }
      await loadUsers();
    } catch (err) {
      console.error(`Erreur lors de la mise à jour du statut de ${user.id}:`, err);
      const message = err instanceof Error ? err.message : 'Impossible de mettre à jour le statut de l\'utilisateur.';
      notifyErrorRef.current?.('Erreur suspension', message);
    } finally {
      setStatusUpdating(prev => {
        const updated = { ...prev };
        delete updated[user.id];
        return updated;
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin') {
      notifyErrorRef.current?.('Action impossible', 'Impossible de supprimer un administrateur.');
      return;
    }

    if (
      !window.confirm(
        `Cette action supprimera définitivement ${user.email || 'cet utilisateur'}.\n\nVoulez-vous continuer ?`
      )
    ) {
      return;
    }

    setStatusUpdating(prev => ({ ...prev, [user.id]: true }));

    try {
      await AdminService.deleteUser(user.id);
      notifySuccessRef.current?.('Utilisateur supprimé', `${user.email || 'Utilisateur'} a été supprimé.`);
      await loadUsers();
    } catch (err) {
      console.error(`Erreur lors de la suppression de ${user.id}:`, err);
      const message = err instanceof Error ? err.message : 'Impossible de supprimer l\'utilisateur.';
      notifyErrorRef.current?.('Erreur suppression', message);
    } finally {
      setStatusUpdating(prev => {
        const updated = { ...prev };
        delete updated[user.id];
        return updated;
      });
    }
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
      render: (_value: unknown, user: User) => (
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
      render: (_value: unknown, user: User) => getRoleBadge(user?.role ?? '')
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (_value: unknown, user: User) => getStatusBadge(user?.status ?? '')
    },
    {
      key: 'activity',
      label: 'Activité',
      sortable: true,
      render: (_value: unknown, user: User) => (
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
      render: (_value: unknown, user: User) => (
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
      render: (_value: unknown, user: User) => (
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
            onClick={() => handleRoleToggle(user)}
            className={`p-1 ${
              user.role === 'admin'
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-mdsc-blue-dark transition-colors'
            }`}
            title={
              user.role === 'instructor'
                ? 'Rebasculer en apprenant'
                : 'Attribuer le rôle formateur'
            }
            disabled={roleUpdating[user.id] || user.role === 'admin'}
          >
            {roleUpdating[user.id] ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : user.role === 'instructor' ? (
              <Users className="h-4 w-4" />
            ) : (
              <Award className="h-4 w-4" />
            )}
          </button>
          {user.role !== 'admin' && (
            <>
              <button
                onClick={() => handleSuspendToggle(user)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title={user.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                disabled={Boolean(statusUpdating[user.id])}
              >
                {statusUpdating[user.id] ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : user.status === 'suspended' ? (
                  <Undo2 className="h-4 w-4" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleDeleteUser(user)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Supprimer l'utilisateur"
                disabled={Boolean(statusUpdating[user.id])}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
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
              onClick={() => loadUsers()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4">
          {error}
        </div>
      )}

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
      {!loading && !error && filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-dashed border-gray-300 p-12 text-center text-gray-500">
          Aucun utilisateur ne correspond aux critères sélectionnés.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchable={false}
          filterable={false}
          pagination={true}
          pageSize={10}
        />
      )}
    </div>
  );
}
