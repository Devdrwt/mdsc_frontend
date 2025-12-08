'use client';

import React, { useState } from 'react';
import { Grid, List, SortAsc, SortDesc } from 'lucide-react';
import ModernCourseCard from './ModernCourseCard';
import { Course } from '../../lib/services/courseService';

interface ModernCourseGridProps {
  courses: Course[];
  loading?: boolean;
  onCourseClick?: (course: Course) => void;
  onEnroll?: (courseId: string) => void;
  onBookmark?: (courseId: string) => void;
  onShare?: (courseId: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'title' | 'rating' | 'price' | 'students' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function ModernCourseGrid({
  courses,
  loading = false,
  onCourseClick,
  onEnroll,
  onBookmark,
  onShare,
  className = ''
}: ModernCourseGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedCourses = [...courses].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'students':
        aValue = a.totalStudents || 0;
        bValue = b.totalStudents || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {courses.length} cours trouvé{courses.length > 1 ? 's' : ''}
          </span>
          
          {/* Sort options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as SortOption)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
            >
              <option value="title">Titre</option>
              <option value="rating">Note</option>
              <option value="price">Prix</option>
              <option value="students">Utilisateurs</option>
              <option value="createdAt">Date</option>
            </select>
            <button
              onClick={() => handleSort(sortBy)}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {getSortIcon(sortBy)}
            </button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-mdsc-blue-primary text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-mdsc-blue-primary text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Courses grid/list */}
      {sortedCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Grid className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun cours trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {sortedCourses.map((course) => (
            <ModernCourseCard
              key={course.id}
              course={course}
              onEnroll={onEnroll}
              onView={(courseId) => onCourseClick?.(courses.find(c => c.id === courseId)!)}
              onBookmark={onBookmark}
              onShare={onShare}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
