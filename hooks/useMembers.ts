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
        const pageSize = 1000;

        // 1. Descobrir o total de registros (Count query)
        let countQuery = supabase.from('members').select('id', { count: 'exact', head: true });
        
        if (churchId) {
          countQuery = countQuery.eq('church_id', churchId);
        } else if (churchIds && churchIds.length > 0) {
          countQuery = countQuery.in('church_id', churchIds);
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;

        if (count && count > 0) {
          // 2. Calcular total de páginas
          const totalPages = Math.ceil(count / pageSize);
          const pagePromises = [];

          // Colunas exatas para economizar payload da rede
          const selectFields = 'id, church_id, name, phone, email, address, state, function, ministry, status, integration_date, created_at, birth_date, photo_url, culto, horario, marital_status, employment_status, profession, is_baptized, baptism_date, card_validity';

          // 3. Disparar requests paralelos
          for (let page = 0; page < totalPages; page++) {
            let query = supabase.from('members').select(selectFields);

            if (churchId) {
              query = query.eq('church_id', churchId);
            } else if (churchIds && churchIds.length > 0) {
              query = query.in('church_id', churchIds);
            }

            pagePromises.push(query.range(page * pageSize, (page + 1) * pageSize - 1));
          }

          // 4. Esperar todos os requests terminarem de uma vez
          const results = await Promise.all(pagePromises);
          
          for (const res of results) {
            if (res.error) throw res.error;
            if (res.data) {
              allData = allData.concat(res.data);
            }
          }
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
            isBaptized: m.is_baptized === true || m.is_baptized === 'Sim' ? 'Sim' : (m.is_baptized === false || m.is_baptized === 'Não' ? 'Não' : (m.is_baptized || '')),
            baptismDate: m.baptism_date || '',
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
