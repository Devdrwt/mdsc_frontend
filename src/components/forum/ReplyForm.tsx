"use client";

import { useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { forumService } from "../../lib/services/forumService";
import toast from "../../lib/utils/toast";

interface ReplyFormProps {
  topicId: number;
  parentReplyId?: number;
  parentAuthorName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReplyForm({
  topicId,
  parentReplyId,
  parentAuthorName,
  onSuccess,
  onCancel,
}: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Erreur", "Le contenu est requis");
      return;
    }

    setLoading(true);
    try {
      await forumService.createReply(topicId, {
        content: content.trim(),
        parent_reply_id: parentReplyId,
      });
      toast.success("Succès", "Réponse publiée avec succès");
      setContent("");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erreur", error.message || "Impossible de publier la réponse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {parentAuthorName && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <span>Réponse à</span>
          <span className="font-semibold text-blue-600">{parentAuthorName}</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder={
            parentReplyId
              ? "Votre réponse..."
              : "Partagez votre réponse ou votre question..."
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="flex items-center justify-end space-x-3">
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
          disabled={loading || !content.trim()}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Publication...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Publier</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

