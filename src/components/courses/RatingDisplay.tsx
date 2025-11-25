"use client";

import { Star, CheckCircle } from "lucide-react";
import type { CourseRating } from "../../types/rating";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RatingDisplayProps {
  rating: CourseRating;
}

export default function RatingDisplay({ rating }: RatingDisplayProps) {
  const displayName = rating.is_anonymous
    ? "Anonyme"
    : `${rating.first_name || ""} ${rating.last_name || ""}`.trim() ||
      rating.email ||
      "Utilisateur";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            {rating.is_anonymous ? (
              <span className="text-blue-600 font-semibold">A</span>
            ) : (
              <span className="text-blue-600 font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(rating.created_at), "d MMMM yyyy", {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= rating.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Recommandation */}
      {rating.would_recommend && (
        <div className="flex items-center space-x-2 mb-3 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Recommande ce cours</span>
        </div>
      )}

      {/* Commentaire */}
      {rating.comment && (
        <p className="text-gray-700 mb-3 whitespace-pre-wrap">
          {rating.comment}
        </p>
      )}

      {/* Points positifs */}
      {rating.pros && (
        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-semibold text-green-800 mb-1">
            Points positifs
          </p>
          <p className="text-sm text-green-700 whitespace-pre-wrap">
            {rating.pros}
          </p>
        </div>
      )}

      {/* Points à améliorer */}
      {rating.cons && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-semibold text-orange-800 mb-1">
            Points à améliorer
          </p>
          <p className="text-sm text-orange-700 whitespace-pre-wrap">
            {rating.cons}
          </p>
        </div>
      )}
    </div>
  );
}

