import { useAuthStore } from '../stores/authStore';

// Configuration de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Interface pour les options de requête
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  credentials?: RequestCredentials;
}

// Interface pour la réponse de l'API
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  status: number;
}

// Interface pour les erreurs de l'API
export interface ApiErrorInterface {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Classe d'erreur personnalisée pour l'API
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Fonction utilitaire pour construire l'URL complète
function buildUrl(endpoint: string): string {
  // Si l'endpoint commence par http, retourner tel quel
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Construire l'URL complète
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
}

// Fonction utilitaire pour obtenir les en-têtes d'authentification
function getAuthHeaders(): Record<string, string> {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}

// Fonction utilitaire pour gérer les erreurs de réponse
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: any;
  let responseText: string = '';
  
  try {
    // Lire le texte de la réponse une seule fois
    responseText = await response.text();
    
    // Essayer de parser en JSON
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      // Si ce n'est pas du JSON, utiliser le texte comme message
      data = { message: responseText || 'Erreur serveur' };
    }
  } catch (error) {
    // Si la lecture échoue complètement
    data = { message: 'Impossible de lire la réponse du serveur' };
  }
  
  if (!response.ok) {
    // Log temporaire pour identifier toutes les routes 404
    if (response.status === 404) {
      console.error(`❌ [404] ${response.url}`);
    }
    const error = new ApiError(
      data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data.code,
      data.details
    );
    
    // Gérer les erreurs d'authentification
    if (response.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      throw error;
    }
    
    throw error;
  }
  
  return {
    success: true,
    data: data.data || data,
    message: data.message,
    status: response.status,
  };
}

// Fonction principale pour faire des requêtes API
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'same-origin',
  } = options;
  
  // Construire l'URL complète
  const url = buildUrl(endpoint);
  
  // Obtenir les en-têtes d'authentification
  const authHeaders = getAuthHeaders();
  
  // Préparer les en-têtes
  const requestHeaders: Record<string, string> = {
    ...authHeaders,
    ...headers,
  };
  
  // Ajouter Content-Type pour les requêtes avec body (sauf FormData)
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  
  try {
    // Faire la requête
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
      credentials,
      mode: 'cors',
    });
    
    // Gérer la réponse
    return await handleResponse<T>(response);
  } catch (error) {
    // Gérer les erreurs de réseau
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Erreur de réseau ou autre
    throw new ApiError(
      error instanceof Error ? error.message : 'Erreur de réseau',
      0,
      'NETWORK_ERROR',
      error
    );
  }
}

// Fonction pour faire des requêtes GET
export async function apiGet<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
  let url = endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }
  
  return apiRequest<T>(url, { method: 'GET' });
}

// Fonction pour faire des requêtes POST
export async function apiPost<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Fonction pour faire des requêtes PUT
export async function apiPut<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Fonction pour faire des requêtes DELETE
export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

// Fonction pour faire des requêtes PATCH
export async function apiPatch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Fonction pour uploader des fichiers
export async function apiUpload<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }
  
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

// Fonction pour uploader plusieurs fichiers
export async function apiUploadMultiple<T = any>(
  endpoint: string,
  files: File[],
  additionalData?: Record<string, any>
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file);
  });
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }
  
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

// Fonction pour télécharger des fichiers
export async function apiDownload(endpoint: string): Promise<Blob> {
  const response = await fetch(buildUrl(endpoint), {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new ApiError(
      `Erreur de téléchargement: ${response.statusText}`,
      response.status
    );
  }
  
  return response.blob();
}

// Fonction pour vérifier la santé de l'API
export async function apiHealthCheck(): Promise<boolean> {
  try {
    const response = await apiRequest('/health');
    return response.success;
  } catch (error) {
    return false;
  }
}

// Fonction pour obtenir la version de l'API
export async function apiGetVersion(): Promise<string> {
  try {
    const response = await apiRequest('/version');
    return response.data.version || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Fonction pour obtenir les informations de l'API
export async function apiGetInfo(): Promise<any> {
  try {
    const response = await apiRequest('/info');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les statistiques de l'API
export async function apiGetStats(): Promise<any> {
  try {
    const response = await apiRequest('/stats');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les logs de l'API
export async function apiGetLogs(level?: string, limit?: number): Promise<any[]> {
  try {
    const params: Record<string, any> = {};
    if (level) params.level = level;
    if (limit) params.limit = limit;
    
    const response = await apiGet('/logs', params);
    return response.data;
  } catch (error) {
    return [];
  }
}

// Fonction pour obtenir les métriques de l'API
export async function apiGetMetrics(): Promise<any> {
  try {
    const response = await apiRequest('/metrics');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les endpoints de l'API
export async function apiGetEndpoints(): Promise<any[]> {
  try {
    const response = await apiRequest('/endpoints');
    return response.data;
  } catch (error) {
    return [];
  }
}

// Fonction pour obtenir la documentation de l'API
export async function apiGetDocumentation(): Promise<any> {
  try {
    const response = await apiRequest('/docs');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir le schéma de l'API
export async function apiGetSchema(): Promise<any> {
  try {
    const response = await apiRequest('/schema');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les types de l'API
export async function apiGetTypes(): Promise<any> {
  try {
    const response = await apiRequest('/types');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les modèles de l'API
export async function apiGetModels(): Promise<any> {
  try {
    const response = await apiRequest('/models');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les relations de l'API
export async function apiGetRelations(): Promise<any> {
  try {
    const response = await apiRequest('/relations');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les contraintes de l'API
export async function apiGetConstraints(): Promise<any> {
  try {
    const response = await apiRequest('/constraints');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les index de l'API
export async function apiGetIndexes(): Promise<any> {
  try {
    const response = await apiRequest('/indexes');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les triggers de l'API
export async function apiGetTriggers(): Promise<any> {
  try {
    const response = await apiRequest('/triggers');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les procédures de l'API
export async function apiGetProcedures(): Promise<any> {
  try {
    const response = await apiRequest('/procedures');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les fonctions de l'API
export async function apiGetFunctions(): Promise<any> {
  try {
    const response = await apiRequest('/functions');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les vues de l'API
export async function apiGetViews(): Promise<any> {
  try {
    const response = await apiRequest('/views');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les séquences de l'API
export async function apiGetSequences(): Promise<any> {
  try {
    const response = await apiRequest('/sequences');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les tables de l'API
export async function apiGetTables(): Promise<any> {
  try {
    const response = await apiRequest('/tables');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les colonnes de l'API
export async function apiGetColumns(): Promise<any> {
  try {
    const response = await apiRequest('/columns');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les clés primaires de l'API
export async function apiGetPrimaryKeys(): Promise<any> {
  try {
    const response = await apiRequest('/primary-keys');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les clés étrangères de l'API
export async function apiGetForeignKeys(): Promise<any> {
  try {
    const response = await apiRequest('/foreign-keys');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les clés uniques de l'API
export async function apiGetUniqueKeys(): Promise<any> {
  try {
    const response = await apiRequest('/unique-keys');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les clés de vérification de l'API
export async function apiGetCheckKeys(): Promise<any> {
  try {
    const response = await apiRequest('/check-keys');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir les clés de vérification de l'API
export async function apiGetCheckConstraints(): Promise<any> {
  try {
    const response = await apiRequest('/check-constraints');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Export par défaut
export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPatch,
  apiUpload,
  apiUploadMultiple,
  apiDownload,
  apiHealthCheck,
  apiGetVersion,
  apiGetInfo,
  apiGetStats,
  apiGetLogs,
  apiGetMetrics,
  apiGetEndpoints,
  apiGetDocumentation,
  apiGetSchema,
  apiGetTypes,
  apiGetModels,
  apiGetRelations,
  apiGetConstraints,
  apiGetIndexes,
  apiGetTriggers,
  apiGetProcedures,
  apiGetFunctions,
  apiGetViews,
  apiGetSequences,
  apiGetTables,
  apiGetColumns,
  apiGetPrimaryKeys,
  apiGetForeignKeys,
  apiGetUniqueKeys,
  apiGetCheckKeys,
  apiGetCheckConstraints,
};
