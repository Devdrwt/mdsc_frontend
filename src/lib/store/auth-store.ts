import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../../types';
import { 
  initKeycloak, 
  getKeycloak, 
  login, 
  logout, 
  getAccessToken, 
  getUserInfo, 
  isAuthenticated,
  refreshToken,
  getUserRoles,
  hasRole,
  hasAnyRole
} from '../keycloak';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User | null) => void;
  refreshAuth: () => Promise<boolean>;
  checkRole: (role: string) => boolean;
  checkAnyRole: (roles: string[]) => boolean;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: undefined,

      // Initialiser l'authentification
      initialize: async () => {
        set({ isLoading: true });
        
        try {
          await initKeycloak();
          const keycloak = getKeycloak();
          
          if (keycloak && keycloak.authenticated) {
            const token = getAccessToken();
            const keycloakUser = getUserInfo();
            
            // Convertir les données Keycloak en format User
            const user: User = {
              id: keycloakUser?.sub || '',
              email: keycloakUser?.email || '',
              firstName: keycloakUser?.given_name || '',
              lastName: keycloakUser?.family_name || '',
              role: getUserRoles().includes('admin') ? 'admin' : 
                   getUserRoles().includes('instructor') ? 'instructor' : 'student',
              organization: keycloakUser?.organization || '',
              createdAt: new Date().toISOString(),
            };

            set({
              user,
              isAuthenticated: true,
              token,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              token: undefined,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({
            user: null,
            isAuthenticated: false,
            token: undefined,
            isLoading: false,
          });
        }
      },

      // Se connecter
      signIn: async () => {
        set({ isLoading: true });
        
        try {
          await login();
          // La redirection Keycloak va gérer la suite
        } catch (error) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Se déconnecter
      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await logout();
          set({
            user: null,
            isAuthenticated: false,
            token: undefined,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Mettre à jour l'utilisateur
      updateUser: (user: User | null) => {
        set({ user });
      },

      // Rafraîchir l'authentification
      refreshAuth: async (): Promise<boolean> => {
        try {
          const refreshed = await refreshToken();
          
          if (refreshed) {
            const token = getAccessToken();
            const keycloakUser = getUserInfo();
            
            if (keycloakUser) {
              const user: User = {
                id: keycloakUser.sub || '',
                email: keycloakUser.email || '',
                firstName: keycloakUser.given_name || '',
                lastName: keycloakUser.family_name || '',
                role: getUserRoles().includes('admin') ? 'admin' : 
                     getUserRoles().includes('instructor') ? 'instructor' : 'student',
                organization: keycloakUser.organization || '',
                createdAt: new Date().toISOString(),
              };

              set({
                user,
                isAuthenticated: true,
                token,
              });
            }
          }
          
          return refreshed;
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().clearAuth();
          return false;
        }
      },

      // Vérifier un rôle spécifique
      checkRole: (role: string): boolean => {
        return hasRole(role);
      },

      // Vérifier si l'utilisateur a l'un des rôles spécifiés
      checkAnyRole: (roles: string[]): boolean => {
        return hasAnyRole(roles);
      },

      // Effacer l'authentification
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: undefined,
          isLoading: false,
        });
      },
    }),
    {
      name: 'mdsc-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);

// Hook pour l'état d'authentification
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    token: store.token,
    initialize: store.initialize,
    signIn: store.signIn,
    signOut: store.signOut,
    refreshAuth: store.refreshAuth,
    checkRole: store.checkRole,
    checkAnyRole: store.checkAnyRole,
    clearAuth: store.clearAuth,
  };
};

// Hook pour vérifier les rôles
export const useRole = () => {
  const { checkRole, checkAnyRole } = useAuthStore();
  
  return {
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
    isAdmin: () => checkRole('admin'),
    isInstructor: () => checkRole('instructor'),
    isStudent: () => checkRole('student'),
    isAdminOrInstructor: () => checkAnyRole(['admin', 'instructor']),
  };
};
