'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
}

export default function FilterDropdown({
  label,
  options,
  selectedValues,
  onSelectionChange,
  multiple = true,
  searchable = false,
  placeholder = 'Rechercher...',
  className = ''
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOptionClick = (value: string) => {
    if (multiple) {
      const newSelection = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([value]);
      setIsOpen(false);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleSelectAll = () => {
    if (multiple) {
      onSelectionChange(filteredOptions.map(option => option.value));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabels = selectedValues.map(value => 
    options.find(option => option.value === value)?.label
  ).filter(Boolean);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-colors"
      >
        <span className="flex items-center space-x-2">
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <span className="bg-mdsc-blue-primary text-white text-xs px-2 py-1 rounded-full">
              {selectedValues.length}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Actions */}
          {multiple && filteredOptions.length > 0 && (
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <button
                onClick={handleSelectAll}
                className="text-xs text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors"
              >
                Tout sélectionner
              </button>
              {selectedValues.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors"
                >
                  Tout effacer
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Aucun résultat trouvé
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {multiple && (
                      <div className={`w-4 h-4 border-2 rounded ${
                        selectedValues.includes(option.value)
                          ? 'bg-mdsc-blue-primary border-mdsc-blue-primary'
                          : 'border-gray-300'
                      }`}>
                        {selectedValues.includes(option.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    )}
                    <span>{option.label}</span>
                  </div>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-500">({option.count})</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Selected values summary */}
          {selectedValues.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-1">
                {selectedLabels.slice(0, 3).map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs bg-mdsc-blue-primary text-white rounded-full"
                  >
                    {label}
                  </span>
                ))}
                {selectedLabels.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                    +{selectedLabels.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
