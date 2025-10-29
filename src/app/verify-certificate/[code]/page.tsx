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
  const code = params?.code as string;
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      verifyCertificate();
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
        setError(result.message || 'Certificat invalide ou expiré');
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vérification de Certificat
          </h1>
          <p className="text-gray-600">
            Code de vérification: <span className="font-mono font-semibold">{code}</span>
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification en cours...</p>
          </div>
        ) : valid && certificate ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-green-900">Certificat Valide</h2>
                <p className="text-green-700 mt-1">
                  Ce certificat a été vérifié et est authentique.
                </p>
              </div>
            </div>

            <CertificateViewer certificate={certificate} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start space-x-3">
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Certificat Invalide</h2>
                <p className="text-red-700 mt-1">
                  {error || 'Ce certificat n\'a pas pu être vérifié. Il peut être invalide, expiré ou avoir été révoqué.'}
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
