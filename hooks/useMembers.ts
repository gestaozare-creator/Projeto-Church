import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Member } from '@/types/database';

/**
 * Hook para carregar membros FILTRADOS POR REDE.
 * Se churchIds for fornecido, filtra na query do Supabase (isolamento real).
 * Se churchId singular for fornecido, usa apenas aquela igreja.
 */
export function useMembers(churchId?: string, churchIds?: string[]) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        setMembers([]);

        // Sem nenhum escopo definido, não carrega nada (segurança)
        if (!churchId && (!churchIds || churchIds.length === 0)) {
          setMembers([]);
          return;
        }

        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;

        while (true) {
          let query = supabase.from('members').select('*');

          if (churchId) {
            // Escopo de uma única igreja
            query = query.eq('church_id', churchId);
          } else if (churchIds && churchIds.length > 0) {
            // Escopo de múltiplas igrejas da mesma rede
            query = query.in('church_id', churchIds);
          }

          const { data, error: membersError } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
          if (membersError) throw membersError;
          if (!data || data.length === 0) break;
          allData = [...allData, ...data];
          if (data.length < pageSize) break;
          page++;
        }

        if (allData.length > 0) {
          const formatted = allData.map(m => ({
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
            birthDate: m.birth_date || '',
            photoUrl: m.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`,
            culto: m.culto || '',
            horario: m.horario || '',
            maritalStatus: m.marital_status || '',
            employmentStatus: m.employment_status || '',
            profession: m.profession || '',
            cardValidity: m.card_validity || '',
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
  }, [churchId, JSON.stringify(churchIds)]);

  return { members, setMembers, loading, error };
}
