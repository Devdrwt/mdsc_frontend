'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Clock, Star, Users } from 'lucide-react';
import SearchInput from '../ui/SearchInput';

interface CourseSuggestion {
  id: string;
  title: string;
  category: string;
  level: string;
  rating: number;
  students: number;
  duration: string;
}

interface ModernCourseSearchProps {
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: CourseSuggestion) => void;
  suggestions?: CourseSuggestion[];
  popularSearches?: string[];
  recentSearches?: string[];
  className?: string;
}

export default function ModernCourseSearch({
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  popularSearches = [],
  recentSearches = [],
  className = ''
}: ModernCourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPopular, setShowPopular] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
      setShowPopular(false);
    } else {
      setShowSuggestions(false);
      setShowPopular(true);
    }
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: CourseSuggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handlePopularSearch = (search: string) => {
    setSearchQuery(search);
    onSearch(search);
    setShowPopular(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
    setShowSuggestions(false);
    setShowPopular(true);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div className="relative">
        <SearchInput
          placeholder="Rechercher des cours, formateurs, catégories..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          size="lg"
          suggestions={suggestions.map(s => s.title)}
          onSuggestionSelect={(suggestion) => {
            const courseSuggestion = suggestions.find(s => s.title === suggestion);
            if (courseSuggestion) {
              handleSuggestionClick(courseSuggestion);
            }
          }}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Cours suggérés</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{suggestion.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{suggestion.students}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{suggestion.rating.toFixed(1)}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {suggestion.category}
                      </span>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {suggestion.level}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular searches */}
      {showPopular && popularSearches.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Recherches populaires
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularSearch(search)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent searches */}
      {showPopular && recentSearches.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Recherches récentes</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularSearch(search)}
                  className="w-full flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span>{search}</span>
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}