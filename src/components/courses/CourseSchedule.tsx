'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, BookOpen, FileText, Target, AlertTriangle } from 'lucide-react';
import { scheduleService } from '../../lib/services/scheduleService';
import { ScheduleItem } from '../../types/schedule';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from '../../lib/utils/toast';

interface CourseScheduleProps {
  courseId: number;
  onItemClick?: (item: ScheduleItem) => void;
}

const CourseSchedule: React.FC<CourseScheduleProps> = ({ courseId, onItemClick }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, [courseId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleService.getCourseSchedule(courseId);
      setSchedule(data.schedule);
    } catch (err: any) {
      console.error('Erreur récupération planning:', err);
      setError(err.message || 'Erreur lors de la récupération du planning');
      // Ne pas afficher d'erreur si l'étudiant n'est pas inscrit (404)
      if (err.status !== 404) {
        toast.error('Erreur', 'Impossible de charger le planning');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ScheduleItem['status']) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
      completed: { label: 'Complété', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      overdue: { label: 'En retard', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      skipped: { label: 'Ignoré', color: 'bg-gray-100 text-gray-500', icon: AlertCircle },
    };
    return badges[status] || badges.pending;
  };

  const getTypeIcon = (type: ScheduleItem['type']) => {
    const icons = {
      lesson: { icon: BookOpen, color: 'text-blue-600' },
      quiz: { icon: FileText, color: 'text-orange-600' },
      deadline: { icon: AlertCircle, color: 'text-red-600' },
      reminder: { icon: Clock, color: 'text-yellow-600' },
      milestone: { icon: Target, color: 'text-green-600' },
    };
    return icons[type] || { icon: Calendar, color: 'text-gray-600' };
  };

  const getPriorityColor = (priority: ScheduleItem['priority']) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || colors.medium;
  };

  const stats = {
    total: schedule.length,
    completed: schedule.filter((s) => s.status === 'completed').length,
    overdue: schedule.filter((s) => s.status === 'overdue').length,
    pending: schedule.filter((s) => s.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && schedule.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          Le planning n'est pas encore disponible. Il sera généré automatiquement après votre inscription.
        </p>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600 text-sm">Aucun élément dans le planning pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="course-schedule space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Planning d'Apprentissage
        </h3>
        <button
          onClick={fetchSchedule}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Complétés</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">En retard</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">En attente</div>
        </div>
      </div>

      {/* Liste des items */}
      <div className="space-y-3">
        {schedule.map((item) => {
          const statusBadge = getStatusBadge(item.status);
          const typeInfo = getTypeIcon(item.type);
          const StatusIcon = statusBadge.icon;
          const TypeIcon = typeInfo.icon;

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                item.status === 'overdue' ? 'border-red-300 bg-red-50' : 'border-gray-200'
              } ${onItemClick ? 'cursor-pointer' : ''}`}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-1 ${typeInfo.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {/* Utiliser start_date pour les sessions live, scheduled_date pour les autres */}
                      {((item as any).start_date || item.scheduled_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {(() => {
                              const dateToUse = (item as any).start_date || item.scheduled_date;
                              if (!dateToUse) return 'Date non disponible';
                              try {
                                const date = new Date(dateToUse);
                                if (isNaN(date.getTime())) return 'Date invalide';
                                return format(date, "dd MMM yyyy 'à' HH:mm", { locale: fr });
                              } catch (error) {
                                console.error('Erreur lors du formatage de la date:', error, dateToUse);
                                return 'Date invalide';
                              }
                            })()}
                          </span>
                        </div>
                      )}
                      {item.duration_minutes > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{item.duration_minutes} min</span>
                        </div>
                      )}
                      {(item.priority === 'high' || item.priority === 'urgent') && (
                        <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                          ⚠️ Priorité {item.priority === 'urgent' ? 'urgente' : 'élevée'}
                        </span>
                      )}
                    </div>
                    {item.status === 'overdue' && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                        ⚠️ Cet élément est en retard
                      </div>
                    )}
                    {item.status === 'pending' && item.type === 'lesson' && item.lesson_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick?.(item);
                        }}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Commencer la leçon
                      </button>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusBadge.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseSchedule;

