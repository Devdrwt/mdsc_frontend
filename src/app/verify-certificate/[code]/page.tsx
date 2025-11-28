'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Award, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { certificateService } from '../../../lib/services/certificateService';
import { Certificate } from '../../../types/course';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import CertificateViewer from '../../../components/certificates/CertificateViewer';

export default function VerifyCertificatePage() {
  const params = useParams();
  const rawCode = params?.code as string;
  const code = rawCode ? rawCode.toUpperCase() : '';
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code && code.trim().length > 0) {
      verifyCertificate();
    } else {
      setLoading(false);
      setValid(false);
      setError('Aucun code de vérification fourni. Veuillez saisir un code d\'attestation valide.');
    }
  }, [code]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      const result = await certificateService.verifyCertificate(code);
      
      if (result.valid && result.certificate) {
        setValid(true);
        setCertificate(result.certificate);
      } else {
        setValid(false);
        // Message professionnel: code introuvable vs autres cas
        if ((result as any)?.notFound) {
          setError('Attestation non trouvée. Veuillez vérifier le code de vérification.');
        } else {
          setError(result.message || 'Attestation invalide ou expirée. Le code fourni ne correspond à aucune attestation valide.');
        }
      }
    } catch (err: any) {
      setValid(false);
      setError(err.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 px-2">
            Vérification d'Attestation
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 break-all px-2">
            Code de vérification: <span className="font-mono font-semibold text-xs sm:text-sm md:text-base">{code.toUpperCase()}</span>
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 md:p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Vérification en cours...</p>
          </div>
        ) : valid && certificate ? (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-green-900">Attestation Valide</h2>
                <p className="text-xs sm:text-sm md:text-base text-green-700 mt-1 break-words">
                  Cette attestation a été vérifiée et est authentique.
                </p>
              </div>
            </div>

            <div className="w-full overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
              <div className="min-w-0 w-full">
                <CertificateViewer
                  certificate={certificate}
                  showDownload={false}
                  showVerifyOnline={false}
                  showPrint={false}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-red-900">Attestation Invalide</h2>
                <p className="text-xs sm:text-sm md:text-base text-red-700 mt-1 break-words">
                  {error || 'Cette attestation n\'a pas pu être vérifiée. Elle peut être invalide, expirée ou avoir été révoquée.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
