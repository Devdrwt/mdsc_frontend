"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Eye, Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { forumService } from "../../lib/services/forumService";
import type { ForumTopic, ForumReply } from "../../types/forum";
import ReplyCard from "./ReplyCard";
import ReplyForm from "./ReplyForm";
import toast from "../../lib/utils/toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuthStore } from "../../lib/stores/authStore";

interface TopicDetailProps {
  topicId: number;
}

export default function TopicDetail({ topicId }: TopicDetailProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    replyId: number;
    authorName: string;
  } | null>(null);

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    try {
      setLoading(true);
      const [topicData, repliesResult] = await Promise.all([
        forumService.getTopicById(topicId).catch(() => null),
        forumService.getTopicReplies(topicId),
      ]);

      if (topicData) {
        setTopic(topicData);
      } else {
        setTopic(null);
      }
      setReplies(repliesResult.data);
    } catch (error: any) {
      console.error("Erreur lors du chargement du commentaire:", error);
      toast.error("Erreur", "Impossible de charger le commentaire");
      setTopic(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    setReplyingTo(null);
    loadTopic();
  };

  const handleReplyToReply = (replyId: number, authorName: string) => {
    setReplyingTo({ replyId, authorName });
    setShowReplyForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!topic && replies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Commentaire non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Retour au forum</span>
      </button>

      {/* Commentaire (si disponible) */}
      {topic && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {topic.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{topic.view_count} vues</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{topic.reply_count} réponses</span>
            </div>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setReplyingTo(null);
                setShowReplyForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Users className="h-4 w-4 mr-2" />
              Répondre
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de réponse */}
      {showReplyForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {replyingTo ? "Répondre à la réponse" : "Ajouter une réponse"}
          </h3>
          <ReplyForm
            topicId={topicId}
            parentReplyId={replyingTo?.replyId}
            parentAuthorName={replyingTo?.authorName}
            onSuccess={handleReplySuccess}
            onCancel={() => {
              setShowReplyForm(false);
              setReplyingTo(null);
            }}
          />
        </div>
      )}

      {/* Liste des réponses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Réponses ({replies.length})
          </h2>
          {!showReplyForm && (
            <button
              onClick={() => setShowReplyForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter une réponse
            </button>
          )}
        </div>

        {replies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucune réponse pour le moment</p>
          </div>
        ) : (
          replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              topicAuthorId={topic?.user_id}
              currentUserId={user?.id}
              onReply={handleReplyToReply}
              onSolutionMarked={loadTopic}
            />
          ))
        )}
      </div>
    </div>
  );
}

