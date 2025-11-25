"use client";

import Link from "next/link";
import { MessageSquare, Eye, Pin, Lock, Users, UserCheck } from "lucide-react";
import type { ForumTopic } from "../../types/forum";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface TopicCardProps {
  topic: ForumTopic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  const topicLink = `/courses/${topic.forum_id}/forum/${topic.id}`;

  const authorName = [topic.first_name, topic.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim() || "Utilisateur";

  const createdDate = new Date(topic.created_at);
  const createdLabel = format(createdDate, "d MMM yyyy", { locale: fr });
  const relativeTime = formatDistanceToNow(createdDate, { locale: fr, addSuffix: true });

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-mdsc-blue-primary/10 bg-white/95 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-mdsc-blue-primary/40 hover:shadow-lg">
      {(topic.is_pinned || topic.is_locked) && (
        <div className="absolute top-5 right-5 flex gap-2">
          {topic.is_pinned && (
            <span className="inline-flex items-center space-x-1 rounded-full bg-mdsc-gold/15 px-2 py-0.5 text-xs font-semibold text-mdsc-gold-dark border border-mdsc-gold/30">
              <Pin className="h-3 w-3" />
              <span>Épinglé</span>
            </span>
          )}
          {topic.is_locked && (
            <span className="inline-flex items-center space-x-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-200">
              <Lock className="h-3 w-3" />
              <span>Fermé</span>
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Link
          href={topicLink}
          className="block text-xl font-semibold text-gray-900 tracking-tight hover:text-mdsc-blue-primary transition-colors"
        >
          {topic.title}
        </Link>
        <p className="text-sm text-gray-600 line-clamp-3">{topic.content}</p>
      </div>

      <div className="mt-4 grid gap-4 text-sm text-gray-500 sm:grid-cols-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mdsc-blue-primary/15 text-mdsc-blue-primary text-sm font-semibold">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-900 font-medium">{authorName}</p>
              <p className="text-xs text-gray-500">{relativeTime}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3">
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

