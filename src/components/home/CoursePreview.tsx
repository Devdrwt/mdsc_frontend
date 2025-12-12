'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { Users, BookOpen, ArrowRight } from 'lucide-react';
import { resolveMediaUrl, DEFAULT_COURSE_IMAGE } from '../../lib/utils/media';
import { useTranslations } from 'next-intl';

interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  thumbnail: string;
  category: string;
  price: number;
  total_lessons?: number;
}

interface CoursePreviewProps {
  courses: Course[];
}

export default function CoursePreview({ courses }: CoursePreviewProps) {
  const router = useRouter();
  const t = useTranslations('home.courses');

  return (
    <section className="section-mdsc bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Formations populaires
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card-mdsc hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full"
            >
              {/* Thumbnail */}
              <div className="relative mb-4 overflow-hidden rounded-lg">
                {(() => {
                  const courseAny = course as any;
                  const rawThumbnail = course.thumbnail || courseAny.thumbnail_url || courseAny.thumbnailUrl || courseAny.image_url || null;
                  const resolvedThumbnail = resolveMediaUrl(rawThumbnail) || DEFAULT_COURSE_IMAGE;
                  return (
                    <img
                      src={resolvedThumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COURSE_IMAGE;
                      }}
                    />
                  );
                })()}
              </div>

              {/* Contenu */}
              <div className="flex flex-col flex-1 space-y-4">
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <p className="text-body text-sm line-clamp-3 min-h-[4.5rem]">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-3 text-small">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students} {t('students')}</span>
                  </div>
                  {course.total_lessons && course.total_lessons > 0 && (
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.total_lessons} {t('lessons')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-gray-100 mt-auto">
                  <div>
                    <p className="text-small">{t('instructor')}: {course.instructor}</p>
                    <p className="text-lg text-heading">
                      {course.price === 0 ? t('free') : `${course.price} FCFA`}
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      const slug = course.slug || course.id;
                      router.push(`/courses/${slug}`);
                    }}
                  >
                    {t('viewCourse')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="group"
            onClick={() => router.push('/courses')}
          >
            {t('viewAllCourses')}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
