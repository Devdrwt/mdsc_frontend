// Service d'authentification pour communiquer avec l'API backend
import { useAuthStore } from '../stores/authStore';

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
  // Priorité : token passé en paramètre > store Zustand > localStorage (fallback)
  let token: string | null = null;
  
  // Vérifier d'abord dans les headers passés en paramètre (pour getProfile avec token explicite)
  if (options.headers && 'Authorization' in options.headers) {
    const authHeader = (options.headers as any)['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  // Sinon, récupérer depuis le store Zustand
  if (!token) {
    try {
      const { token: storeToken } = useAuthStore.getState();
      token = storeToken;
    } catch (error) {
      console.warn('⚠️ [AUTH SERVICE] Could not access Zustand store, trying localStorage fallback');
    }
  }
  
  // Fallback vers localStorage si le store n'est pas disponible
  if (!token) {
    token = localStorage.getItem('authToken');
  }
  
  // Ajouter le token au header si trouvé
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    // Log pour debug (seulement en développement)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [AUTH SERVICE] Token added to request:', {
        endpoint,
        hasToken: true,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...'
      });
    }
  } else {
    // Log si pas de token trouvé
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [AUTH SERVICE] No token found for request:', endpoint);
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Lire le texte de la réponse
    const responseText = await response.text();
    let data: any = {};
    
    // Essayer de parser en JSON si possible
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      // Si ce n'est pas du JSON, utiliser le texte comme message
      data = { message: responseText || 'Erreur serveur' };
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || 'Une erreur est survenue',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreur réseau ou autre
    throw new ApiError(
      error instanceof Error ? error.message : 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
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
  
  // Si un token est fourni explicitement, l'utiliser
  // Sinon, fetchAPI récupérera le token du store Zustand ou localStorage
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [AUTH SERVICE] getProfile called with explicit token');
  } else {
    // Récupérer le token du store pour vérification
    try {
      const { token: storeToken } = useAuthStore.getState();
      if (storeToken) {
        console.log('🔐 [AUTH SERVICE] getProfile will use token from store');
      } else {
        console.warn('⚠️ [AUTH SERVICE] getProfile called without token and no token in store');
      }
    } catch (error) {
      console.warn('⚠️ [AUTH SERVICE] Could not access store in getProfile');
    }
  }
  
  return await fetchAPI('/users/me', {
    method: 'GET',
    headers,
  });
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
  return await fetchAPI('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
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
export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl?: string; url?: string; storage_path?: string }>> {
  // Validation MIME strict : PNG/JPEG uniquement
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new ApiError('Format d\'image non supporté. Utilisez PNG ou JPEG.', 400);
  }
  
  const formData = new FormData();
  formData.append('file', file);

  return await fetchAPI<{ avatarUrl?: string; url?: string; storage_path?: string }>('/users/me/avatar', {
    method: 'POST',
    body: formData,
    headers: {}, // Ne pas définir Content-Type pour FormData
  });
}

export { ApiError };
export type { RegisterData, LoginData, ApiResponse, AuthData };

