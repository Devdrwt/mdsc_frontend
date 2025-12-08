"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "../../../../lib/middleware/auth";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { forumService } from "../../../../lib/services/forumService";
import { CourseService } from "../../../../lib/services/courseService";
import type { CourseForum } from "../../../../types/forum";
import ForumHeader from "../../../../components/forum/ForumHeader";
import TopicList from "../../../../components/forum/TopicList";
import TopicForm from "../../../../components/forum/TopicForm";
import { Loader2 } from "lucide-react";
import toast from "../../../../lib/utils/toast";

export default function CourseForumPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [forum, setForum] = useState<CourseForum | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (slug) {
      loadForum();
    }
  }, [slug]);

  const loadForum = async () => {
    try {
      setLoading(true);
      
      // Charger le cours par slug pour obtenir son ID numérique
      const isNumeric = !isNaN(Number(slug));
      const courseData = isNumeric 
        ? await CourseService.getCourseById(slug)
        : await CourseService.getCourseBySlug(slug);
      
      // Extraire l'ID numérique du cours
      const courseId = typeof courseData.id === 'string' 
        ? parseInt(courseData.id, 10) 
        : courseData.id;
      
      if (!courseId || isNaN(courseId)) {
        throw new Error("Impossible de déterminer l'ID du cours");
      }
      
      // Charger le forum avec l'ID numérique
      const data = await forumService.getCourseForum(courseId);
      setForum(data);
    } catch (error: any) {
      console.error("Erreur lors du chargement du forum:", error);
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
            courseId={params.slug as string}
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
            <TopicList forumId={forum.id} searchQuery={searchQuery} courseSlug={slug} />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

