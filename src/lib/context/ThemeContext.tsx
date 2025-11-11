'use client';

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemePreference = Theme | 'system';

interface ThemeContextType {
  theme: Theme;
  setPreference: (value: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'mdsc-theme';
const STORAGE_LANG_KEY = 'mdsc-language';

const resolveTheme = (preference: ThemePreference): Theme => {
  if (preference === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return preference;
};

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
};

const applyLanguageToDocument = (language?: string | null) => {
  if (typeof document === 'undefined' || !language) {
    return;
  }
  const lang = language === 'fr' || language === 'en' ? language : 'fr';
  document.documentElement.lang = lang;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<Theme>('light');

  const updatePreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THEME_KEY, value);
      // Émettre un événement personnalisé pour notifier les changements de préférence
      window.dispatchEvent(new CustomEvent('mdsc-theme-changed', { detail: { preference: value } }));
    }
  }, []);

  const updateTheme = useCallback((value: Theme) => {
    setTheme(value);
    applyThemeToDocument(value);
  }, []);

  const syncFromStorage = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const storedPref = localStorage.getItem(STORAGE_THEME_KEY) as ThemePreference | null;
      const pref = storedPref === 'light' || storedPref === 'dark' || storedPref === 'system' ? storedPref : 'system';
      updatePreference(pref);
      updateTheme(resolveTheme(pref));

      const storedLanguage = localStorage.getItem(STORAGE_LANG_KEY);
      applyLanguageToDocument(storedLanguage);
    } catch (error) {
      console.warn('Impossible de synchroniser les préférences d\'affichage.', error);
    }
  }, [updatePreference, updateTheme]);

  useEffect(() => {
    syncFromStorage();

    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      setTheme(prev => {
        // Recalculer seulement si la préférence est "system"
        if (preference === 'system') {
          const nextTheme = event.matches ? 'dark' : 'light';
          applyThemeToDocument(nextTheme);
          return nextTheme;
        }
        return prev;
      });
    };

    media.addEventListener('change', handleSystemChange);

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_THEME_KEY || event.key === STORAGE_LANG_KEY) {
        syncFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      media.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [preference, syncFromStorage]);

  const setPreference = useCallback((value: ThemePreference) => {
    updatePreference(value);
    updateTheme(resolveTheme(value));
  }, [updatePreference, updateTheme]);

  const toggle = useCallback(() => {
    // Si la préférence est 'system', on passe directement à 'light' ou 'dark' selon le thème actuel
    if (preference === 'system') {
      const currentTheme = resolveTheme('system');
      const nextPreference: ThemePreference = currentTheme === 'dark' ? 'light' : 'dark';
      setPreference(nextPreference);
    } else {
      // Sinon, on alterne entre 'light' et 'dark'
      const nextPreference: ThemePreference = preference === 'dark' ? 'light' : 'dark';
      setPreference(nextPreference);
    }
  }, [setPreference, preference]);

  return (
    <ThemeContext.Provider value={{ theme, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

