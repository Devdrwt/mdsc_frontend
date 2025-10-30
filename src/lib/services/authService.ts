// Service d'authentification pour communiquer avec l'API backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  npi?: string;
  phone?: string;
  organization?: string;
  country?: string;
  role?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

interface AuthData {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

// Gestion des erreurs API
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fonction helper pour les requêtes fetch
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {};

  // Ne pas définir Content-Type pour FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Ajouter le token d'authentification si disponible
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [DEBUG] Making API request with token:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ [DEBUG] No token found in localStorage');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log('📡 [DEBUG] API Request:', url);
    const response = await fetch(url, config);
    console.log('📥 [DEBUG] API Response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [DEBUG] API Error:', data);
      throw new ApiError(
        data.message || 'Une erreur est survenue',
        response.status,
        data.errors
      );
    }

    console.log('✅ [DEBUG] API Success:', data.success);
    return data;
  } catch (error) {
    console.error('💥 [DEBUG] API Exception:', error);
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreur réseau ou autre
    throw new ApiError(
      'Impossible de se connecter au serveur. Vérifiez votre connexion.',
      0
    );
  }
}

// Inscription
export async function register(data: RegisterData): Promise<ApiResponse> {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Vérification d'email
export async function verifyEmail(token: string): Promise<ApiResponse> {
  return fetchAPI('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// Renvoyer l'email de vérification
export async function resendVerificationEmail(email: string): Promise<ApiResponse> {
  return fetchAPI('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Connexion
export async function login(data: LoginData): Promise<ApiResponse<AuthData>> {
  const response = await fetchAPI<AuthData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Stocker les tokens
  if (response.success && response.data) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response;
}

// Mot de passe oublié
export async function forgotPassword(email: string): Promise<ApiResponse> {
  return fetchAPI('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Réinitialisation du mot de passe
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ApiResponse> {
  return fetchAPI('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

// Rafraîchir le token
export async function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new ApiError('Aucun refresh token disponible', 401);
  }

  const response = await fetchAPI<{ token: string }>('/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  // Mettre à jour le token
  if (response.success && response.data) {
    localStorage.setItem('authToken', response.data.token);
  }

  return response;
}

// Déconnexion
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    await fetchAPI('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    // Même en cas d'erreur, on nettoie le localStorage
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    // Nettoyer le localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// Récupérer le profil utilisateur
export async function getProfile(token?: string): Promise<ApiResponse> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    // Essayer d'abord avec /api/users/me
    return await fetchAPI('/users/me', {
      method: 'GET',
      headers,
    });
  } catch (error: any) {
    // Fallback sur /auth/profile si /users/me n'existe pas
    if (error.statusCode === 404) {
      console.warn('Route /users/me not implemented yet, falling back to /auth/profile');
      return fetchAPI('/auth/profile', {
        method: 'GET',
        headers,
      });
    }
    throw error;
  }
}

// Vérifier si l'utilisateur est connecté
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

// Récupérer l'utilisateur depuis le localStorage
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Intercepteur pour gérer l'expiration du token
export async function handleTokenExpiration() {
  try {
    await refreshToken();
    return true;
  } catch (error) {
    // Si le refresh échoue, déconnecter l'utilisateur
    await logout();
    window.location.href = '/login';
    return false;
  }
}

// Mettre à jour le profil utilisateur
export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  npi?: string;
  phone?: string;
  organization?: string;
  country?: string;
}): Promise<ApiResponse> {
  try {
    // Essayer d'abord avec /api/users/me
    return await fetchAPI('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    // Fallback sur /auth/profile si /users/me n'existe pas
    if (error.statusCode === 404) {
      console.warn('Route /users/me not implemented yet, falling back to /auth/profile');
      return fetchAPI('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    throw error;
  }
}

// Changer le mot de passe
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse> {
  return fetchAPI('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Uploader un avatar
export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    // Essayer d'abord avec /api/users/me/avatar
    return await fetchAPI<{ avatarUrl: string }>('/users/me/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // Ne pas définir Content-Type pour FormData
    });
  } catch (error: any) {
    // Fallback sur /files/upload si /users/me/avatar n'existe pas
    if (error.statusCode === 404) {
      console.warn('Route /users/me/avatar not implemented yet, using /files/upload');
      formData.delete('avatar');
      formData.append('file', file);
      formData.append('category', 'profile-photo');
      return fetchAPI<{ avatarUrl: string }>('/files/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Ne pas définir Content-Type pour FormData
      });
    }
    throw error;
  }
}

export { ApiError };
export type { RegisterData, LoginData, ApiResponse, AuthData };

