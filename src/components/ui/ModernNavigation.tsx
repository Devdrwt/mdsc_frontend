'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  children?: NavigationItem[];
  badge?: string;
  badgeColor?: string;
}

interface ModernNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export default function ModernNavigation({
  items,
  activeItem,
  onItemClick,
  className = '',
  collapsible = false,
  defaultCollapsed = false
}: ModernNavigationProps) {
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(
    defaultCollapsed ? new Set(items.map(item => item.id)) : new Set()
  );

  const toggleCollapse = (itemId: string) => {
    const newCollapsedItems = new Set(collapsedItems);
    if (newCollapsedItems.has(itemId)) {
      newCollapsedItems.delete(itemId);
    } else {
      newCollapsedItems.add(itemId);
    }
    setCollapsedItems(newCollapsedItems);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && collapsible) {
      toggleCollapse(item.id);
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const renderItem = (item: NavigationItem, level: number = 0) => {
    const isActive = activeItem === item.id;
    const isCollapsed = collapsedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <div
          className={`
            flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer
            transition-all duration-200 hover:bg-white/20
            ${isActive ? 'bg-mdsc-blue-primary text-white' : 'text-gray-700'}
            ${level > 0 ? 'ml-4' : ''}
          `}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center space-x-3">
            {item.icon && (
              <item.icon className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{item.label}</span>
            {item.badge && (
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${item.badgeColor || 'bg-gray-100 text-gray-600'}
                ${isActive ? 'bg-white/20 text-white' : ''}
              `}>
                {item.badge}
              </span>
            )}
          </div>
          {hasChildren && collapsible && (
            <div className="transition-transform duration-200">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        {/* Enfants */}
        {hasChildren && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map(item => renderItem(item))}
    </nav>
  );
}
