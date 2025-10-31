'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Target
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: 'course' | 'deadline' | 'exam' | 'assignment';
  status: 'upcoming' | 'in-progress' | 'completed' | 'missed';
  courseTitle?: string;
}

export default function CalendarPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Événements de démonstration
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Quiz sur le Leadership',
      description: 'Quiz pour évaluer vos connaissances',
      date: '2024-01-15',
      time: '10:00',
      type: 'exam',
      status: 'upcoming',
      courseTitle: 'Leadership et Management'
    },
    {
      id: '2',
      title: 'Soumission du projet',
      description: 'Deadline pour le projet final',
      date: '2024-01-20',
      time: '23:59',
      type: 'deadline',
      status: 'upcoming',
      courseTitle: 'Gestion de Projet'
    },
    {
      id: '3',
      title: 'Cours en direct',
      description: 'Session en ligne avec l\'instructeur',
      date: '2024-01-18',
      time: '14:00',
      type: 'course',
      status: 'upcoming',
      courseTitle: 'Communication Professionnelle'
    },
    {
      id: '4',
      title: 'Examen final',
      description: 'Examen de certification',
      date: '2024-01-25',
      time: '09:00',
      type: 'exam',
      status: 'upcoming',
      courseTitle: 'Stratégie Marketing'
    },
  ];

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Jours du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getEventsForDate = (day: number) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-500';
      case 'exam':
        return 'bg-red-500';
      case 'assignment':
        return 'bg-yellow-500';
      case 'deadline':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return PlayCircle;
      case 'exam':
        return Target;
      case 'assignment':
        return CheckCircle;
      case 'deadline':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const upcomingEvents = events
    .filter(event => event.status === 'upcoming' || event.status === 'in-progress')
    .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
    .slice(0, 5);

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Vue contrôle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-mdsc-blue-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-mdsc-blue-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semaine
            </button>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier principal */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day, index) => (
              <div key={index} className="text-center text-sm font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const todayClass = isToday(day) ? 'bg-mdsc-blue-primary text-white font-bold' : 'text-gray-700 hover:bg-gray-100';
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] border border-gray-200 rounded-lg p-2 transition-colors ${
                    day ? todayClass : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const EventIcon = getEventTypeIcon(event.type);
                      return (
                        <div
                          key={event.id}
                          className={`text-[10px] p-1 rounded ${getEventTypeColor(event.type)} text-white truncate`}
                          title={event.title}
                        >
                          {event.time} - {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} de plus
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Événements à venir */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-mdsc-blue-primary" />
              Événements à venir
            </h3>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const EventIcon = getEventTypeIcon(event.type);
                  return (
                    <div key={event.id} className="border-l-4 border-gray-200 pl-4 py-2 hover:bg-gray-50 rounded transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <EventIcon className={`h-4 w-4 ${getEventTypeColor(event.type)} text-white rounded`} />
                            <span className="text-sm font-medium text-gray-900">{event.title}</span>
                          </div>
                          {event.courseTitle && (
                            <p className="text-xs text-gray-500 mb-1">{event.courseTitle}</p>
                          )}
                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                            <span className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Aucun événement à venir</p>
                </div>
              )}
            </div>
          </div>

          {/* Légende */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">Cours en direct</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Examen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700">Devoir</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">Deadline</span>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="bg-gradient-to-br from-mdsc-blue-primary to-blue-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Ce mois</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Événements totaux</span>
                <span className="text-2xl font-bold">{events.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Cours</span>
                <span className="text-2xl font-bold">{events.filter(e => e.type === 'course').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Examen</span>
                <span className="text-2xl font-bold">{events.filter(e => e.type === 'exam').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

