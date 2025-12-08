'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import CertificatePreview from '../../../../components/certificates/CertificatePreview';
import { certificateService } from '../../../../lib/services/certificateService';
import type { Certificate } from '../../../../types/course';

export default function CertificatePrintPage() {
  const params = useParams();
  const certId = params?.id as string;
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const cert = await certificateService.getById(certId);
        if (!cert) {
          setError('Attestation introuvable');
        } else {
          setCertificate(cert as any);
          setError(null);
        }
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement de l\'attestation');
      } finally {
        setLoading(false);
      }
    };
    if (certId) load();
  }, [certId]);

  const fullName = useMemo(() => {
    if (!certificate) return 'Utilisateur(trice)';
    const first = (certificate as any).first_name || (certificate as any).firstName || '';
    const last = (certificate as any).last_name || (certificate as any).lastName || '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Utilisateur(trice)';
  }, [certificate]);

  useEffect(() => {
    if (!loading && certificate) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, certificate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
          <div className="text-sm sm:text-base text-gray-600">Chargement de l'attestation…</div>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 text-sm sm:text-base">{error || 'Attestation introuvable'}</div>
        </div>
      </div>
    );
  }

  const issuedAt =
    (certificate as any).issuedAt ||
    (certificate as any).issued_at ||
    new Date().toISOString();

  const courseTitle =
    certificate.course?.title ||
    (certificate as any).course_title ||
    '—';

  const code =
    (certificate as any).certificate_code ||
    (certificate as any).certificateCode ||
    '';

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`
        @page { 
          size: A4 landscape; 
          margin: 0; 
        }
        @media print {
          html, body { 
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .no-break { 
            page-break-inside: avoid; 
            break-inside: avoid; 
          }
          .print-container {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
          }
          .print-inner {
            width: 286mm !important;
            height: 200mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
        @media screen {
          .print-container {
            max-width: 100%;
            width: 100%;
            min-height: 100vh;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          @media (min-width: 640px) {
            .print-container {
              padding: 1rem;
            }
          }
          .print-inner {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            overflow-x: auto;
          }
          @media (min-width: 768px) {
            .print-inner {
              max-width: 1200px;
            }
          }
        }
      `}</style>
      {/* Surface A4 paysage en mm pour garantir 1 seule page */}
      <div className="no-break print-container">
        {/* Légère réduction interne pour éviter toute coupe */}
        <div className="print-inner">
          <CertificatePreview
            fullName={fullName}
            courseTitle={courseTitle}
            location="Cotonou, Bénin"
            issuedAt={new Date(issuedAt)}
            code={code}
          />
        </div>
      </div>
    </div>
  );
}

