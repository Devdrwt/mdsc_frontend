import React from 'react';
import { Course } from '../../types';
import { Clock, Users, Star, Play, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

interface RecentCoursesProps {
  courses: Course[];
  onCourseClick?: (courseId: string | number) => void;
}

export default function RecentCourses({ courses, onCourseClick }: RecentCoursesProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-100 text-green-800';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  return (
    <div className="card-mdsc">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-mdsc-blue">Mes cours récents</h3>
        <Button variant="outline" size="sm">
          Voir tous
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-mdsc-gray mb-4">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">Aucun cours suivi</h4>
              <p className="text-sm">Commencez votre parcours de formation</p>
            </div>
            <Button>Découvrir les cours</Button>
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onCourseClick?.(course.id)}
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-mdsc-blue truncate">
                      {course.title}
                    </h4>
                    <p className="text-sm text-mdsc-gray mt-1">
                      Par {typeof course.instructor === 'string' ? course.instructor : course.instructor?.name || 'Instructeur'}
                    </p>
                    
                    {/* Métadonnées */}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-mdsc-gray">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{course.students}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge niveau */}
                  <div className="ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Barre de progression (simulée) */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-mdsc-gray mb-1">
                    <span>Progression</span>
                    <span>25%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-mdsc-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: '25%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
