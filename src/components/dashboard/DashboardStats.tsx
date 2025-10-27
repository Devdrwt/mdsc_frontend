import React from 'react';
import { BookOpen, Award, Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    enrolledCourses: number;
    completedCourses: number;
    certificates: number;
    studyTime: string;
    progress: number;
    nextDeadline?: string;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Cours inscrits',
      value: stats.enrolledCourses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Cours terminés',
      value: stats.completedCourses,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Certificats',
      value: stats.certificates,
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Temps d\'étude',
      value: stats.studyTime,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card-mdsc">
            <div className="flex items-center">
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-mdsc-gray">{stat.title}</p>
                <p className="text-2xl font-bold text-mdsc-blue">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
