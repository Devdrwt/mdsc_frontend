'use client';

import React, { useState, useEffect } from 'react';
import { Award, Search, Calendar, CheckCircle } from 'lucide-react';
import { Certificate } from '../../types/course';
import { certificateService } from '../../lib/services/certificateService';
import CertificateCard from './CertificateCard';

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
      setCertificates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
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
  });

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
      <div className="bg-gradient-to-br from-mdsc-blue-primary to-mdsc-blue-dark text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2 mb-2">
              <Award className="h-6 w-6" />
              <span>Mes Certificats</span>
            </h2>
            <p className="text-white/80">
              {certificates.length} certificat{certificates.length > 1 ? 's' : ''} obtenu{certificates.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-mdsc-blue-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('valid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'valid'
                ? 'bg-mdsc-blue-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="h-4 w-4 inline mr-1" />
            Valides
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'expired'
                ? 'bg-mdsc-blue-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-1" />
            Expirés
          </button>
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
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {searchTerm || filter !== 'all'
              ? 'Aucun certificat ne correspond à votre recherche'
              : 'Vous n\'avez pas encore de certificats'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <p className="text-sm text-gray-500">
              Complétez des cours pour obtenir vos premiers certificats
            </p>
          )}
        </div>
      )}
    </div>
  );
}
