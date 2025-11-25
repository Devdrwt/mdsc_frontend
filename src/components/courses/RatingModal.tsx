"use client";

import { X, Star, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import RatingForm from "./RatingForm";
import { ratingService } from "../../lib/services/ratingService";
import toast from "../../lib/utils/toast";

interface RatingModalProps {
  courseId: number;
  enrollmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RatingModal({
  courseId,
  enrollmentId,
  isOpen,
  onClose,
  onSuccess,
}: RatingModalProps) {
  const [canRate, setCanRate] = useState<{
    can_rate: boolean;
    reason?: string;
    has_rated?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkCanRate();
    }
  }, [isOpen, enrollmentId]);

  const checkCanRate = async () => {
    try {
      setLoading(true);
      const result = await ratingService.canRate(enrollmentId);
      setCanRate(result);
    } catch (error: any) {
      toast.error("Erreur", "Impossible de vérifier les permissions");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <h2 className="text-xl font-semibold text-gray-900">
              Noter ce cours
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : canRate?.can_rate ? (
            <div>
              <p className="text-gray-600 mb-6">
                Félicitations ! Vous avez complété ce cours. Partagez votre
                expérience pour aider d'autres étudiants.
              </p>
              <RatingForm
                courseId={courseId}
                enrollmentId={enrollmentId}
                onSuccess={() => {
                  onSuccess?.();
                  onClose();
                }}
                onCancel={onClose}
              />
            </div>
          ) : canRate?.has_rated ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vous avez déjà noté ce cours
              </h3>
              <p className="text-gray-600 mb-6">
                Merci d'avoir partagé votre avis !
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complétez le cours d'abord
              </h3>
              <p className="text-gray-600 mb-6">
                Vous pourrez noter ce cours une fois que vous l'aurez complété
                à 100%.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

