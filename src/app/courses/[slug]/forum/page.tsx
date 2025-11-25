"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "../../../../lib/middleware/auth";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { forumService } from "../../../../lib/services/forumService";
import type { CourseForum } from "../../../../types/forum";
import ForumHeader from "../../../../components/forum/ForumHeader";
import TopicList from "../../../../components/forum/TopicList";
import TopicForm from "../../../../components/forum/TopicForm";
import { Loader2 } from "lucide-react";
import toast from "../../../../lib/utils/toast";

export default function CourseForumPage() {
  const params = useParams();
  const courseId = parseInt(params.slug as string, 10);
  const [forum, setForum] = useState<CourseForum | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadForum();
  }, [courseId]);

  const loadForum = async () => {
    try {
      setLoading(true);
      const data = await forumService.getCourseForum(courseId);
      setForum(data);
    } catch (error: any) {
      toast.error("Erreur", "Impossible de charger le forum");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicCreated = () => {
    setShowTopicForm(false);
    loadForum();
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="student">
        <DashboardLayout userRole="student">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!forum) {
    return (
      <AuthGuard requiredRole="student">
        <DashboardLayout userRole="student">
          <div className="text-center py-12">
            <p className="text-gray-600">Forum non disponible</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          <ForumHeader
            forum={forum}
            onNewTopic={() => setShowTopicForm(true)}
            onSearch={setSearchQuery}
          />

          {showTopicForm ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Créer un nouveau commentaire
              </h2>
              <TopicForm
                forumId={forum.id}
                onSuccess={handleTopicCreated}
                onCancel={() => setShowTopicForm(false)}
              />
            </div>
          ) : (
            <TopicList forumId={forum.id} searchQuery={searchQuery} />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

