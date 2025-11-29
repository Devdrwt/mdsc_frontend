'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { getProfile, updateProfile, uploadAvatar } from '../../../../lib/services/authService';
import toast from '../../../../lib/utils/toast';
import { Camera, Loader } from 'lucide-react';

interface AdminProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  role?: string;
  organization?: string;
}

function AdminProfileContent() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminProfileForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: '',
    role: user?.role,
    organization: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success && response.data) {
          const profile = response.data.user || response.data;
          setFormData({
            firstName: profile.firstName || user?.firstName || '',
            lastName: profile.lastName || user?.lastName || '',
            email: profile.email || user?.email || '',
            bio: profile.bio || '',
            role: profile.role || user?.role,
            organization: profile.organization || '',
          });
          if (profile.avatarUrl) {
            setAvatarUrl(profile.avatarUrl);
          }
        }
      } catch (error) {
        console.error('Erreur profil admin:', error);
        toast.error('Erreur', 'Impossible de charger le profil administrateur.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Format invalide', 'Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', "L'image ne doit pas dépasser 2 MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await uploadAvatar(file);
      const url = response?.data?.url || response?.data?.avatarUrl || response?.data?.storage_path;
      if (url) {
        setAvatarUrl(url);
        toast.success('Photo mise à jour', 'Votre photo de profil a été mise à jour.');
      }
    } catch (error) {
      console.error('Erreur upload photo admin:', error);
      toast.error('Erreur', "Impossible d'uploader la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        organization: formData.organization?.trim(),
      };
      await updateProfile(payload);
      setUser({ ...user!, ...payload });
      setIsEditing(false);
      toast.success('Profil enregistré', 'Les informations administrateur ont été mises à jour.');
    } catch (error: any) {
      console.error('Erreur mise à jour profil admin:', error);
      toast.error('Erreur', error?.message || 'Impossible de mettre à jour le profil.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader className="h-5 w-5 animate-spin mr-2" />
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative w-32 h-32">
            <img
              src={avatarUrl || (user as any)?.avatar || '/images/avatar-placeholder.png'}
              alt="Avatar administrateur"
              className="w-32 h-32 rounded-full object-cover border border-gray-200 shadow"
            />
            <label className="absolute bottom-1 right-1 p-2 rounded-full bg-white shadow cursor-pointer hover:bg-gray-100">
              {uploadingPhoto ? (
                <Loader className="h-4 w-4 animate-spin text-mdsc-blue-primary" />
              ) : (
                <Camera className="h-4 w-4 text-gray-600" />
              )}
              <input type="file" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 uppercase">Administrateur</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-gray-600">{formData.email}</p>
            {formData.organization && <p className="text-gray-500 text-sm">Organisation : {formData.organization}</p>}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-mdsc-blue-primary text-white text-sm font-semibold hover:bg-mdsc-blue-dark transition"
              >
                Modifier le profil
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              disabled={!isEditing}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              disabled={!isEditing}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
            <input
              type="text"
              value={formData.organization || ''}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              disabled={!isEditing}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
            placeholder="Ajoutez une description de votre rôle, vos responsabilités..."
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setIsEditing(false);
                setFormData((prev) => ({
                  ...prev,
                  firstName: user?.firstName || prev.firstName,
                  lastName: user?.lastName || prev.lastName,
                  email: user?.email || prev.email,
                }));
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-mdsc-blue-primary text-white font-semibold hover:bg-mdsc-blue-dark transition"
            >
              Sauvegarder
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin" pageTitle="Profil administrateur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdminProfileContent />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


