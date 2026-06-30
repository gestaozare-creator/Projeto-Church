import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Member } from '@/types/database';

export function useMembers(churchId?: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        let query = supabase.from('members').select('*');
        if (churchId) {
          query = query.eq('church_id', churchId);
        }
        
        const { data, error: membersError } = await query;
        if (membersError) throw membersError;

        if (data) {
          const formatted = data.map(m => ({
            id: m.id,
            church_id: m.church_id || '',
            name: m.name,
            phone: m.phone || '',
            email: m.email || '',
            address: m.address || '',
            state: m.state || '',
            function: m.function || '',
            ministry: m.ministry || '',
            status: m.status || 'pendente',
            integrationDate: m.integration_date || (m.created_at ? m.created_at.split('T')[0] : ''),
            photoUrl: m.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`
          }));
          setMembers(formatted as any);
        }
      } catch (err: any) {
        console.error('Error loading members:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadMembers();
  }, [churchId]);

  return { members, setMembers, loading, error };
}
