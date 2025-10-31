'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { badgeService } from '../../../lib/services/badgeService';
import { certificateService } from '../../../lib/services/certificateService';
import { UserBadge } from '../../../types/course';
import BadgeCard from '../../gamification/BadgeCard';

interface BadgesCertificatesPreviewProps {
  limit?: number;
  className?: string;
}

export default function BadgesCertificatesPreview({
  limit = 4,
  className = '',
}: BadgesCertificatesPreviewProps) {
  const router = useRouter();
  const [recentBadges, setRecentBadges] = useState<UserBadge[]>([]);
  const [certificateCount, setCertificateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [badges, certificates] = await Promise.all([
        badgeService.getUserBadges(),
        certificateService.getUserCertificates(),
      ]);

      // Trier par date d'obtention et prendre les plus récents
      const badgesArray = Array.isArray(badges) ? badges : [];
      const sortedBadges = badgesArray
        .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
        .slice(0, limit);

      setRecentBadges(sortedBadges);
      const certificatesArray = Array.isArray(certificates) ? certificates : [];
      setCertificateCount(certificatesArray.length);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setRecentBadges([]);
      setCertificateCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Badges Récents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-mdsc-gold" />
            <h3 className="text-lg font-semibold text-gray-900">Badges Récents</h3>
          </div>
          <button
            onClick={() => router.push('/dashboard/student/gamification')}
            className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark flex items-center space-x-1 transition-colors"
          >
            <span>Voir tout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentBadges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentBadges.map((userBadge) => (
              <BadgeCard
                key={userBadge.id}
                badge={userBadge}
                earned={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Aucun badge obtenu</p>
            <p className="text-sm text-gray-400">
              Complétez des cours pour gagner vos premiers badges !
            </p>
          </div>
        )}
      </div>

      {/* Certificats Quick View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-mdsc-blue-primary" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mes Certificats</h3>
              <p className="text-sm text-gray-500">{certificateCount} certificat{certificateCount > 1 ? 's' : ''} obtenu{certificateCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/student/certificates')}
            className="text-sm text-mdsc-blue-primary hover:text-mdsc-blue-dark flex items-center space-x-1 transition-colors"
          >
            <span>Voir tout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
