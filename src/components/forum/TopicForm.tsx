"use client";

import React, { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { forumService } from "../../lib/services/forumService";
import toast from "../../lib/utils/toast";

interface TopicFormProps {
  forumId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TopicForm({
  forumId,
  onSuccess,
  onCancel,
}: TopicFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Erreur", "Le titre et le contenu sont requis");
      return;
    }

    setLoading(true);
    try {
      await forumService.createTopic(forumId, {
        title: title.trim(),
        content: content.trim(),
      });
      toast.success("Succès", "Commentaire créé avec succès");
      setTitle("");
      setContent("");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erreur", error.message || "Impossible de créer le commentaire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de votre commentaire..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contenu <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Décrivez votre question ou votre sujet de discussion..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

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
          disabled={loading || !title.trim() || !content.trim()}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Créer le commentaire</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

