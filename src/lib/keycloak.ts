import Keycloak from 'keycloak-js';
import { config } from './config';

// Configuration Keycloak
const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'mdsc',
  clientId: 'mdsc-frontend',
};

// Instance Keycloak
let keycloakInstance: Keycloak | null = null;

// Initialiser Keycloak
export const initKeycloak = (): Promise<Keycloak> => {
  return new Promise((resolve, reject) => {
    if (keycloakInstance) {
      resolve(keycloakInstance);
      return;
    }

    keycloakInstance = new Keycloak(keycloakConfig);

    keycloakInstance
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        console.log('Keycloak initialized:', authenticated);
        resolve(keycloakInstance!);
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        reject(error);
      });
  });
};

// Obtenir l'instance Keycloak
export const getKeycloak = (): Keycloak | null => {
  return keycloakInstance;
};

// Se connecter
export const login = (): Promise<void> => {
  if (!keycloakInstance) {
    return initKeycloak().then(() => keycloakInstance!.login());
  }
  return keycloakInstance.login();
};

// Se déconnecter
export const logout = (): Promise<void> => {
  if (!keycloakInstance) {
    return Promise.resolve();
  }
  return keycloakInstance.logout();
};

// Obtenir le token d'accès
export const getAccessToken = (): string | undefined => {
  return keycloakInstance?.token;
};

// Obtenir les informations utilisateur
export const getUserInfo = () => {
  return keycloakInstance?.tokenParsed;
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => {
  return keycloakInstance?.authenticated || false;
};

// Rafraîchir le token
export const refreshToken = (): Promise<boolean> => {
  if (!keycloakInstance) {
    return Promise.resolve(false);
  }
  return keycloakInstance.updateToken(30);
};

// Obtenir les rôles de l'utilisateur
export const getUserRoles = (): string[] => {
  if (!keycloakInstance || !keycloakInstance.authenticated) {
    return [];
  }
  
  const token = keycloakInstance.tokenParsed;
  if (!token) return [];
  
  const realmRoles = token.realm_access?.roles || [];
  const clientRoles = token.resource_access?.[config.keycloak.clientId]?.roles || [];
  
  return [...realmRoles, ...clientRoles];
};

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (role: string): boolean => {
  const roles = getUserRoles();
  return roles.includes(role);
};

// Vérifier si l'utilisateur a l'un des rôles spécifiés
export const hasAnyRole = (roles: string[]): boolean => {
  const userRoles = getUserRoles();
  return roles.some(role => userRoles.includes(role));
};

// Callback pour les événements Keycloak
export const onKeycloakEvent = (callback: (event: string) => void) => {
  if (keycloakInstance) {
    keycloakInstance.onReady = () => callback('onReady');
    keycloakInstance.onAuthSuccess = () => callback('onAuthSuccess');
    keycloakInstance.onAuthError = () => callback('onAuthError');
    keycloakInstance.onAuthRefreshSuccess = () => callback('onAuthRefreshSuccess');
    keycloakInstance.onAuthRefreshError = () => callback('onAuthRefreshError');
    keycloakInstance.onAuthLogout = () => callback('onAuthLogout');
    keycloakInstance.onTokenExpired = () => callback('onTokenExpired');
  }
};
