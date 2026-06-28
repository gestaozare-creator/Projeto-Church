import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface EventModel {
  id: string;
  church_id: string;
  title: string;
  date: string;
  description?: string;
  status?: string;
  created_at?: string;
}

export function useEvents(churchId?: string) {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        let query = supabase.from('events').select('*').order('date', { ascending: true });
        
        if (churchId && churchId !== 'ALL') {
          query = query.or(`church_id.eq.${churchId},church_id.eq.GLOBAL`);
        }
        
        const { data, error: eventsError } = await query;
        if (eventsError) throw eventsError;

        if (data) {
          setEvents(data as EventModel[]);
        }
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadEvents();
  }, [churchId]);

  return { events, setEvents, loading, error };
}
