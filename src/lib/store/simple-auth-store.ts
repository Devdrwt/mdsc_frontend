import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../../types';
import { getCurrentUser, isAuthenticated as checkAuth, logout as apiLogout } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | undefined;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signIn: (userData: User, token: string) => void;
  signOut: () => Promise<void>;
  updateUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useSimpleAuthStore = create<AuthState & AuthActions>()(
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
          const user = getCurrentUser();
          const token = localStorage.getItem('authToken');
          
          if (user && token && checkAuth()) {
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
      signIn: (userData: User, token: string) => {
        set({
          user: userData,
          isAuthenticated: true,
          token,
          isLoading: false,
        });
      },

      // Se déconnecter
      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await apiLogout();
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            token: undefined,
            isLoading: false,
          });
        }
      },

      // Mettre à jour l'utilisateur
      updateUser: (user: User | null) => {
        set({ user });
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
      name: 'mdsc-simple-auth-store',
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
  const store = useSimpleAuthStore();
  
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    token: store.token,
    initialize: store.initialize,
    signIn: store.signIn,
    signOut: store.signOut,
    clearAuth: store.clearAuth,
  };
};
