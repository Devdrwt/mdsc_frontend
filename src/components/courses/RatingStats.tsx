"use client";

import { Star, TrendingUp } from "lucide-react";
import type { CourseRatingStats } from "../../types/rating";

interface RatingStatsProps {
  stats: CourseRatingStats;
}

export default function RatingStats({ stats }: RatingStatsProps) {
  const averageRating = parseFloat(stats.average_rating);
  const ratingCount = stats.rating_count;
  const recommendationRate = parseFloat(stats.recommendation_rate);

  // Calculer le pourcentage pour chaque note
  const getPercentage = (count: number) => {
    if (ratingCount === 0) return 0;
    return (count / ratingCount) * 100;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Avis des étudiants
      </h3>

      {/* Note moyenne */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex items-center">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Basé sur {ratingCount} avis
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-green-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {recommendationRate}%
            </span>
          </div>
          <p className="text-xs text-gray-500">Recommandent</p>
        </div>
      </div>

      {/* Distribution des notes */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.rating_distribution[star.toString() as "1" | "2" | "3" | "4" | "5"] || 0;
          const percentage = getPercentage(count);

          return (
            <div key={star} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-20">
                <span className="text-sm font-medium text-gray-700">
                  {star}
                </span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

