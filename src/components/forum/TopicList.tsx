"use client";

import { useState, useEffect } from "react";
import { Loader2, Filter } from "lucide-react";
import { forumService } from "../../lib/services/forumService";
import type { ForumTopic } from "../../types/forum";
import TopicCard from "./TopicCard";
import toast from "../../lib/utils/toast";

interface TopicListProps {
  forumId: number;
  searchQuery?: string;
  courseSlug?: string;
}

export default function TopicList({ forumId, searchQuery, courseSlug }: TopicListProps) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "popular" | "pinned">("recent");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    loadTopics();
  }, [forumId, page, sort, searchQuery]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const result = await forumService.getForumTopics(forumId, {
        page,
        limit: 20,
        sort,
        search: searchQuery,
      });
      // S'assurer que result.data est toujours un tableau
      setTopics(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
      });
    } catch (error: any) {
      console.error("Erreur lors du chargement des commentaires:", error);
      toast.error("Erreur", "Impossible de charger les commentaires");
      setTopics([]); // S'assurer que topics est toujours un tableau
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!topics || topics.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <p className="text-gray-600 text-lg">
          {searchQuery ? "Aucun commentaire ne correspond à votre recherche." : "Aucun commentaire pour le moment."}
        </p>
        <p className="text-sm text-gray-400 mt-2">Soyez le premier à lancer la discussion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="flex flex-col gap-4 rounded-2xl border border-mdsc-blue-primary/20 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-mdsc-blue-primary">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-semibold">Trier les discussions</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Récent", value: "recent" },
            { label: "Populaire", value: "popular" },
            { label: "Épinglés", value: "pinned" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                sort === option.value
                  ? "bg-mdsc-blue-primary text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des commentaires */}
      <div className="grid gap-4">
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} courseSlug={courseSlug} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

