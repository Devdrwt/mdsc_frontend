'use client';

import React, { useRef } from 'react';

export default function CertificateQuickVerify() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleVerify = () => {
    const code = inputRef.current?.value?.trim();
    if (code) {
      window.location.href = `/verify-certificate/${encodeURIComponent(code)}`;
    } else {
      // Exemple de démo si aucun code saisi
      window.location.href = `/verify-certificate/Mdsc-23974999-Bj`;
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-8 mb-12">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-[#3B7C8A]/30 p-5 sm:p-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">
            Vérifier l’authenticité d’un certificat
          </h3>
          <p className="text-sm text-gray-600">
            Saisissez le code de vérification (<span className="font-mono font-semibold">format Mdsc-xxxxxxxxx-Bj</span>), puis cliquez sur « Vérifier ».
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ex: Mdsc-23974999-Bj"
            className="flex-1 sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B7C8A] focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
          <button
            onClick={handleVerify}
            className="px-5 py-2.5 bg-[#3B7C8A] text-white rounded-lg hover:bg-[#2d5f6a] transition-colors"
          >
            Vérifier
          </button>
        </div>
      </div>
    </section>
  );
}


