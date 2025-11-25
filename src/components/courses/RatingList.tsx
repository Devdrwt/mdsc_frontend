"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ratingService } from "../../lib/services/ratingService";
import type { CourseRating } from "../../types/rating";
import RatingDisplay from "./RatingDisplay";
import toast from "../../lib/utils/toast";

interface RatingListProps {
  courseId: number;
  sort?: "recent" | "helpful" | "rating";
}

export default function RatingList({
  courseId,
  sort = "recent",
}: RatingListProps) {
  const [ratings, setRatings] = useState<CourseRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    loadRatings();
  }, [courseId, page, sort]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const result = await ratingService.getCourseRatings(courseId, {
        page,
        limit: 10,
        sort,
      });
      setRatings(result.data);
      setPagination(result.pagination);
    } catch (error: any) {
      toast.error("Erreur", "Impossible de charger les avis");
    } finally {
      setLoading(false);
    }
  };

  if (loading && ratings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des avis */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <RatingDisplay key={rating.id} rating={rating} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Précédent</span>
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.pages}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Suivant</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

