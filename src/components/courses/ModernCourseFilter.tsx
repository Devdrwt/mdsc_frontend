'use client';

import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import SearchInput from '../ui/SearchInput';
import FilterDropdown from '../ui/FilterDropdown';

interface CourseFilter {
  search: string;
  categories: string[];
  levels: string[];
  priceRange: {
    min: number;
    max: number;
  };
  duration: string[];
  rating: number;
}

interface ModernCourseFilterProps {
  onFilterChange: (filter: CourseFilter) => void;
  categories?: string[];
  levels?: string[];
  durations?: string[];
  className?: string;
}

export default function ModernCourseFilter({
  onFilterChange,
  categories = ['Toutes les catégories', 'Formations thématiques', 'Renforcement organisationnel et institutionnel', 'Autres'],
  levels = ['Tous les niveaux', 'Débutant', 'Intermédiaire', 'Avancé'],
  durations = ['Toutes les durées', 'Court (< 4h)', 'Moyen (4-8h)', 'Long (> 8h)'],
  className = ''
}: ModernCourseFilterProps) {
  const [filter, setFilter] = useState<CourseFilter>({
    search: '',
    categories: [],
    levels: [],
    priceRange: { min: 0, max: 100000 },
    duration: [],
    rating: 0
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (newFilter: Partial<CourseFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange(updatedFilter);
  };

  const handleSearch = (query: string) => {
    handleFilterChange({ search: query });
  };

  const handleCategoryChange = (values: string[]) => {
    handleFilterChange({ categories: values });
  };

  const handleLevelChange = (values: string[]) => {
    handleFilterChange({ levels: values });
  };

  const handleDurationChange = (values: string[]) => {
    handleFilterChange({ duration: values });
  };

  const clearFilters = () => {
    const clearedFilter: CourseFilter = {
      search: '',
      categories: [],
      levels: [],
      priceRange: { min: 0, max: 100000 },
      duration: [],
      rating: 0
    };
    setFilter(clearedFilter);
    onFilterChange(clearedFilter);
  };

  const hasActiveFilters = filter.search || 
    filter.categories.length > 0 || 
    filter.levels.length > 0 || 
    filter.duration.length > 0 ||
    filter.rating > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Search bar */}
      <div className="mb-6">
        <SearchInput
          placeholder="Rechercher des cours..."
          value={filter.search}
          onChange={(value) => handleFilterChange({ search: value })}
          onSearch={handleSearch}
          size="md"
        />
      </div>

      {/* Basic filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FilterDropdown
          label="Catégorie"
          options={categories.map(cat => ({ value: cat, label: cat }))}
          selectedValues={filter.categories}
          onSelectionChange={handleCategoryChange}
          multiple={true}
        />
        
        <FilterDropdown
          label="Niveau"
          options={levels.map(level => ({ value: level, label: level }))}
          selectedValues={filter.levels}
          onSelectionChange={handleLevelChange}
          multiple={true}
        />
        
        <FilterDropdown
          label="Durée"
          options={durations.map(duration => ({ value: duration, label: duration }))}
          selectedValues={filter.duration}
          onSelectionChange={handleDurationChange}
          multiple={true}
        />
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtres avancés</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Effacer tous les filtres</span>
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fourchette de prix
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filter.priceRange.min}
                  onChange={(e) => handleFilterChange({
                    priceRange: { ...filter.priceRange, min: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filter.priceRange.max}
                  onChange={(e) => handleFilterChange({
                    priceRange: { ...filter.priceRange, max: parseInt(e.target.value) || 100000 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note minimum
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleFilterChange({ rating })}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      filter.rating >= rating
                        ? 'bg-yellow-400 border-yellow-400'
                        : 'bg-white border-gray-300 hover:border-yellow-400'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filter.search && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Recherche: {filter.search}
                <button
                  onClick={() => handleFilterChange({ search: '' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filter.categories.map((category) => (
              <span key={category} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {category}
                <button
                  onClick={() => handleFilterChange({
                    categories: filter.categories.filter(c => c !== category)
                  })}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filter.levels.map((level) => (
              <span key={level} className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                {level}
                <button
                  onClick={() => handleFilterChange({
                    levels: filter.levels.filter(l => l !== level)
                  })}
                  className="ml-2 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
