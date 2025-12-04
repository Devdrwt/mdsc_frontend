"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, Layers3, Sparkles, ArrowLeft } from "lucide-react";
import type { CourseForum } from "../../types/forum";

interface ForumHeaderProps {
  forum: CourseForum;
  onNewTopic: () => void;
  onSearch?: (search: string) => void;
  courseId?: string | number; // ID ou slug du cours pour le bouton retour
}

export default function ForumHeader({
  forum,
  onNewTopic,
  onSearch,
  courseId,
}: ForumHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const forumTitle = forum?.title?.trim() || "Forum";
  const forumDescription =
    forum?.description?.trim() ||
    "Partagez vos questions, vos retours d'expérience et vos bonnes pratiques avec les autres apprenants.";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleBackToCourse = () => {
    if (courseId) {
      router.push(`/courses/${courseId}`);
    } else if (forum?.course_id) {
      router.push(`/courses/${forum.course_id}`);
    } else {
      router.back();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-mdsc-blue-primary/20 bg-gradient-to-r from-white via-mdsc-blue-primary/5 to-mdsc-gold/10 p-6 shadow-sm mb-6">
      {/* Bouton retour */}
      {(courseId || forum?.course_id) && (
        <button
          onClick={handleBackToCourse}
          className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour au cours</span>
        </button>
      )}
      
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-mdsc-blue-primary shadow-sm border border-mdsc-blue-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Espace communauté</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-mdsc-blue-primary">
              <Users className="h-6 w-6" />
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {forumTitle}
              </h1>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              {forumDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white shadow-sm border border-mdsc-blue-primary/15 p-3">
              <p className="text-2xl font-bold text-mdsc-blue-primary">
                {forum.topic_count || 0}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Commentaires
              </p>
            </div>
            <div className="rounded-xl bg-white shadow-sm border border-mdsc-blue-primary/15 p-3">
              <p className="text-2xl font-bold text-mdsc-gold-dark">
                {forum.reply_count || 0}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Réponses
              </p>
            </div>
            <div className="rounded-xl bg-white shadow-sm border border-mdsc-blue-primary/15 p-3 flex items-center space-x-2">
              <Layers3 className="h-5 w-5 text-mdsc-blue-primary" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {Math.max((forum.topic_count || 0) - (forum.reply_count || 0), 0)}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  Sujets actifs
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onNewTopic}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-mdsc-blue-primary to-mdsc-blue-dark px-6 py-3 text-white font-semibold shadow-lg shadow-mdsc-blue-dark/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau commentaire
        </button>
      </div>

      {/* Recherche */}
      {onSearch && (
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans le forum..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Rechercher
          </button>
        </form>
      )}
    </div>
  );
}

