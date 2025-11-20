'use client';

import React, { useMemo } from 'react';

interface CertificatePreviewProps {
  fullName: string;
  courseTitle: string;
  location: string;
  issuedAt: Date;
  code?: string;
}

// Génère un code de certificat au format MDSC-########-BJ
function generateCertificateCode(): string {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `MDSC-${random}-BJ`;
}

export default function CertificatePreview({
  fullName,
  courseTitle,
  location,
  issuedAt,
  code,
}: CertificatePreviewProps) {
  const certificateCode = useMemo(() => {
    const generated = code || generateCertificateCode();
    return generated.toUpperCase();
  }, [code]);

  // URL du QR réel (service public, scannable). On encode une URL de vérification si disponible.
  const qrUrl = useMemo(() => {
    const baseVerify =
      typeof window !== 'undefined'
        ? `${window.location.origin}/verify-certificate/${encodeURIComponent(certificateCode)}`
        : `https://mdsc.local/verify-certificate/${encodeURIComponent(certificateCode)}`;
    const data = encodeURIComponent(baseVerify);
    // Taille calibrée pour s'approcher du rendu de la maquette
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${data}`;
  }, [certificateCode]);

  return (
    <div
      className="w-full bg-white rounded-none border-[8px] sm:border-[12px] lg:border-[15px] border-solid shadow-sm overflow-hidden min-h-[400px] sm:min-h-[600px] lg:min-h-[760px]"
      style={{ borderColor: '#006599' }}
    >
      {/* Cadre bleu et coins décoratifs */}
      <div className="relative p-4 sm:p-6 lg:p-8 xl:p-10">
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute inset-1 sm:inset-2 border-[2px] sm:border-[3px] lg:border-[4px] border-solid rounded-none"
            style={{ borderColor: '#006599' }}
          ></div>
          {/* Décor bas gauche via image */}
          <img
            src="/flangauche.png"
            alt=""
            className="absolute left-1 bottom-1 sm:left-2 sm:bottom-2 w-24 h-auto sm:w-32 md:w-40 lg:w-48 object-contain select-none opacity-60 sm:opacity-80 lg:opacity-100"
          />
          {/* Décor haut droit: rotation 180° (autre sens) */}
          <img
            src="/flangauche.png"
            alt=""
            className="absolute right-1 top-1 sm:right-2 sm:top-2 w-28 h-auto sm:w-36 md:w-44 lg:w-56 object-contain select-none z-[1] opacity-60 sm:opacity-80 lg:opacity-100"
            style={{ transform: 'rotate(180deg)' }}
          />
        </div>

        <div className="relative">
          {/* En-tête */}
          <div className="text-center mt-8 sm:mt-12 lg:mt-16 relative">
            {/* Logo en haut à gauche */}
            <img
              src="/mdsc-logo.png"
              alt="Logo MDSC"
              className="absolute left-2 sm:left-4 -top-16 sm:-top-24 lg:-top-32 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain z-0 pointer-events-none select-none opacity-100"
            />
            {/* Badge en haut à droite */}
            <img
              src="/badge.png"
              alt="Badge"
              className="absolute right-4 sm:right-8 lg:right-16 -top-4 sm:-top-6 lg:-top-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain z-0 pointer-events-none select-none opacity-100"
            />
            <div className="relative z-20">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-700 uppercase tracking-[0.1em] sm:tracking-[0.2em] lg:tracking-[0.32em]">
                CERTIFICAT
              </h1>
              <p className="mt-1 sm:mt-2 uppercase tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.22em] text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
                DE RECONNAISSANCE
              </p>
            </div>
            <p className="mt-3 sm:mt-4 lg:mt-6 text-sm sm:text-base text-mdsc-blue-primary">Ce diplôme est décerné à :</p>
            <p className="mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold text-gray-700 break-words px-2">
              {fullName}
            </p>
          </div>

          {/* Paragraphe */}
          <div className="max-w-3xl mx-auto mt-4 sm:mt-6 text-gray-600 text-xs sm:text-sm md:text-[15px] leading-5 sm:leading-6 text-center px-2 sm:px-4">
            Nous certifions par la présente que {fullName} a complété avec succès la formation&nbsp;
            <span className="font-semibold text-gray-700">« {courseTitle} »</span>.
            Ses réalisations exceptionnelles, son professionnalisme et sa quête
            d'excellence constituent une véritable source d'inspiration.
          </div>

          {/* Lieu et Date sous le paragraphe (même design) - Toujours horizontal */}
          <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-row items-end justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 flex-wrap">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">Fait à :</span>
              <div className="border-b border-gray-300 flex items-center min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px] max-w-[200px] px-1 sm:px-2">
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">{location}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">Le :</span>
              <div className="border-b border-gray-300 flex items-center min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px] max-w-[200px] px-1 sm:px-2">
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">
                  {issuedAt.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* QR + code */}
          <div className="mt-6 sm:mt-8 lg:mt-10 flex items-center justify-center">
            <div className="p-1 sm:p-2 bg-white border border-gray-300 rounded">
              <img
                src={qrUrl}
                width={120}
                height={120}
                alt="Code QR de vérification du certificat"
                className="block w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-[160px] lg:h-[160px]"
              />
            </div>
          </div>
          <p className="mt-1 sm:mt-2 text-center font-mono text-[10px] sm:text-xs text-gray-600 break-all px-2">{certificateCode}</p>

          {/* Sceau (image) en bas à droite, hors flux */}
          <img
            src="/Sceau.png"
            alt="Sceau officiel"
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain opacity-100"
          />
        </div>
      </div>
    </div>
  );
}


