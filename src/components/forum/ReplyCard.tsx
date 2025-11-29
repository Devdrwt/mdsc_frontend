"use client";

import { ThumbsUp, ThumbsDown, Reply, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ForumReply } from "../../types/forum";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { forumService } from "../../lib/services/forumService";
import toast from "../../lib/utils/toast";

interface ReplyCardProps {
  reply: ForumReply;
  topicAuthorId?: number;
  currentUserId?: number;
  onReply?: (replyId: number, authorName?: string) => void;
  onSolutionMarked?: () => void;
}

export default function ReplyCard({
  reply,
  topicAuthorId,
  currentUserId,
  onReply,
  onSolutionMarked,
}: ReplyCardProps) {
  const [upvoting, setUpvoting] = useState(false);
  const [markingSolution, setMarkingSolution] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(reply.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(reply.downvotes);
  const [hasUpvoted, setHasUpvoted] = useState(reply.has_upvoted || false);
  const [hasDownvoted, setHasDownvoted] = useState(reply.has_downvoted || false);

  const authorName = `${reply.first_name || ""} ${reply.last_name || ""}`.trim() || "Utilisateur";
  const isTopicAuthor = currentUserId === topicAuthorId;
  const canMarkSolution = isTopicAuthor && !reply.is_solution;

  const handleVote = async (type: "upvote" | "downvote") => {
    if (upvoting) return;

    setUpvoting(true);
    try {
      // Si l'utilisateur a déjà voté dans l'autre sens, on inverse
      if (type === "upvote" && hasDownvoted) {
        setHasDownvoted(false);
        setLocalDownvotes(localDownvotes - 1);
      } else if (type === "downvote" && hasUpvoted) {
        setHasUpvoted(false);
        setLocalUpvotes(localUpvotes - 1);
      }

      // Toggle le vote actuel
      if (type === "upvote") {
        if (hasUpvoted) {
          setHasUpvoted(false);
          setLocalUpvotes(localUpvotes - 1);
        } else {
          setHasUpvoted(true);
          setLocalUpvotes(localUpvotes + 1);
        }
      } else {
        if (hasDownvoted) {
          setHasDownvoted(false);
          setLocalDownvotes(localDownvotes - 1);
        } else {
          setHasDownvoted(true);
          setLocalDownvotes(localDownvotes + 1);
        }
      }

      await forumService.addReaction(reply.id, type);
    } catch (error: any) {
      toast.error("Erreur", "Impossible d'ajouter la réaction");
      // Revert local state on error
      setLocalUpvotes(reply.upvotes);
      setLocalDownvotes(reply.downvotes);
      setHasUpvoted(reply.has_upvoted || false);
      setHasDownvoted(reply.has_downvoted || false);
    } finally {
      setUpvoting(false);
    }
  };

  const handleMarkSolution = async () => {
    if (markingSolution) return;

    setMarkingSolution(true);
    try {
      await forumService.markAsSolution(reply.id);
      toast.success("Succès", "Réponse marquée comme solution");
      onSolutionMarked?.();
    } catch (error: any) {
      toast.error("Erreur", "Impossible de marquer comme solution");
    } finally {
      setMarkingSolution(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border p-6 ${
        reply.is_solution
          ? "border-green-500 bg-green-50"
          : "border-gray-200"
      }`}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{authorName}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(reply.created_at), "d MMM yyyy 'à' HH:mm", {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        {reply.is_solution && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Solution</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="mb-4">
        <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
      </div>

      {/* Réponses imbriquées */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-4 border-l-2 border-gray-200 pl-4">
          {reply.replies.map((nestedReply) => (
            <ReplyCard
              key={nestedReply.id}
              reply={nestedReply}
              topicAuthorId={topicAuthorId}
              currentUserId={currentUserId}
              onReply={onReply}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleVote("upvote")}
            disabled={upvoting}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
              hasUpvoted
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:opacity-50`}
          >
            {upvoting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            <span>{localUpvotes}</span>
          </button>
          <button
            onClick={() => handleVote("downvote")}
            disabled={upvoting}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
              hasDownvoted
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:opacity-50`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{localDownvotes}</span>
          </button>
          {onReply && (
            <button
              onClick={() => onReply(reply.id, authorName)}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Reply className="h-4 w-4" />
              <span>Répondre</span>
            </button>
          )}
        </div>

        {canMarkSolution && (
          <button
            onClick={handleMarkSolution}
            disabled={markingSolution}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {markingSolution ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span>Marquer comme solution</span>
          </button>
        )}
      </div>
    </div>
  );
}

