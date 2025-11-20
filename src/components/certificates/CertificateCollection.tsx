'use client';

import React, { useState, useEffect } from 'react';
import { Award, Search } from 'lucide-react';
import { Certificate } from '../../types/course';
import { certificateService } from '../../lib/services/certificateService';
import CertificateCard from './CertificateCard';
import Link from 'next/link';

interface CertificateCollectionProps {
  userId?: string;
  className?: string;
}

export default function CertificateCollection({
  userId,
  className = '',
}: CertificateCollectionProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired'>('all');

  useEffect(() => {
    loadCertificates();
  }, [userId]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await certificateService.getUserCertificates();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = Array.isArray(certificates) ? certificates.filter((cert) => {
    const matchesSearch = searchTerm === '' || 
      cert.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    let matchesFilter = true;
    
    if (filter === 'valid') {
      matchesFilter = !cert.expiresAt || new Date(cert.expiresAt) > now;
    } else if (filter === 'expired') {
      matchesFilter = cert.expiresAt && new Date(cert.expiresAt) <= now;
    }
    
    return matchesSearch && matchesFilter;
  }) : [];

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des certificats...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="bg-mdsc-blue-primary text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2 mb-2">
              {/* Icône plus professionnelle pour la section certificats */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17l-3-2-3 2 .75-3.5L7 11l3.5-.25L12 7l1.5 3.75L17 11l-2.25 2.5L15 17z" />
                <circle cx="11" cy="12" r="10" strokeWidth="1.5" />
              </svg>
              <span>Mes Certificats</span>
            </h2>
            <p className="text-white/80">
              {certificates.length} certificat{certificates.length > 1 ? 's' : ''} obtenu{certificates.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un certificat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Certificates Grid */}
      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
            />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-mdsc-blue-primary/10 to-mdsc-blue-dark/10" />
            <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-mdsc-blue-primary/10 to-mdsc-blue-dark/10" />
          </div>
          <div className="relative px-6 py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-mdsc-blue-primary/10">
              <Award className="h-8 w-8 text-mdsc-blue-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filter !== 'all'
                ? 'Aucun certificat ne correspond à votre recherche'
                : 'Aucun certificat disponible pour le moment'}
            </h3>
            <p className="text-gray-600 max-w-xl mx-auto">
              Réussissez une évaluation finale pour générer automatiquement votre certificat,
              qui apparaîtra ici et pourra être téléchargé au format PDF.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/student/evaluations"
                className="inline-flex items-center justify-center rounded-lg bg-mdsc-blue-primary px-4 py-2.5 text-white text-sm font-medium shadow-sm hover:opacity-90 transition"
              >
                Voir mes évaluations
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-800 text-sm font-medium hover:bg-gray-200 transition"
              >
                Découvrir les formations
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
