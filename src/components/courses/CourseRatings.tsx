"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { ratingService } from "../../lib/services/ratingService";
import type { CourseRatingStats } from "../../types/rating";
import RatingStats from "./RatingStats";
import RatingList from "./RatingList";
import RatingModal from "./RatingModal";
import toast from "../../lib/utils/toast";

interface CourseRatingsProps {
  courseId: number;
  enrollmentId?: number;
  showRatingButton?: boolean;
}

export default function CourseRatings({
  courseId,
  enrollmentId,
  showRatingButton = false,
}: CourseRatingsProps) {
  const [stats, setStats] = useState<CourseRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, [courseId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ratingService.getRatingStats(courseId);
      setStats(data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de notation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          <h2 className="text-2xl font-bold text-gray-900">Avis des étudiants</h2>
        </div>
        {showRatingButton && enrollmentId && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Noter ce cours</span>
          </button>
        )}
      </div>

      {/* Statistiques */}
      {stats.rating_count > 0 ? (
        <>
          <RatingStats stats={stats} />
          <RatingList courseId={courseId} />
        </>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aucun avis pour le moment</p>
          {showRatingButton && enrollmentId && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Soyez le premier à noter
            </button>
          )}
        </div>
      )}

      {/* Modal de notation */}
      {enrollmentId && (
        <RatingModal
          courseId={courseId}
          enrollmentId={enrollmentId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={loadStats}
        />
      )}
    </div>
  );
}

