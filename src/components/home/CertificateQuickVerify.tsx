'use client';

import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function CertificateQuickVerify() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Faire disparaître le message d'erreur après 5 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // 5 secondes

      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convertir automatiquement en majuscule pendant la saisie
    const value = e.target.value.toUpperCase();
    e.target.value = value;
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (error) {
      setError(null);
    }
  };

  const handleVerify = () => {
    const code = inputRef.current?.value?.trim().toUpperCase();
    if (code && code.length > 0) {
      // Valider le format du code (MDSC-XXXXXXXXX-BJ)
      const codePattern = /^MDSC-\d+-BJ$/;
      if (!codePattern.test(code)) {
        const errorMsg = 'Format de code invalide. Utilisez le format MDSC-XXXXXXXXX-BJ';
        setError(errorMsg);
        inputRef.current?.focus();
        return;
      }
      window.location.href = `/verify-certificate/${encodeURIComponent(code)}`;
    } else {
      // Afficher un message d'erreur si aucun code n'est saisi
      const errorMsg = 'Veuillez saisir un code de vérification de certificat';
      setError(errorMsg);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-8 mb-12">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-[#3B7C8A]/30 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              Vérifier l'authenticité d'un certificat
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Saisissez le code de vérification (<span className="font-mono font-semibold">format MDSC-XXXXXXXXX-BJ</span>), puis cliquez sur « Vérifier ».
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-80">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ex: MDSC-23974999-BJ"
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B7C8A] focus:border-transparent text-gray-900 placeholder:text-gray-400 uppercase transition-colors ${
                  error 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300'
                }`}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <button
              onClick={handleVerify}
              className="px-5 py-2.5 bg-[#3B7C8A] text-white rounded-lg hover:bg-[#2d5f6a] transition-colors font-medium whitespace-nowrap"
            >
              Vérifier
            </button>
          </div>
        </div>
        
        {/* Message d'erreur visible et moderne */}
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
              aria-label="Fermer le message"
            >
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}


