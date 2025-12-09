'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import { updateProfile, uploadAvatar, getProfile } from '../../../../lib/services/authService';
import { FileService, FileUpload } from '../../../../lib/services/fileService';
import { 
  Upload, 
  Camera, 
  Loader, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Shield,
  Calendar,
  MapPin,
  Building,
  Globe,
  Briefcase,
  UserCheck,
  Clock,
  Info,
  Hash
} from 'lucide-react';
import toast from '../../../../lib/utils/toast';

function ProfileContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [identityDocument, setIdentityDocument] = useState<FileUpload | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour convertir le code pays en nom complet
  const getCountryName = (countryCode: string): string => {
    const countryMap: Record<string, string> = {
      'BJ': 'Bénin',
      'BF': 'Burkina Faso',
      'CI': "Côte d'Ivoire",
      'SN': 'Sénégal',
      'ML': 'Mali',
      'NE': 'Niger',
      'TG': 'Togo',
      'GN': 'Guinée',
      'CM': 'Cameroun',
      'CD': 'République démocratique du Congo',
      'CG': 'République du Congo',
      'GA': 'Gabon',
      'TD': 'Tchad',
      'CF': 'République centrafricaine',
      'FR': 'France',
      'US': 'États-Unis',
      'CA': 'Canada',
      'BE': 'Belgique',
      'CH': 'Suisse',
      'LU': 'Luxembourg',
    };
    
    // Si c'est déjà un nom complet (plus de 2 caractères), le retourner tel quel
    if (countryCode && countryCode.length > 2) {
      return countryCode;
    }
    
    // Sinon, chercher dans la map
    return countryMap[countryCode?.toUpperCase()] || countryCode || '';
  };

  const getDocumentDisplayName = (doc: FileUpload | null) => {
    if (!doc) return '';
    const docAny = doc as any;
    return (
      doc.originalName ||
      doc.filename ||
      docAny.original_name ||
      docAny.file_name ||
      docAny.filename ||
      'Document'
    );
  };

  const getDocumentDisplayDate = (doc: FileUpload | null) => {
    if (!doc) return '';
    const docAny = doc as any;
    const dateValue =
      doc.createdAt ||
      doc.updatedAt ||
      docAny.created_at ||
      docAny.updated_at ||
      docAny.uploaded_at ||
      '';
    if (!dateValue) return '';
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime())
      ? String(dateValue)
      : parsed.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
  };

  const getDocumentUrl = (doc: FileUpload | null) => {
    if (!doc) return '#';
    const docAny = doc as any;
    return doc.url || docAny.url || docAny.storage_path || '#';
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
    specialization: '',
    website: '',
    organization: user?.organization || '',
    country: user?.country || '',
    npi: user?.npi || '',
  });
  
  const [profileInfo, setProfileInfo] = useState<any>({
    isEmailVerified: false,
    isActive: true,
    createdAt: null,
    updatedAt: null,
    lastLoginAt: null,
    fullName: '',
    role: '',
  });
  
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile();
        if (response.success && response.data) {
          const userData = response.data.user || response.data;
          const userDataAny = userData as any;
          
          // Récupérer le téléphone avec plusieurs variantes possibles
          const phoneValue = userData.phone || 
                            userDataAny.phoneNumber || 
                            userDataAny.telephone || 
                            userDataAny.mobile ||
                            user?.phone || 
                            '';
          
          // Récupérer le NPI avec plusieurs variantes possibles
          const npiValue = userData.npi || 
                          userDataAny.npi_number ||
                          userDataAny.npiNumber ||
                          user?.npi || 
                          '';
          
          setFormData({
            firstName: userData.firstName || user?.firstName || '',
            lastName: userData.lastName || user?.lastName || '',
            email: userData.email || user?.email || '',
            phone: phoneValue,
            bio: userData.bio || '',
            specialization: userData.specialization || '',
            website: userData.website || '',
            organization: userData.organization || user?.organization || '',
            country: userData.country || user?.country || '',
            npi: npiValue,
          });
          
          // Stocker les informations supplémentaires
          setProfileInfo({
            isEmailVerified: userData.isEmailVerified || userDataAny.emailVerified || false,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            createdAt: userData.createdAt || userDataAny.created_at || null,
            updatedAt: userData.updatedAt || userDataAny.updated_at || null,
            lastLoginAt: userData.lastLoginAt || userDataAny.last_login_at || null,
            fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            role: userData.role || user?.role || '',
          });
          
          // Stocker les statistiques si disponibles
          if (response.data.statistics) {
            setStatistics(response.data.statistics);
          }
          
          // Charger l'avatar depuis le profil ou les fichiers
          if (userData.avatarUrl) {
            setProfilePhoto(userData.avatarUrl);
          } else if (response.data.files?.profilePicture?.url) {
            setProfilePhoto(response.data.files.profilePicture.url);
          }

          // Charger la pièce d'identité depuis les fichiers
          if (response.data.files?.identityDocument) {
            setIdentityDocument(response.data.files.identityDocument);
          }
        }

        // Fallback : charger la pièce d'identité via FileService si pas dans la réponse
        if (!identityDocument) {
          try {
            const document = await FileService.getIdentityDocument();
            if (document) setIdentityDocument(document);
          } catch (error) {
            console.error('Error loading identity document:', error);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
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
      toast.warning('Format invalide', 'Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'L\'image ne doit pas dépasser 2 MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await uploadAvatar(file);
      if (response.success && response.data) {
        const photoUrl = response.data.url || response.data.storage_path || response.data.avatarUrl;
        if (photoUrl) {
          setProfilePhoto(photoUrl);
          toast.success('Photo uploadée', 'Votre photo a été mise à jour avec succès');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erreur', 'Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.warning('Format invalide', 'Veuillez sélectionner un fichier PDF, PNG ou JPEG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Fichier trop volumineux', 'Le document ne doit pas dépasser 5 MB');
      return;
    }

    setUploadingDocument(true);
    try {
      const uploaded = await FileService.uploadIdentityDocument(file);
      setIdentityDocument(uploaded);
      toast.success('Document uploadé', 'Votre pièce d\'identité a été enregistrée');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erreur', 'Erreur lors de l\'upload du document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateProfile(formData);
      if (response.success) {
        setUser({ ...user!, ...formData });
        setIsEditing(false);
        toast.success('Profil mis à jour', 'Vos modifications ont été enregistrées');
        
        if (returnUrl) {
          setTimeout(() => {
            window.location.href = decodeURIComponent(returnUrl);
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erreur', error.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-12 w-12 text-mdsc-blue-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et vos préférences</p>
      </div>

      {/* Alert pour mise à jour requise */}
      {returnUrl && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">
                Mise à jour du profil requise
              </p>
              <p className="text-sm text-amber-700">
                Veuillez mettre à jour vos informations personnelles. Une fois les modifications enregistrées, vous serez redirigé pour demander votre certificat.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Photo et actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            {/* Photo de profil */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Photo de profil"
                      className="w-full h-full rounded-full object-cover border-4 border-mdsc-blue-primary shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark flex items-center justify-center border-4 border-gray-200 shadow-lg">
                      <User className="h-16 w-16 text-white" />
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Loader className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profilePhoto ? 'Changer' : 'Ajouter une photo'}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG (Max 2 MB)
              </p>
            </div>

            {/* Informations rapides */}
            <div className="space-y-3 border-t border-gray-200 pt-6">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span>{formData.phone || 'Non renseigné'}</span>
              </div>
              {formData.organization && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate">{formData.organization}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-mdsc-blue-primary/10 rounded-lg mr-3">
                  <User className="h-5 w-5 text-mdsc-blue-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
                  <p className="text-sm text-gray-500">Vos informations de base</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-mdsc-blue-primary bg-mdsc-blue-primary/10 rounded-lg hover:bg-mdsc-blue-primary/20 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </button>
              )}
            </div>

            {!isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Prénom
                    </label>
                    <p className="text-gray-900 font-medium">{formData.firstName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Nom
                    </label>
                    <p className="text-gray-900 font-medium">{formData.lastName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formData.email}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Téléphone
                    </label>
                    <div className="flex items-center text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formData.phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                  {formData.organization && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Organisation
                      </label>
                      <div className="flex items-center text-gray-900">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formData.organization}</span>
                      </div>
                    </div>
                  )}
                  {formData.country && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Pays
                      </label>
                      <div className="flex items-center text-gray-900">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{getCountryName(formData.country)}</span>
                      </div>
                    </div>
                  )}
                  {formData.npi && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        NPI
                      </label>
                      <div className="flex items-center text-gray-900">
                        <Hash className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formData.npi}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Informations du compte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className={`h-4 w-4 ${profileInfo.isEmailVerified ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-600">
                        Email {profileInfo.isEmailVerified ? 'vérifié' : 'non vérifié'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className={`h-4 w-4 ${profileInfo.isActive ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm text-gray-600">
                        Compte {profileInfo.isActive ? 'actif' : 'inactif'}
                      </span>
                    </div>
                    {profileInfo.createdAt && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Créé le {new Date(profileInfo.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {profileInfo.lastLoginAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Dernière connexion : {new Date(profileInfo.lastLoginAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Statistiques si disponibles */}
                {statistics && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Statistiques</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {statistics.enrollments && (
                        <>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{statistics.enrollments.total || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Cours inscrits</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{statistics.enrollments.completed || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Cours terminés</p>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{statistics.enrollments.active || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Cours actifs</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{Math.round(statistics.enrollments.averageProgress || 0)}%</p>
                            <p className="text-xs text-gray-600 mt-1">Progression moyenne</p>
                          </div>
                        </>
                      )}
                      {statistics.badges && (
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{statistics.badges.total || 0}</p>
                          <p className="text-xs text-gray-600 mt-1">Badges obtenus</p>
                        </div>
                      )}
                      {statistics.certificates && (
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <p className="text-2xl font-bold text-indigo-600">{statistics.certificates.total || 0}</p>
                          <p className="text-xs text-gray-600 mt-1">Certificats</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+229 XX XX XX XX"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organisation
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NPI
                    </label>
                    <input
                      type="text"
                      value={formData.npi}
                      onChange={(e) => setFormData({ ...formData, npi: e.target.value })}
                      placeholder="Numéro d'identification professionnel"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Pièce d'identité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Pièce d'identité</h2>
                <p className="text-sm text-gray-500">Document d'identification vérifié</p>
              </div>
            </div>

            {identityDocument ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 mb-1">
                        {getDocumentDisplayName(identityDocument)}
                      </p>
                      {getDocumentDisplayDate(identityDocument) && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Uploadé le {getDocumentDisplayDate(identityDocument)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={getDocumentUrl(identityDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-mdsc-blue-primary bg-white border border-mdsc-blue-primary rounded-lg hover:bg-mdsc-blue-primary hover:text-white transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Voir
                    </a>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="identity-document-reupload"
                    />
                    <label
                      htmlFor="identity-document-reupload"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-white text-mdsc-blue-primary border border-mdsc-blue-primary rounded-lg hover:bg-mdsc-blue-primary hover:text-white transition-colors cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingDocument ? 'Upload...' : 'Remplacer'}
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Formats acceptés : PDF, PNG, JPEG (Max 5 MB)
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2 font-medium">Aucun document d'identité uploadé</p>
                <p className="text-sm text-gray-500 mb-4">
                  Téléchargez votre pièce d'identité pour vérifier votre compte
                </p>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="identity-document-upload"
                />
                <label
                  htmlFor="identity-document-upload"
                  className="inline-flex items-center px-5 py-2.5 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingDocument ? 'Upload en cours...' : 'Uploader un document'}
                </label>
                <p className="text-xs text-gray-500 mt-3">
                  Formats acceptés : PDF, PNG, JPEG (Max 5 MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <Loader className="h-12 w-12 text-mdsc-blue-primary animate-spin" />
            </div>
          }
        >
          <ProfileContent />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  );
}
