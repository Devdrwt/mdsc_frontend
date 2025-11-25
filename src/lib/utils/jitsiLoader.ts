/**
 * Utilitaire pour charger dynamiquement la bibliothèque Jitsi Meet
 */

declare global {
  interface Window {
    JitsiMeetJS: any;
  }
}

export const loadJitsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Si déjà chargé, résoudre immédiatement
    if (window.JitsiMeetJS) {
      resolve();
      return;
    }

    // Vérifier si le script est déjà en cours de chargement
    const existingScript = document.querySelector(
      'script[src*="lib-jitsi-meet"]'
    );
    if (existingScript) {
      // Attendre que le script existant se charge
      existingScript.addEventListener("load", () => {
        if (window.JitsiMeetJS) {
          resolve();
        } else {
          reject(new Error("JitsiMeetJS not available after script load"));
        }
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Jitsi Meet library"));
      });
      return;
    }

    // Créer et charger le script
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/libs/lib-jitsi-meet.min.js";
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetJS) {
        resolve();
      } else {
        reject(new Error("JitsiMeetJS not available after script load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load Jitsi Meet library"));
    };
    document.head.appendChild(script);
  });
};

/**
 * Vérifier si Jitsi est chargé
 */
export const isJitsiLoaded = (): boolean => {
  return typeof window !== "undefined" && !!window.JitsiMeetJS;
};

