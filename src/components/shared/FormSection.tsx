import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  description?: string;
}

export default function FormSection({ title, icon: Icon, children, description }: FormSectionProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6 pb-3 border-b border-gray-200">
        <div className="p-2 bg-mdsc-gold/10 rounded-lg">
          <Icon className="h-5 w-5 text-mdsc-gold" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

