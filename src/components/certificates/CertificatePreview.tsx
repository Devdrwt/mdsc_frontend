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
      className="w-full bg-white rounded-none border-[15px] border-solid shadow-sm overflow-hidden min-h-[760px]"
      style={{ borderColor: '#006599' }}
    >
      {/* Cadre bleu et coins décoratifs */}
      <div className="relative p-8 sm:p-10">
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute inset-2 border-[4px] border-solid rounded-none"
            style={{ borderColor: '#006599' }}
          ></div>
          {/* Décor bas gauche via image */}
          <img
            src="/flangauche.png"
            alt=""
            className="absolute left-2 bottom-2 w-48 h-auto object-contain select-none"
          />
          {/* Décor haut droit: rotation 180° (autre sens) */}
          <img
            src="/flangauche.png"
            alt=""
            className="absolute right-2 top-2 w-56 h-auto object-contain select-none z-[1]"
            style={{ transform: 'rotate(180deg)' }}
          />
        </div>

        <div className="relative">
          {/* En-tête */}
          <div className="text-center mt-16 relative">
            {/* Logo en haut à gauche */}
            <img
              src="/mdsc-logo.png"
              alt="Logo MDSC"
              className="absolute left-4 -top-32 w-56 h-56 object-contain z-0 pointer-events-none select-none opacity-100"
            />
            {/* Badge en haut à droite */}
            <img
              src="/badge.png"
              alt="Badge"
              className="absolute right-16 -top-8 w-32 h-32 object-contain z-0 pointer-events-none select-none opacity-100"
            />
            <div className="relative z-20">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-700 uppercase tracking-[0.32em]">
                CERTIFICAT
              </h1>
              <p className="mt-2 uppercase tracking-[0.22em] text-gray-600 text-lg sm:text-xl font-semibold">
                DE RECONNAISSANCE
              </p>
            </div>
            <p className="mt-6 text-mdsc-blue-primary">Ce diplôme est décerné à :</p>
            <p className="mt-3 text-4xl sm:text-5xl font-semibold text-gray-700">
              {fullName}
            </p>
          </div>

          {/* Paragraphe */}
          <div className="max-w-3xl mx-auto mt-6 text-gray-600 text-sm sm:text-[15px] leading-6 text-center px-4">
            Nous certifions par la présente que {fullName} a complété avec succès la formation&nbsp;
            <span className="font-semibold text-gray-700">« {courseTitle} »</span>.
            Ses réalisations exceptionnelles, son professionnalisme et sa quête
            d’excellence constituent une véritable source d’inspiration.
          </div>

          {/* Lieu et Date sous le paragraphe (même design) */}
          <div className="mt-8 flex items-end justify-center gap-8">
            <div>
              <div className="h-10 text-gray-700 flex items-baseline gap-2">
                <span className="text-sm text-gray-500">Fait à :</span>
                <div className="border-b border-gray-300 flex items-center w-64 sm:w-72 px-2">
                  <span>{location}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="h-10 text-gray-700 flex items-baseline gap-2">
                <span className="text-sm text-gray-500">Le :</span>
                <div className="border-b border-gray-300 flex items-center w-64 sm:w-72 px-2">
                  <span>
                    {issuedAt.toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR + code */}
          <div className="mt-10 flex items-center justify-center">
            <div className="p-2 bg-white border border-gray-300 rounded">
              <img
                src={qrUrl}
                width={160}
                height={160}
                alt="Code QR de vérification du certificat"
                className="block"
              />
            </div>
          </div>
          <p className="mt-2 text-center font-mono text-xs text-gray-600">{certificateCode}</p>

          {/* Sceau (image) en bas à droite, hors flux */}
          <img
            src="/Sceau.png"
            alt="Sceau officiel"
            className="absolute bottom-6 right-6 w-48 h-48 object-contain opacity-100"
          />
        </div>
      </div>
    </div>
  );
}


