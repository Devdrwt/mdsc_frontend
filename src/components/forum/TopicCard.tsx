"use client";

import Link from "next/link";
import { MessageSquare, Eye, Users, UserCheck } from "lucide-react";
import type { ForumTopic } from "../../types/forum";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface TopicCardProps {
  topic: ForumTopic;
  courseSlug?: string;
}

export default function TopicCard({ topic, courseSlug }: TopicCardProps) {
  // Utiliser le slug du cours si fourni, sinon fallback sur forum_id (pour compatibilité)
  const courseIdentifier = courseSlug || topic.forum_id;
  const topicLink = `/courses/${courseIdentifier}/forum/${topic.id}`;

  const authorName = [topic.first_name, topic.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim() || "Utilisateur";

  const createdDate = new Date(topic.created_at);
  const createdLabel = format(createdDate, "d MMM yyyy", { locale: fr });
  const relativeTime = formatDistanceToNow(createdDate, { locale: fr, addSuffix: true });

  return (
    <article className="group relative overflow-visible rounded-2xl border border-mdsc-blue-primary/10 bg-white/95 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-mdsc-blue-primary/40 hover:shadow-lg">
      <div className="space-y-3">
        {/* Auteur avant le titre */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mdsc-blue-primary/15 text-mdsc-blue-primary text-sm font-semibold">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{authorName}</p>
            <p className="text-xs text-gray-500">{relativeTime}</p>
          </div>
        </div>
        
        {/* Titre */}
        <Link
          href={topicLink}
          className="block text-xl font-semibold text-gray-900 tracking-tight hover:text-mdsc-blue-primary transition-colors"
        >
          {String(topic?.title || 'Sans titre').trim()}
        </Link>
        
        {/* Contenu */}
        <p className="text-sm text-gray-600 line-clamp-3">{topic?.content || ''}</p>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-3 text-sm text-gray-500">
        <Link
          href={topicLink}
          className="inline-flex items-center space-x-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-mdsc-blue-primary/30 hover:text-mdsc-blue-primary"
        >
          <Eye className="h-4 w-4" />
          <span>{topic.view_count} vues</span>
        </Link>
        <Link
          href={topicLink}
          className="inline-flex items-center space-x-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-mdsc-blue-primary/30 hover:text-mdsc-blue-primary"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{topic.reply_count} réponses</span>
        </Link>
      </div>

      {topic.last_reply_at && (
        <div className="mt-4 rounded-xl border border-mdsc-blue-primary/10 bg-mdsc-blue-primary/5 px-4 py-3 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-3.5 w-3.5 text-mdsc-blue-primary" />
            <span>
              Dernière réponse par{" "}
              <span className="font-semibold text-gray-900">
                {topic.last_reply_first_name && topic.last_reply_last_name
                  ? `${topic.last_reply_first_name} ${topic.last_reply_last_name}`
                  : "un utilisateur"}
              </span>{" "}
              le {format(new Date(topic.last_reply_at), "d MMM yyyy", { locale: fr })}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

