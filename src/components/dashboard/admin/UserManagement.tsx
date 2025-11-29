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
import Modal from '../../ui/Modal';

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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [inviteProcessing, setInviteProcessing] = useState(false);
  const [inviteFormError, setInviteFormError] = useState<string | null>(null);
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
      setSelectedUsers([]);
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
      setSelectedUsers([]);
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
    setSelectedUsers((prev) =>
      prev.filter((id) => filtered.some((user) => user.id === id))
    );
  }, [users, searchTerm, filterRole, filterStatus]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
      return;
    }
    setSelectedUsers(filteredUsers.map((user) => user.id));
  };

  const getUsersForActions = () => {
    if (selectedUsers.length === 0) {
      return filteredUsers;
    }
    return filteredUsers.filter((user) => selectedUsers.includes(user.id));
  };

  const exportUsersToCsv = (dataset: User[]) => {
    const header = [
      'Prénom',
      'Nom',
      'Nom complet',
      'Email',
      'Rôle',
      'Statut',
      'Cours inscrits',
      'Cours terminés',
      'Dernière connexion',
    ];
    const rows = dataset.map((user) => [
      `"${user.firstName ?? ''}"`,
      `"${user.lastName ?? ''}"`,
      `"${user.name ?? ''}"`,
      `"${user.email ?? ''}"`,
      user.role,
      user.status,
      user.coursesEnrolled ?? 0,
      user.coursesCompleted ?? 0,
      `"${user.lastLogin ?? ''}"`,
    ]);
    const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mdsc-utilisateurs-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportUsers = () => {
    const dataset = getUsersForActions();
    if (dataset.length === 0) {
      notifyErrorRef.current?.(
        'Export impossible',
        'Aucun utilisateur disponible pour l’export.'
      );
      return;
    }
    exportUsersToCsv(dataset);
    notifySuccessRef.current?.(
      'Export CSV prêt',
      `${dataset.length} utilisateur${dataset.length > 1 ? 's' : ''} exporté${dataset.length > 1 ? 's' : ''}.`
    );
  };

  const handleInviteModalClose = () => {
    setInviteModalOpen(false);
    setInviteProcessing(false);
    setInviteFormError(null);
    setInviteEmails('');
    setInviteRole('student');
  };

  const handleInviteSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    const emails = inviteEmails
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (!emails.length) {
      setInviteFormError('Veuillez saisir au moins une adresse e-mail.');
      return;
    }

    const invalidEmail = emails.find(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (invalidEmail) {
      setInviteFormError(`Adresse e-mail invalide: ${invalidEmail}`);
      return;
    }

    setInviteProcessing(true);
    setInviteFormError(null);
    try {
      await AdminService.inviteUsers({
        emails,
        role: inviteRole,
      });
      notifySuccessRef.current?.(
        'Invitations envoyées',
        `${emails.length} contact${emails.length > 1 ? 's' : ''} invité${emails.length > 1 ? 's' : ''}.`
      );
      handleInviteModalClose();
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Impossible d'envoyer les invitations.";
      setInviteFormError(message);
      notifyErrorRef.current?.('Invitations', message);
    } finally {
      setInviteProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Actif
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 shadow-sm">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Inactif
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 shadow-sm">
            <UserX className="h-3.5 w-3.5 mr-1.5" />
            Suspendu
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 shadow-sm">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Admin
          </span>
        );
      case 'instructor':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-mdsc-gold to-yellow-600 text-white shadow-sm">
            <Award className="h-3.5 w-3.5 mr-1.5" />
            Formateur
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" />
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
    switch (action) {
      case 'export':
        handleExportUsers();
        break;
      case 'invite':
        setInviteModalOpen(true);
        break;
      default:
        console.log(`Action en masse ${action} sur ${selectedUsers.length} utilisateurs`);
    }
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
      key: 'select',
      label: '',
      render: (_value: unknown, user: User) => (
        <input
          type="checkbox"
          className="h-4 w-4 text-mdsc-blue-dark border-gray-300 rounded focus:ring-mdsc-blue-dark"
          checked={selectedUsers.includes(user.id)}
          onChange={() => toggleUserSelection(user.id)}
          aria-label={`Sélectionner ${user.email}`}
        />
      )
    },
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUserAction(user.id, 'edit')}
            className="p-2 text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleUserAction(user.id, 'email')}
            className="p-2 text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Envoyer un email"
          >
            <Mail className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRoleToggle(user)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              user.role === 'admin'
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-mdsc-blue-dark hover:bg-blue-50'
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
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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

  const selectionCount = selectedUsers.length;
  const allFilteredSelected = filteredUsers.length > 0 && selectionCount === filteredUsers.length;

  return (
    <>
    <div className="space-y-6 animate-fade-in-up">
      {/* En-tête moderne avec gradient et ombre */}
      <div className="relative bg-gradient-to-br from-mdsc-blue-dark via-[#0C3C5C] to-[#1a4d6b] rounded-xl p-8 text-white shadow-2xl overflow-hidden">
        {/* Effet de brillance animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            </div>
            <p className="text-gray-200 text-base max-w-2xl">
              Gérez les comptes utilisateurs, les rôles et les permissions de votre plateforme avec des outils puissants et intuitifs.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => loadUsers()}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg"
            >
              <span className="relative z-10">Exporter</span>
            </button>
            <button
              onClick={() => handleBulkAction('invite')}
              className="group relative bg-gradient-to-r from-mdsc-gold to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Inviter des utilisateurs
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/60 dark:bg-slate-800/70 border border-blue-200 dark:border-slate-700 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-slate-100">
            {selectionCount > 0
              ? `${selectionCount} utilisateur${selectionCount > 1 ? 's' : ''} sélectionné${selectionCount > 1 ? 's' : ''}`
              : 'Aucun utilisateur sélectionné'}
          </p>
          <p className="text-xs text-blue-800/80 dark:text-slate-300">
            Utilisez les cases pour cibler vos exports ou invitations.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSelectAllFiltered}
            disabled={filteredUsers.length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-blue-300 text-blue-900 bg-white/70 hover:bg-white transition disabled:opacity-60"
          >
            {allFilteredSelected ? 'Tout désélectionner' : 'Sélectionner tous les résultats'}
          </button>
          {selectionCount > 0 && (
            <button
              onClick={() => setSelectedUsers([])}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-blue-900 hover:text-blue-700"
            >
              Effacer la sélection
            </button>
          )}
        </div>
      </div>

      {/* Statistiques rapides avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Actifs</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-mdsc-gold to-yellow-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Formateurs</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'instructor').length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-gray-900">
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

      {/* Filtres et recherche avec design moderne */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-mdsc-blue-dark transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur, email, organisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mdsc-blue-dark focus:border-mdsc-blue-dark transition-all w-full bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer text-gray-700 font-medium"
              >
                <option value="all">Tous les rôles</option>
                <option value="student">Étudiants</option>
                <option value="instructor">Formateurs</option>
                <option value="admin">Administrateurs</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer text-gray-700 font-medium"
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

      <Modal
        isOpen={inviteModalOpen}
        onClose={handleInviteModalClose}
        title="Inviter des utilisateurs"
        size="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Adresses e-mail
            </label>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={4}
              placeholder="exemple1@domaine.com, exemple2@domaine.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-dark focus:ring-2 focus:ring-mdsc-blue-dark/20 transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Séparez les adresses par une virgule, un point-virgule ou un retour à la ligne.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Rôle attribué
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-mdsc-blue-dark focus:ring-2 focus:ring-mdsc-blue-dark/20 transition"
            >
              <option value="student">Étudiant</option>
              <option value="instructor">Formateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {inviteFormError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inviteFormError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleInviteModalClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={inviteProcessing}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-mdsc-blue-dark to-mdsc-blue-primary text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl disabled:opacity-60"
            >
              {inviteProcessing ? 'Envoi...' : 'Envoyer les invitations'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
