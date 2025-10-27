'use client';

import React, { useState } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ModernNavigation from './ModernNavigation';

interface ModernSidebarProps {
  title: string;
  items: any[];
  activeItem?: string;
  onItemClick?: (item: any) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export default function ModernSidebar({
  title,
  items,
  activeItem,
  onItemClick,
  collapsible = true,
  defaultCollapsed = false,
  className = ''
}: ModernSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${className}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          <div className="flex items-center space-x-2">
            {collapsible && (
              <button
                onClick={toggleCollapse}
                className="hidden md:block p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4">
          <ModernNavigation
            items={items}
            activeItem={activeItem}
            onItemClick={onItemClick}
            collapsible={collapsible && !isCollapsed}
            defaultCollapsed={isCollapsed}
          />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {!isCollapsed && (
            <div className="text-xs text-gray-500 text-center">
              Version 1.0.0
            </div>
          )}
        </div>
      </div>

      {/* Main content spacer */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`} />
    </>
  );
}
