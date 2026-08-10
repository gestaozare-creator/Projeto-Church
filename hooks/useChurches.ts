import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Church } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook para carregar igrejas FILTRADAS POR MINISTÉRIO/REDE.
 * O filtro por ministryId acontece na query do Supabase, não na tela.
 * Isso garante isolamento real de dados entre redes diferentes.
 */
export function useChurches(ministryId?: string | null) {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isPastorRegional, regionalChurchIds } = useAuth();

  useEffect(() => {
    async function loadChurches() {
      try {
        setLoading(true);
        setChurches([]);

        // FILTRO NA ORIGEM: se ministryId for fornecido, filtra no banco.
        // Superadmin sem ministryId carrega tudo.
        let churchQuery = supabase.from('churches').select('*');
        if (ministryId) {
          churchQuery = churchQuery.eq('ministry_id', ministryId);
        }
        if (isPastorRegional && regionalChurchIds && regionalChurchIds.length > 0) {
          churchQuery = churchQuery.in('id', regionalChurchIds);
        }

        const { data: churchesDb, error: churchesError } = await churchQuery;
        if (churchesError) throw churchesError;

        if (!churchesDb || churchesDb.length === 0) {
          setChurches([]);
          return;
        }

        // Carrega serviços apenas das igrejas da rede
        const churchIds = churchesDb.map(c => c.id);
        const { data: servicesDb, error: servicesError } = await supabase
          .from('church_services')
          .select('*')
          .in('church_id', churchIds);
        if (servicesError) throw servicesError;

        const formatted = churchesDb.map(c => {
          const svcs = (servicesDb || []).filter(s => s.church_id === c.id).map(s => ({
            ...s,
            dayOfWeek: s.day_of_week || s.dayOfWeek,
          }));

          return {
            id: c.id,
            ministryId: c.ministry_id || '',
            name: c.name,
            isHeadquarters: c.is_headquarters,
            city: c.city || '',
            neighborhood: c.neighborhood || '',
            state: c.state || '',
            address: c.address || '',
            phone: c.phone || '',
            pastorName: c.pastor_name || '',
            logoUrl: c.logo_url || '',
            primaryColor: c.primary_color || '#3498db',
            secondaryColor: c.secondary_color || '#2c3e50',
            status: c.status || 'ativa',
            plan: c.plan || 'Basic',
            memberLimit: c.member_limit || null,
            userLimit: c.user_limit || 3,
            subscriptionStatus: c.subscription_status || 'Trial',
            departments: c.departments || ['Louvor', 'Infantil'],
            coverPhotoUrl: c.cover_photo_url || '',
            activeModules: c.active_modules || ['secretaria', 'financeiro', 'departamentos'],
            cardConfig: c.card_config
              ? (typeof c.card_config === 'string' ? JSON.parse(c.card_config) : c.card_config)
              : { primaryColor: '#3498db', showLogo: true, showSignature: false, customDisclaimer: 'Este documento é de uso exclusivo do membro.' },
            config: c.config
              ? (typeof c.config === 'string' ? JSON.parse(c.config) : c.config)
              : null,
            services: svcs
          };
        });
        setChurches(formatted as any);
      } catch (err: any) {
        console.error('Error loading churches:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    // Só carrega quando temos um ministryId (ou explicitamente null para superadmin sem restrição)
    if (ministryId !== undefined) {
      loadChurches();
    }
  }, [ministryId, isPastorRegional, regionalChurchIds]);

  return { churches, loading, error };
}
