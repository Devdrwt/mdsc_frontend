"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../../../../lib/middleware/auth";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { courseService } from "../../../../lib/services/courseService";
import { forumService } from "../../../../lib/services/forumService";
import { Loader2, MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import type { CourseForum } from "../../../../types/forum";

interface CourseWithForum {
  id: number | string;
  title: string;
  slug?: string;
  forum?: CourseForum;
}

export default function StudentForumPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithForum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForums();
  }, []);

  const loadForums = async () => {
    try {
      setLoading(true);
      const userCourses = await courseService.getMyCourses();
      
      // Charger les forums pour chaque cours
      const coursesWithForums = await Promise.all(
        (userCourses || []).map(async (course: any) => {
          try {
            const courseId = typeof course.id === 'string' ? parseInt(course.id, 10) : course.id;
            if (Number.isNaN(courseId)) return null;
            
            const forum = await forumService.getCourseForum(courseId);
            return {
              id: course.id,
              title: course.title || 'Sans titre',
              slug: course.slug || course.id,
              forum,
            };
          } catch (error) {
            // Si le forum n'existe pas ou n'est pas accessible, on l'ignore
            return null;
          }
        })
      );

      setCourses(coursesWithForums.filter(Boolean) as CourseWithForum[]);
    } catch (error) {
      console.error("Erreur lors du chargement des forums:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleForumClick = (course: CourseWithForum) => {
    const courseId = course.slug || course.id;
    router.push(`/courses/${courseId}/forum`);
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

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="h-8 w-8 mr-3 text-mdsc-blue-primary" />
                Forums des Cours
              </h1>
              <p className="text-gray-600 mt-2">
                Accédez aux forums de discussion de vos cours
              </p>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun forum disponible
              </h3>
              <p className="text-gray-600">
                Vous n'avez pas encore accès à des forums de cours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleForumClick(course)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-5 w-5 text-mdsc-blue-primary" />
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-mdsc-blue-primary transition-colors">
                          {course.title}
                        </h3>
                      </div>
                      {course.forum && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{course.forum.topic_count || 0} commentaires</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{course.forum.reply_count || 0} réponses</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-mdsc-blue-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

