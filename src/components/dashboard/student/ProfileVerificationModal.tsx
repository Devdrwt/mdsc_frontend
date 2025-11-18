'use client';

import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { getProfile } from '../../../lib/services/authService';
import { useAuthStore } from '../../../lib/stores/authStore';

interface ProfileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateProfile: () => void;
  courseId: string;
}

export default function ProfileVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  onUpdateProfile,
  courseId,
}: ProfileVerificationModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        setProfileData(userData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayData = profileData || user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vérification des données personnelles</h2>
              <p className="text-yellow-100 text-sm">Avant d'émettre votre certificat</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 text-yellow-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Vérification importante
                    </p>
                    <p className="text-sm text-blue-700">
                      Veuillez vérifier que les informations ci-dessous sont exactes. Ces données seront utilisées pour générer votre certificat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Affichage des données */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                      Prénom
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {displayData?.firstName || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                      Nom
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {displayData?.lastName || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                      Email
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {displayData?.email || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                      Téléphone
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {displayData?.phone || 'Non renseigné'}
                    </p>
                  </div>

                  {displayData?.country && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                        Pays
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {displayData.country}
                      </p>
                    </div>
                  )}

                  {displayData?.organization && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                        Organisation
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {displayData.organization}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Question */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ces informations sont-elles exactes ?
                </h3>
                <p className="text-sm text-gray-600">
                  Si oui, votre certificat sera émis avec ces données. Si non, vous serez redirigé vers votre profil pour les mettre à jour.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={onUpdateProfile}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="h-5 w-5" />
                  <span>Non, mettre à jour</span>
                </button>
                <button
                  onClick={onConfirm}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Oui, ces données sont exactes</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

