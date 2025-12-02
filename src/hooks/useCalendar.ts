'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarService } from '../lib/services/calendarService';
import { CalendarEvent, CalendarQueryParams } from '../types/schedule';

/**
 * Hook React pour gérer les événements du calendrier depuis l'API
 * @param filters Filtres pour les événements (start, end, type, upcoming)
 * @returns Objet contenant les événements, le chargement, les erreurs et les fonctions de gestion
 */
export function useCalendar(filters: CalendarQueryParams = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await CalendarService.getEvents(filters);
      setEvents(response);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la récupération des événements');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters.start, filters.end, filters.type, filters.upcoming]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEventById = useCallback(async (eventId: number | string): Promise<CalendarEvent | null> => {
    try {
      const event = await CalendarService.getEventById(eventId);
      return event;
    } catch (err: any) {
      console.error('Erreur lors de la récupération de l\'événement:', err);
      return null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    getEventById,
    refresh,
  };
}

