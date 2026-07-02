import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Church } from '@/types/database';

export function useChurches() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadChurches() {
      try {
        setLoading(true);
        const { data: churchesDb, error: churchesError } = await supabase.from('churches').select('*');
        if (churchesError) throw churchesError;

        const { data: servicesDb, error: servicesError } = await supabase.from('church_services').select('*');
        if (servicesError) throw servicesError;

        if (churchesDb) {
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
              cardConfig: c.card_config ? (typeof c.card_config === 'string' ? JSON.parse(c.card_config) : c.card_config) : { primaryColor: '#3498db', showLogo: true, showSignature: false, customDisclaimer: 'Este documento é de uso exclusivo do membro.' },
              config: c.config ? (typeof c.config === 'string' ? JSON.parse(c.config) : c.config) : null,
              services: svcs
            };
          });
          setChurches(formatted as any);
        }
      } catch (err: any) {
        console.error('Error loading churches:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadChurches();
  }, []);

  return { churches, setChurches, loading, error };
}
