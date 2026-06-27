import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface DbChurch {
  id: string;
  name: string;
  is_headquarters: boolean;
  city: string;
  state: string;
  ministry_id?: string;
  plan?: string;
  member_limit?: number;
  subscription_status?: string;
  departments?: string[];
  logo_url?: string;
  cover_photo_url?: string;
}

export interface DbChurchService {
  id: string;
  church_id: string;
  name: string;
  day_of_week: string;
  time: string;
}

export interface DbMember {
  id: string;
  church_id: string;
  name: string;
  phone: string;
  email: string;
  function: string;
  status: string;
}

export interface DbSupplier {
  id: string;
  name: string;
  document: string;
}

export function useGlobalData() {
  const [churches, setChurches] = useState<DbChurch[]>([]);
  const [churchServices, setChurchServices] = useState<DbChurchService[]>([]);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [suppliers, setSuppliers] = useState<DbSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [churchesRes, servicesRes, membersRes, suppliersRes] = await Promise.all([
          supabase.from('churches').select('*'),
          supabase.from('church_services').select('*'),
          supabase.from('members').select('*'),
          supabase.from('suppliers').select('*')
        ]);

        if (churchesRes.data) setChurches(churchesRes.data);
        if (servicesRes.data) setChurchServices(servicesRes.data);
        if (membersRes.data) setMembers(membersRes.data);
        if (suppliersRes.data) setSuppliers(suppliersRes.data);
      } catch (error) {
        console.error("Erro ao carregar dados globais:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  return { churches, churchServices, members, suppliers, loading };
}
