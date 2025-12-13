import { useAuthStore } from '../stores/authStore';
import { refreshToken as refreshAuthToken } from './authService';

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
  refreshToken?: boolean; // Indique si un rafraîchissement de token est nécessaire

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
  let token: string | null = null;
  
  // Essayer d'abord de récupérer le token depuis le store Zustand
  try {
    const state = useAuthStore.getState();
    token = state.token;
  } catch (error) {
    // Si le store n'est pas disponible (par exemple pendant le SSR), utiliser localStorage
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('authToken');
    }
  }
  
  // Fallback vers localStorage si le store n'a pas de token
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('authToken');
  }
  
  // Vérifier que le token existe et n'est pas "undefined" ou "null" (string)
  if (!token || token === 'undefined' || token === 'null') {
    return {};
  }
  
  // Logger pour debug du format de token
  console.log('🔐 [API] Token format check:', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token?.substring(0, 20) + '...',
    isJWT: token?.includes('.') && token.split('.').length === 3,
    isLaravelSanctum: token?.includes('|') && !token.includes('.')
  });
  
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
    // Extraire le message d'erreur de différentes sources possibles
    let errorMessage = 'Erreur serveur';
    
    // Vérifier si data existe et est un objet valide
    const hasValidData = data && typeof data === 'object' && data !== null && !Array.isArray(data);
    
    // Essayer plusieurs sources pour le message d'erreur
    if (hasValidData && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      // Gérer les erreurs de validation sous forme de tableau (format: [{field, message}])
      try {
        const errorMessages = data.errors
          .filter((err: any) => err && (err.message || err.error))
          .map((err: any) => {
            const field = err.field ? `${err.field}: ` : '';
            const msg = err.message || err.error || 'Erreur de validation';
            return `${field}${msg}`;
          });
        
        if (errorMessages.length > 0) {
          // Si plusieurs erreurs, les combiner
          if (errorMessages.length === 1) {
            errorMessage = errorMessages[0];
          } else {
            errorMessage = errorMessages.join(' | ');
          }
        } else if (hasValidData && data.message && typeof data.message === 'string') {
          errorMessage = data.message;
        }
      } catch (err) {
        // Si l'extraction des erreurs échoue, continuer avec le message par défaut
        console.warn('Erreur lors de l\'extraction des erreurs de validation (tableau):', err);
        if (hasValidData && data.message && typeof data.message === 'string') {
          errorMessage = data.message;
        }
      }
    } else if (hasValidData && data.message && typeof data.message === 'string') {
      errorMessage = data.message;
    } else if (hasValidData && data.error && typeof data.error === 'string') {
      errorMessage = data.error;
    } else if (hasValidData && data.errors && typeof data.errors === 'object' && data.errors !== null && !Array.isArray(data.errors)) {
      // Gérer les erreurs de validation Laravel (format objet: {field: [messages]})
      try {
        const errorKeys = Object.keys(data.errors);
        if (errorKeys.length > 0) {
          const firstErrorValue = data.errors[errorKeys[0]];
          if (Array.isArray(firstErrorValue) && firstErrorValue.length > 0) {
            errorMessage = String(firstErrorValue[0]);
          } else if (firstErrorValue) {
            errorMessage = String(firstErrorValue);
          }
        }
      } catch (err) {
        // Si l'extraction des erreurs échoue, continuer avec le message par défaut
        console.warn('Erreur lors de l\'extraction des erreurs de validation (objet):', err);
      }
    } else if (responseText && typeof responseText === 'string' && responseText.trim()) {
      // Utiliser le texte de réponse si disponible
      errorMessage = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
    } else {
      // Message par défaut basé sur le code de statut
      errorMessage = `HTTP ${response.status}: ${response.statusText || 'Erreur serveur'}`;
    }
    
    // Construire un objet d'erreur plus informatif pour les logs
    // S'assurer que toutes les propriétés sont définies même si response.url n'est pas disponible
    const errorLog: any = {
      status: response.status || 0,
      statusText: response.statusText || 'Unknown status',
      url: response.url || (typeof window !== 'undefined' ? window.location.href : 'URL unknown'),
      message: errorMessage || 'Erreur inconnue',
    };
    
    // Ajouter les données seulement si elles contiennent quelque chose d'utile
    if (hasValidData) {
      const usefulData: any = {};
      let hasUsefulData = false;
      
      if (data.message && typeof data.message === 'string') {
        usefulData.message = data.message;
        hasUsefulData = true;
      }
      if (data.error && typeof data.error === 'string') {
        usefulData.error = data.error;
        hasUsefulData = true;
      }
      if (data.errors && typeof data.errors === 'object' && data.errors !== null) {
        usefulData.errors = data.errors;
        hasUsefulData = true;
      }
      if (data.code !== undefined) {
        usefulData.code = data.code;
        hasUsefulData = true;
      }
      if (data.details) {
        usefulData.details = data.details;
        hasUsefulData = true;
      }
      
      if (hasUsefulData) {
        errorLog.data = usefulData;
      }
    }
    
    // Ajouter le texte de réponse seulement s'il est utile
    if (responseText && typeof responseText === 'string') {
      const trimmedText = responseText.trim();
      if (trimmedText && trimmedText.length < 500) {
        errorLog.responseText = trimmedText;
      } else if (trimmedText && trimmedText.length >= 500) {
        errorLog.responseTextPreview = trimmedText.substring(0, 500) + '...';
      }
    }
    
    // S'assurer que errorLog a toujours au moins les informations de base
    if (!errorLog.message || !errorLog.status || !errorLog.url) {
      console.warn('⚠️ Erreur lors de la construction du log d\'erreur:', { errorLog, data, responseText });
    }
    
    // Ne pas logger les 404 de manière verbeuse (c'est normal pour les ressources qui n'existent pas encore)
    // Les 404 sont généralement des ressources qui n'existent pas encore ou des endpoints optionnels
    const is404 = response.status === 404;
    const hasSimple404Message = errorLog.message && (
      errorLog.message.toLowerCase().includes('route non trouvée') ||
      errorLog.message.toLowerCase().includes('not found') ||
      errorLog.message.toLowerCase().includes('non trouvée') ||
      errorLog.message.toLowerCase().includes('404')
    );
    
    const hasSimple404Data = errorLog.data?.message && (
      errorLog.data.message.toLowerCase().includes('route non trouvée') ||
      errorLog.data.message.toLowerCase().includes('not found') ||
      errorLog.data.message.toLowerCase().includes('non trouvée') ||
      errorLog.data.message.toLowerCase().includes('404')
    );
    
    // Considérer tous les 404 comme simples sauf s'ils ont des détails d'erreur importants
    // Liste des endpoints où les 404 sont attendus et ne doivent pas être loggés comme erreurs
    const expected404Endpoints = [
      '/notifications',
      '/messages/stats',
      '/messages',
      '/courses/',
    ];
    const isExpected404 = is404 && errorLog.url && expected404Endpoints.some(endpoint => 
      errorLog.url.includes(endpoint)
    );
    
    const isSimple404 = is404 && (
      isExpected404 ||
      !errorLog.data || 
      Object.keys(errorLog.data).length === 0 ||
      hasSimple404Message ||
      hasSimple404Data ||
      // Si le message d'erreur est juste "Route non trouvée" ou similaire, c'est un 404 simple
      (errorLog.data?.message && errorLog.data.message.length < 100)
    );
    
    // Détecter les erreurs 403 simples (accès refusé, peut être normal selon les permissions)
    const is403 = response.status === 403;
    const hasSimple403Message = errorLog.message && (
      errorLog.message.toLowerCase().includes('non autorisé') ||
      errorLog.message.toLowerCase().includes('unauthorized') ||
      errorLog.message.toLowerCase().includes('forbidden') ||
      errorLog.message.toLowerCase().includes('vous n\'êtes pas autorisé')
    );
    
    const isSimple403 = is403 && (
      !errorLog.data || 
      Object.keys(errorLog.data).length === 0 ||
      hasSimple403Message ||
      // Ne pas traiter les 403 "Token expiré" comme simples (ils sont gérés séparément)
      !errorMessage.toLowerCase().includes('token expiré')
    );
    
    if (isSimple404) {
      // Ne pas logger les 404 simples - c'est normal pour les ressources qui n'existent pas encore
      // ou pour les endpoints optionnels qui sont testés avec des fallbacks
    } else if (is404) {
      // Logger les 404 avec des détails importants (mais pas comme une erreur critique)
      console.warn('⚠️ Resource not found (404) with details:', errorLog.url, errorLog.data);
    } else if (isSimple403) {
      // Ne pas logger les 403 simples - c'est normal pour les endpoints nécessitant des permissions spécifiques
      // ou pour les ressources avec accès restreint
    } else if (is403 && errorMessage.toLowerCase().includes('token expiré')) {
      // Ne pas logger les 403 "Token expiré" - ils sont gérés par le mécanisme de refresh automatique
      // Le refresh sera tenté automatiquement, et si ça échoue, l'utilisateur sera déconnecté
    } else if (is403) {
      // Logger les 403 avec des détails importants (mais pas comme une erreur critique)
      console.warn('⚠️ Access forbidden (403) with details:', errorLog.url, errorLog.data);
    } else if (response.status === 429) {
      // Gérer les erreurs 429 (Too Many Requests) de manière gracieuse
      // Ne pas logger comme une erreur critique car c'est une limitation de taux normale
      const retryAfter = data?.retryAfter || errorLog.data?.retryAfter;
      const url = errorLog.url || response.url || 'URL unknown';
      
      // Liste des endpoints où les erreurs 429 sont attendues et doivent être silencieuses
      const silent429Endpoints = [
        '/notifications',
        '/messages/stats',
        '/messages',
        '/courses/', // Pour les requêtes de rafraîchissement automatique
      ];
      
      const isSilentEndpoint = silent429Endpoints.some(endpoint => url.includes(endpoint));
      
      if (isSilentEndpoint) {
        // Ne pas logger pour les endpoints automatiques - c'est normal
        // Créer une erreur silencieuse qui ne sera pas affichée
        // Note: enrichedDetails n'est pas encore défini ici, on le définira plus tard
        const silentError = new ApiError(
          'Trop de requêtes. Veuillez réessayer plus tard.',
          response.status,
          'RATE_LIMIT',
          { url, isSilent: true, isRateLimit: true }
        );
        (silentError as any).isSilent = true;
        (silentError as any).isRateLimit = true;
        throw silentError;
      } else {
        // Logger seulement pour les autres endpoints
        if (retryAfter) {
          console.warn(`⚠️ Rate limit atteint (429). Réessayer après ${retryAfter}s:`, url);
        } else {
          console.warn('⚠️ Rate limit atteint (429). Réessayer plus tard:', url);
        }
      }
    } else {
      // Logger les autres erreurs (non-404, non-403) comme des erreurs critiques
      // S'assurer d'afficher toutes les informations disponibles
      // Construire logData en filtrant les valeurs undefined pour éviter les objets vides
      const logData: Record<string, any> = {};
      
      // Toujours inclure au moins l'URL et le status avec des valeurs par défaut
      const status = errorLog.status || response.status || 'unknown';
      const statusText = errorLog.statusText || response.statusText || '';
      const url = errorLog.url || response.url || 'URL unknown';
      const message = errorLog.message || errorMessage || 'Erreur inconnue';
      
      // N'ajouter que les propriétés qui ont des valeurs définies
      if (status !== undefined && status !== null) {
        logData.status = status;
      }
      if (statusText) {
        logData.statusText = statusText;
      }
      if (url) {
        logData.url = url;
      }
      if (message) {
        logData.message = message;
      }
      
      // Ajouter les données seulement si elles existent et ne sont pas vides
      if (errorLog.data && Object.keys(errorLog.data).length > 0) {
        logData.data = errorLog.data;
      } else if (data && Object.keys(data).length > 0) {
        logData.data = data;
      }
      
      // Ajouter le responseText seulement s'il existe et n'est pas trop long
      const responseTextToLog = errorLog.responseText || errorLog.responseTextPreview || 
        (responseText && responseText.length < 500 ? responseText : undefined);
      if (responseTextToLog) {
        logData.responseText = responseTextToLog;
      }
      
      // Toujours logger avec au moins les informations de base
      if (Object.keys(logData).length > 0) {
        console.error('❌ API Error:', logData);
      } else {
        // Fallback si on n'a même pas les infos de base - toujours logger quelque chose
        console.error('❌ API Error:', {
          status: status || 'unknown',
          url: url || 'URL unknown',
          message: message || 'Erreur inconnue',
          responseStatus: response.status,
          responseStatusText: response.statusText,
        });
      }
    }
    
    const errorCode = hasValidData ? (data.code ?? null) : null;
    const errorDetails = hasValidData ? (data.details ?? data.errors ?? null) : null;

    // Améliorer le message d'erreur pour les 404 avec plus de contexte
    let finalErrorMessage = errorMessage;
    const responseUrl = response.url || errorLog.url || 'URL inconnue';
    if (response.status === 404) {
      finalErrorMessage = `Route non trouvée (404): ${responseUrl}. ${errorMessage || 'La ressource demandée n\'existe pas sur le serveur.'}`;
    } else if (response.status === 429) {
      // Message plus informatif pour les erreurs 429
      const retryAfter = data?.retryAfter || errorLog.data?.retryAfter;
      if (retryAfter) {
        const minutes = Math.ceil(retryAfter / 60);
        finalErrorMessage = `Trop de requêtes. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      } else {
        finalErrorMessage = 'Trop de requêtes. Veuillez réessayer plus tard.';
      }
    }

    // Extraire les détails d'erreur pour les messages plus informatifs
    let errorDetailsMessage = '';
    if (errorDetails) {
      if (typeof errorDetails === 'string') {
        errorDetailsMessage = errorDetails;
      } else if (Array.isArray(errorDetails)) {
        errorDetailsMessage = errorDetails.map((err: any) => 
          typeof err === 'string' ? err : err.message || JSON.stringify(err)
        ).join('. ');
      } else if (typeof errorDetails === 'object') {
        // Extraire les messages d'erreur des propriétés de l'objet
        const detailMessages: string[] = [];
        for (const [key, value] of Object.entries(errorDetails)) {
          if (value) {
            if (typeof value === 'string') {
              detailMessages.push(value);
            } else if (Array.isArray(value)) {
              detailMessages.push(...value.filter((v: any) => typeof v === 'string'));
            } else if (typeof value === 'object' && value !== null && 'message' in value) {
              detailMessages.push((value as any).message);
            }
          }
        }
        if (detailMessages.length > 0) {
          errorDetailsMessage = detailMessages.join('. ');
        } else if ('message' in errorDetails) {
          errorDetailsMessage = String((errorDetails as any).message);
        } else if ('reason' in errorDetails) {
          errorDetailsMessage = String((errorDetails as any).reason);
        }
      }
    }

    // Enrichir le message d'erreur avec les détails si disponibles
    if (errorDetailsMessage && !finalErrorMessage.includes(errorDetailsMessage)) {
      finalErrorMessage = `${finalErrorMessage}${errorDetailsMessage ? `. ${errorDetailsMessage}` : ''}`;
    }

    // Créer un objet de détails enrichi avec l'URL
    const enrichedDetails = {
      ...(errorDetails && typeof errorDetails === 'object' ? errorDetails : {}),
      url: responseUrl,
      endpoint: errorLog.url || responseUrl,
      status: response.status,
      statusText: response.statusText,
      detailsMessage: errorDetailsMessage || undefined,
    };

    const error = new ApiError(
      finalErrorMessage,
      response.status,
      errorCode,
      enrichedDetails
    );
    
    // Gérer les erreurs d'authentification
    if (response.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      throw error;
    }
    
    // Gérer les erreurs 403 "Token expiré" - tenter de rafraîchir le token
    if (response.status === 403 && errorMessage.toLowerCase().includes('token expiré')) {
      // Retourner une erreur spéciale pour indiquer qu'un rafraîchissement est nécessaire
      error.refreshToken = true;
    }
    
    // Pour les erreurs 429 sur les endpoints automatiques, marquer comme silencieuse
    if (response.status === 429) {
      const url = errorLog.url || response.url || '';
      const silent429Endpoints = [
        '/notifications',
        '/messages/stats',
        '/messages',
        '/courses/',
      ];
      const isSilentEndpoint = silent429Endpoints.some(endpoint => url.includes(endpoint));
      if (isSilentEndpoint) {
        // Marquer l'erreur comme silencieuse pour qu'elle ne soit pas affichée à l'utilisateur
        (error as any).isSilent = true;
        (error as any).isRateLimit = true;
      }
    }
    
    throw error;
  }
  
  // Gérer les réponses qui ont à la fois des données au niveau racine et dans data
  // Exemple: { success: true, count: 45, courses: [...], data: { courses: [...], pagination: {...} } }
  let responseData: any;
  
  // Si la réponse a des propriétés au niveau racine (comme courses, count), les préserver
  // mais privilégier data.data s'il existe
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    // Si data.data existe et est un objet, l'utiliser comme base
    responseData = { ...data.data };
    // Mais aussi préserver les propriétés au niveau racine si elles existent
    // (par exemple, si l'API retourne { success: true, count: 45, courses: [...], data: {...} })
    if (data.courses && Array.isArray(data.courses)) {
      // Si courses existe au niveau racine, l'utiliser (il a priorité)
      responseData.courses = data.courses;
    }
    if (data.count !== undefined) {
      responseData.count = data.count;
    }
  } else if (data.courses && Array.isArray(data.courses)) {
    // Si courses est au niveau racine mais pas dans data
    responseData = { 
      courses: data.courses, 
      count: data.count,
      ...(data.data || {}) 
    };
  } else {
    // Sinon, utiliser data.data ou data directement
    responseData = data.data || data;
  }
  
  
  return {
    success: true,
    data: responseData,
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
  
  // Variable pour suivre si on a déjà tenté de rafraîchir le token
  let hasTriedRefresh = false;
  
  // Créer un AbortController avec timeout
  // 30 minutes pour TOUS les uploads (vidéos, documents, audio, PDF, images, etc.)
  // 2 minutes pour les requêtes normales (GET, POST sans fichier)
  const isUpload = endpoint.includes('/upload') || body instanceof FormData;
  const timeoutMs = isUpload ? 30 * 60 * 1000 : 2 * 60 * 1000; // 30 min ou 2 min
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const makeRequest = async (): Promise<ApiResponse<T>> => {
    // Logger pour debug sur POST/PUT/DELETE et GET pour /favorites
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || (method === 'GET' && endpoint.includes('/favorites'))) {
      console.log(`📤 [${method}] ${url}`, {
        headers: requestHeaders,
        body: body instanceof FormData ? '[FormData]' : body,
        endpoint: endpoint,
        timeout: isUpload ? '30 minutes' : '2 minutes'
      });
    }
    
    try {
      // Faire la requête avec signal pour le timeout
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        credentials,
        mode: 'cors',
        signal: controller.signal
      });
      
      // Nettoyer le timeout une fois la réponse reçue
      clearTimeout(timeoutId);
      
      // Gérer la réponse
      return await handleResponse<T>(response);
    } catch (error: any) {
      // Nettoyer le timeout en cas d'erreur
      clearTimeout(timeoutId);
      
      // Gérer l'erreur d'abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error(`La requête a expiré après ${timeoutMs / 1000} secondes. Veuillez réessayer.`);
      }
      
      throw error;
    }
  };
  
  try {
    return await makeRequest();
  } catch (error) {
    // Si c'est une erreur 403 "Token expiré" et qu'on n'a pas encore tenté de rafraîchir
    if (error instanceof ApiError && error.status === 403 && error.refreshToken && !hasTriedRefresh) {
      try {
        console.log('🔄 [API] Token expiré, tentative de rafraîchissement...');
        hasTriedRefresh = true;
        
        // Tenter de rafraîchir le token
        const refreshResponse = await refreshAuthToken();
        
        if (refreshResponse.success && refreshResponse.data?.token) {
          // Mettre à jour le token dans le store
          const { setTokens } = useAuthStore.getState();
          const refreshTokenValue = localStorage.getItem('refreshToken');
          if (refreshTokenValue) {
            setTokens(refreshResponse.data.token, refreshTokenValue);
          }
          
          // Mettre à jour les en-têtes avec le nouveau token
          requestHeaders['Authorization'] = `Bearer ${refreshResponse.data.token}`;
          
          console.log('✅ [API] Token rafraîchi avec succès, nouvelle tentative...');
          
          // Réessayer la requête avec le nouveau token
          return await makeRequest();
        } else {
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          console.error('❌ [API] Échec du rafraîchissement du token');
          const { logout } = useAuthStore.getState();
          logout();
          throw error;
        }
      } catch (refreshError) {
        // Si le rafraîchissement échoue, déconnecter l'utilisateur silencieusement
        // et créer une erreur plus explicite pour l'utilisateur
        console.warn('⚠️ [API] Échec du rafraîchissement du token, déconnexion...');
        const { logout } = useAuthStore.getState();
        logout();
        // Créer une nouvelle erreur avec un message plus clair
        throw new ApiError(
          'Votre session a expiré. Veuillez vous reconnecter.',
          error.status,
          'SESSION_EXPIRED',
          undefined
        );
      }
    }
    
    // Gérer les erreurs de réseau
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Logger les erreurs réseau
    console.error('❌ [API] Network Error:', {
      url,
      method,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof TypeError ? 'TypeError' : 'Unknown',
      isCORS: error instanceof TypeError && error.message.includes('Failed to fetch') ? 'Possibly CORS' : 'No'
    });
    
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
