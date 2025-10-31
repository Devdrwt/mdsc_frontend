'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, logout as logoutService, getProfile, ApiError } from '../services/authService';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatarUrl?: string;
  npi?: string;
  phone?: string;
  organization?: string;
  country?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial - vérifier si on a déjà un token dans le localStorage
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,
      
      // Fonction d'initialisation appelée après le chargement du store
      initialize: () => {
        const { token, user } = get();
        if (token && user) {
          set({ isAuthenticated: true });
        }
      },

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await login({ email, password });
          
          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;
            
            set({
              user: {
                ...user,
                role: user.role as 'student' | 'instructor' | 'admin',
                isEmailVerified: false,
                createdAt: new Date().toISOString()
              },
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: 'Échec de la connexion',
            });
          }
        } catch (error) {
          console.error('Erreur de connexion:', error);
          
          let errorMessage = 'Erreur lors de la connexion';
          if (error instanceof ApiError) {
            errorMessage = error.message;
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          const { token } = get();
          if (token) {
            await logoutService();
          }
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          // TODO: Implémenter le refresh token
          // const response = await refreshTokenService(refreshToken);
          // set({ token: response.token });
        } catch (error) {
          console.error('Erreur lors du rafraîchissement du token:', error);
          set({ isAuthenticated: false });
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTokens: (token: string, refreshToken: string) => {
        set({ token, refreshToken, isAuthenticated: true });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { token, user } = get();
        
        console.log('🔍 [AUTH STORE] checkAuth called', { hasToken: !!token, hasUser: !!user });
        
        // Si on a déjà un token et un user, on est authentifié
        // Pas besoin de vérifier à chaque fois avec l'API
        if (token && user) {
          console.log('✅ [AUTH STORE] Token and user present, setting isAuthenticated to true');
          set({ isAuthenticated: true });
          return;
        }
        
        // Si pas de token, on n'est pas authentifié
        if (!token) {
          console.log('❌ [AUTH STORE] No token found');
          set({ isAuthenticated: false });
          return;
        }

        // Seulement si on a un token mais pas de user, on va chercher le profil
        try {
          console.log('📡 [AUTH STORE] Fetching profile from API...');
          const response = await getProfile(token);
          
          if (response.success && response.data) {
            console.log('✅ [AUTH STORE] Profile fetched successfully');
            set({
              user: response.data,
              isAuthenticated: true,
            });
          } else {
            console.warn('⚠️ [AUTH STORE] Profile API returned no data, keeping auth state');
            // Si l'API ne retourne pas de user, on garde l'état actuel
            // pour éviter les déconnexions intempestives
            set({ isAuthenticated: true });
          }
        } catch (error) {
          // En cas d'erreur, on garde l'état actuel si on a un token
          console.error('❌ [AUTH STORE] Error during auth check:', error);
          if (token) {
            console.log('🔒 [AUTH STORE] Keeping authenticated state despite error');
            set({ isAuthenticated: true }); // Garder l'état authentifié
          } else {
            set({ isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Après la réhydratation, initialiser isAuthenticated si on a un token et un user
        if (state && state.token && state.user) {
          state.isAuthenticated = true;
        }
        // Marquer comme hydraté
        state.hasHydrated = true;
        console.log('✅ [AUTH STORE] Hydrated', { hasToken: !!state.token, hasUser: !!state.user, isAuthenticated: state.isAuthenticated });
      },
    }
  )
);
