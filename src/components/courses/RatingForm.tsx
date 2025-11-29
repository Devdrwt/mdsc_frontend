"use client";

import React, { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { ratingService } from "../../lib/services/ratingService";
import toast from "../../lib/utils/toast";

interface RatingFormProps {
  courseId: number;
  enrollmentId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RatingForm({
  courseId,
  enrollmentId,
  onSuccess,
  onCancel,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Erreur", "Veuillez sélectionner une note");
      return;
    }

    setLoading(true);
    try {
      await ratingService.createRating(courseId, {
        enrollment_id: enrollmentId,
        rating,
        comment: comment || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
        would_recommend: wouldRecommend,
        is_anonymous: isAnonymous,
      });

      toast.success("Succès", "Votre notation a été enregistrée");
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        "Erreur",
        error.message || "Impossible d'enregistrer la notation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Note en étoiles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note globale <span className="text-gray-500 text-xs">(requise si vous souhaitez noter le cours)</span>
        </label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`h-10 w-10 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-lg font-semibold text-gray-700">
              {rating} / 5
            </span>
          )}
        </div>
      </div>

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Partagez votre expérience avec ce cours..."
        />
      </div>

      {/* Points positifs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Points positifs (optionnel)
        </label>
        <textarea
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ce que vous avez aimé..."
        />
      </div>

      {/* Points à améliorer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Points à améliorer (optionnel)
        </label>
        <textarea
          value={cons}
          onChange={(e) => setCons(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ce qui pourrait être amélioré..."
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Je recommande ce cours
          </span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Publier de manière anonyme
          </span>
        </label>
      </div>

      {/* Boutons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Enregistrer la notation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

