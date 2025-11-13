'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { Clock, Users, Star, Play, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  thumbnail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  price: number;
}

interface CoursePreviewProps {
  courses: Course[];
}

export default function CoursePreview({ courses }: CoursePreviewProps) {
  const router = useRouter();
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-mdsc-blue-primary text-white';
      case 'Intermédiaire':
        return 'bg-[#D79A49] text-white';
      case 'Avancé':
        return 'bg-mdsc-blue-dark text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  return (
    <section className="section-mdsc bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
            Formations populaires
          </div>
                 <h2 className="text-3xl md:text-4xl text-display mb-4">
                   Nos formations les plus demandées
                 </h2>
                 <p className="text-lg text-body max-w-2xl mx-auto">
            Découvrez nos cours les plus appréciés par notre communauté d'apprenants
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card-mdsc hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Thumbnail */}
              <div className="relative mb-4 overflow-hidden rounded-lg">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white rounded-full p-3">
                      <Play className="h-6 w-6 text-mdsc-blue" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
              </div>

              {/* Contenu */}
              <div className="space-y-4">
                <div>
                         <h3 className="text-heading text-lg mb-2 line-clamp-2">
                           {course.title}
                         </h3>
                         <p className="text-body text-sm line-clamp-2">
                    {course.description}
                  </p>
                </div>

                       <div className="flex items-center space-x-4 text-small">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                           <p className="text-small">Par {course.instructor}</p>
                           <p className="text-lg text-heading">
                      {course.price === 0 ? 'Gratuit' : `${course.price} FCFA`}
                    </p>
                  </div>
                  <Button size="sm">
                    Voir détails
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
            Voir toutes les formations
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
