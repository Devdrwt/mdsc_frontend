'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Target,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { calendarService } from '../../../lib/services/calendarService';
import { scheduleService } from '../../../lib/services/scheduleService';
import { CalendarEvent as ApiCalendarEvent } from '../../../types/schedule';
import { ScheduleItem } from '../../../types/schedule';
import CourseService from '../../../lib/services/courseService';
import toast from '../../../lib/utils/toast';
import { format, parseISO, startOfMonth, endOfMonth, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: 'course' | 'deadline' | 'exam' | 'assignment' | 'quiz' | 'lesson' | 'milestone' | 'reminder';
  status: 'upcoming' | 'in-progress' | 'completed' | 'missed' | 'overdue' | 'pending';
  courseTitle?: string;
  courseId?: number;
  lessonId?: number;
  quizId?: number;
  originalEvent?: ApiCalendarEvent | ScheduleItem;
}

export default function CalendarPanel() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Map<number, { title: string; slug: string }>>(new Map());

  // Charger les événements du calendrier et les plannings
  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculer les dates de début et fin du mois
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Charger les événements du calendrier
      const calendarEvents = await calendarService.getEvents({
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      });

      // Charger les cours de l'étudiant pour récupérer les plannings
      const studentCourses = await CourseService.getMyCourses();
      
      // Créer une map des cours pour accès rapide
      const coursesMap = new Map<number, { title: string; slug: string }>();
      studentCourses.forEach((course: any) => {
        coursesMap.set(course.id, {
          title: course.title || course.course_title || 'Cours sans titre',
          slug: course.slug || course.course_slug || '',
        });
      });
      setCourses(coursesMap);

      // Charger les plannings de tous les cours avec leur course_id
      const scheduleItemsWithCourse: Array<{ item: ScheduleItem; courseId: number }> = [];
      for (const course of studentCourses) {
        try {
          const courseId = typeof course.id === 'string' ? parseInt(course.id, 10) : course.id;
          const schedule = await scheduleService.getCourseSchedule(courseId);
          // Chaque item du planning est associé au course_id du schedule
          schedule.schedule.forEach((item) => {
            scheduleItemsWithCourse.push({ item, courseId: schedule.course_id });
          });
        } catch (err: any) {
          // Ignorer les erreurs 404 (cours sans planning)
          if (err.status !== 404) {
            console.warn(`Erreur lors du chargement du planning pour le cours ${course.id}:`, err);
          }
        }
      }

      // Convertir les événements calendrier en format unifié
      const unifiedEvents: CalendarEvent[] = [];

      // Ajouter les événements du calendrier
      calendarEvents.forEach((event) => {
        const startDate = parseISO(event.start_date);
        unifiedEvents.push({
          id: `calendar-${event.id}`,
          title: event.title,
          description: event.description,
          date: format(startDate, 'yyyy-MM-dd'),
          time: format(startDate, 'HH:mm'),
          type: mapEventType(event.event_type),
          status: getEventStatus(event.start_date, event.end_date),
          courseTitle: event.course?.title,
          courseId: event.course?.id,
          originalEvent: event,
        });
      });

      // Ajouter les items de planning avec le bon course_id
      scheduleItemsWithCourse.forEach(({ item, courseId }) => {
        const scheduledDate = parseISO(item.scheduled_date);
        const courseInfo = coursesMap.get(courseId) || { title: 'Cours', slug: '' };
        
        unifiedEvents.push({
          id: `schedule-${item.id}`,
          title: item.title,
          description: item.metadata?.module_title ? `Module: ${item.metadata.module_title}` : undefined,
          date: format(scheduledDate, 'yyyy-MM-dd'),
          time: format(scheduledDate, 'HH:mm'),
          type: mapScheduleItemType(item.type),
          status: mapScheduleItemStatus(item.status),
          courseTitle: courseInfo.title,
          courseId: courseId,
          lessonId: item.lesson_id || undefined,
          quizId: item.quiz_id || undefined,
          originalEvent: item,
        });
      });

      setEvents(unifiedEvents);
    } catch (err: any) {
      console.error('Erreur lors du chargement du calendrier:', err);
      setError(err.message || 'Erreur lors du chargement du calendrier');
      toast.error('Erreur', 'Impossible de charger les événements du calendrier');
    } finally {
      setLoading(false);
    }
  };

  const mapEventType = (eventType: string): CalendarEvent['type'] => {
    switch (eventType) {
      case 'course_start':
        return 'course';
      case 'quiz_scheduled':
        return 'quiz';
      case 'deadline':
        return 'deadline';
      case 'announcement':
        return 'reminder';
      case 'milestone':
        return 'milestone';
      default:
        return 'course';
    }
  };

  const mapScheduleItemType = (type: ScheduleItem['type']): CalendarEvent['type'] => {
    switch (type) {
      case 'lesson':
        return 'lesson';
      case 'quiz':
        return 'quiz';
      case 'deadline':
        return 'deadline';
      case 'reminder':
        return 'reminder';
      case 'milestone':
        return 'milestone';
      default:
        return 'course';
    }
  };

  const mapScheduleItemStatus = (status: ScheduleItem['status']): CalendarEvent['status'] => {
    switch (status) {
      case 'pending':
        return 'upcoming';
      case 'in_progress':
        return 'in-progress';
      case 'completed':
        return 'completed';
      case 'overdue':
        return 'overdue';
      case 'skipped':
        return 'missed';
      default:
        return 'upcoming';
    }
  };

  const getEventStatus = (startDate: string, endDate: string): CalendarEvent['status'] => {
    const now = new Date();
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (isPast(end)) {
      return 'completed';
    }
    if (isPast(start) && !isPast(end)) {
      return 'in-progress';
    }
    return 'upcoming';
  };

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

  const getEventTypeColor = (type: CalendarEvent['type'], status?: CalendarEvent['status']) => {
    if (status === 'overdue') {
      return 'bg-red-600';
    }
    if (status === 'completed') {
      return 'bg-green-500';
    }
    
    switch (type) {
      case 'course':
      case 'lesson':
        return 'bg-blue-500';
      case 'quiz':
      case 'exam':
        return 'bg-orange-500';
      case 'assignment':
        return 'bg-yellow-500';
      case 'deadline':
        return 'bg-red-500';
      case 'milestone':
        return 'bg-green-600';
      case 'reminder':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'course':
      case 'lesson':
        return BookOpen;
      case 'quiz':
      case 'exam':
        return FileText;
      case 'assignment':
        return CheckCircle;
      case 'deadline':
        return AlertCircle;
      case 'milestone':
        return Target;
      case 'reminder':
        return Clock;
      default:
        return CalendarIcon;
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.lessonId && event.courseId) {
      router.push(`/learn/${event.courseId}?lesson=${event.lessonId}`);
    } else if (event.quizId && event.courseId) {
      router.push(`/learn/${event.courseId}?quiz=${event.quizId}`);
    } else if (event.courseId) {
      const course = courses.get(event.courseId);
      if (course?.slug) {
        router.push(`/courses/${course.slug}`);
      }
    }
  };

  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = parseISO(`${event.date}T${event.time}`);
        return (event.status === 'upcoming' || event.status === 'in-progress' || event.status === 'pending') && 
               !isPast(eventDate);
      })
      .sort((a, b) => {
        const dateA = parseISO(`${a.date}T${a.time}`);
        const dateB = parseISO(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
    .slice(0, 5);
  }, [events]);

  const overdueEvents = useMemo(() => {
    return events.filter(event => event.status === 'overdue');
  }, [events]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-mdsc-blue-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue contrôle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            {overdueEvents.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                {overdueEvents.length} en retard
              </div>
            )}
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
                          className={`text-[10px] p-1 rounded ${getEventTypeColor(event.type, event.status)} text-white truncate cursor-pointer hover:opacity-80 transition-opacity`}
                          title={event.title}
                          onClick={() => handleEventClick(event)}
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
                    <div 
                      key={event.id} 
                      className={`border-l-4 pl-4 py-2 hover:bg-gray-50 rounded transition-colors cursor-pointer ${
                        event.status === 'overdue' 
                          ? 'border-red-500 bg-red-50' 
                          : event.status === 'completed'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`p-1 rounded ${getEventTypeColor(event.type, event.status)}`}>
                              <EventIcon className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{event.title}</span>
                            {event.status === 'overdue' && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">En retard</span>
                            )}
                            {event.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
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

          {/* Items en retard */}
          {overdueEvents.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Éléments en retard ({overdueEvents.length})
              </h3>
              <div className="space-y-3">
                {overdueEvents.slice(0, 3).map((event) => {
                  const EventIcon = getEventTypeIcon(event.type);
                  return (
                    <div
                      key={event.id}
                      className="bg-white border border-red-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`p-1 rounded ${getEventTypeColor(event.type, event.status)}`}>
                              <EventIcon className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{event.title}</span>
                          </div>
                          {event.courseTitle && (
                            <p className="text-xs text-gray-600 mb-1">{event.courseTitle}</p>
                          )}
                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                            <span className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(parseISO(event.date), 'dd MMM yyyy', { locale: fr })}
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
                })}
                {overdueEvents.length > 3 && (
                  <p className="text-xs text-red-700 text-center">
                    +{overdueEvents.length - 3} autre(s) élément(s) en retard
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Légende */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">Cours / Leçon</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">Quiz / Examen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Deadline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-sm text-gray-700">Milestone</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-700">Rappel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-sm text-gray-700">En retard</span>
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
                <span className="text-blue-100">Cours / Leçons</span>
                <span className="text-2xl font-bold">
                  {events.filter(e => e.type === 'course' || e.type === 'lesson').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Quiz / Examens</span>
                <span className="text-2xl font-bold">
                  {events.filter(e => e.type === 'quiz' || e.type === 'exam').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Complétés</span>
                <span className="text-2xl font-bold">
                  {events.filter(e => e.status === 'completed').length}
                </span>
              </div>
              {overdueEvents.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-blue-400">
                  <span className="text-red-200">En retard</span>
                  <span className="text-2xl font-bold text-red-200">{overdueEvents.length}</span>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

