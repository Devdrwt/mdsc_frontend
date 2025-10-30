'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { updateProfile, uploadAvatar, getProfile } from '../../../../lib/services/authService';
import { FileService } from '../../../../lib/services/fileService';
import { Upload, Camera, Loader } from 'lucide-react';

export default function StudentProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: '',
    specialization: '',
    website: '',
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success && response.data) {
          // Charger l'avatar depuis le profil
          if (response.data.avatarUrl) {
            setProfilePhoto(response.data.avatarUrl);
          } else {
            // Fallback: essayer de charger depuis FileService
            try {
              const photo = await FileService.getProfilePhoto();
              if (photo) {
                setProfilePhoto(photo.url);
              }
            } catch (error) {
              console.error('Error loading profile photo:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await uploadAvatar(file);
      if (response.success && response.data?.avatarUrl) {
        setProfilePhoto(response.data.avatarUrl);
        alert('Photo uploadée avec succès');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateProfile(formData);
      if (response.success) {
        setUser({ ...user!, ...formData });
        setIsEditing(false);
        alert('Profil mis à jour avec succès');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profil Étudiant</h1>
                <p className="text-gray-600 mt-1">Gérez vos informations personnelles</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
                >
                  Modifier le profil
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                {/* Photo de profil */}
                <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                  <div className="relative">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Photo de profil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-mdsc-blue-primary"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                        <Camera className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Loader className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors cursor-pointer"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {profilePhoto ? 'Changer la photo' : 'Uploader une photo'}
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Formats acceptés : JPG, PNG (Max 2 MB)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <div className="text-gray-900">{formData.firstName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <div className="text-gray-900">{formData.lastName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="text-gray-900">{formData.email}</div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
