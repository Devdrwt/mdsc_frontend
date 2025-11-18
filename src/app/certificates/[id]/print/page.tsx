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
          setError('Certificat introuvable');
        } else {
          setCertificate(cert as any);
          setError(null);
        }
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement du certificat');
      } finally {
        setLoading(false);
      }
    };
    if (certId) load();
  }, [certId]);

  const fullName = useMemo(() => {
    if (!certificate) return 'Étudiant(e)';
    const first = (certificate as any).first_name || (certificate as any).firstName || '';
    const last = (certificate as any).last_name || (certificate as any).lastName || '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Étudiant(e)';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chargement du certificat…</div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Certificat introuvable'}</div>
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
    <div className="min-h-screen bg-white print:bg-white">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        html, body {
          width: 297mm;
          height: 210mm;
          margin: 0;
          padding: 0;
        }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-break { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
      {/* Surface A4 paysage en mm pour garantir 1 seule page */}
      <div
        className="no-break"
        style={{
          width: '297mm',
          height: '210mm',
          margin: '0 auto',
          padding: '0',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {/* Légère réduction interne pour éviter toute coupe */}
        <div
          style={{
            width: '286mm',
            height: '200mm',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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

