"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export type UserRole = 'superadmin' | 'pastor_diretor' | 'admin' | 'financeiro' | 'secretaria' | 'kids_leader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  churchId: string | null;
  churchName?: string;
  ministryId?: string | null;
}

// Chave usada no localStorage para persistir a igreja ativa ao navegar
const ACTIVE_CHURCH_KEY = 'pg_active_church_id';
const ACTIVE_CHURCH_NAME_KEY = 'pg_active_church_name';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  canSeeAllChurches: boolean;
  canSeeFinanceiro: boolean;
  canManageSystem: boolean;
  signOut: () => Promise<void>;
  // Igreja Ativa (contexto de visão do diretor/master)
  activeChurchId: string | null;
  activeChurchName: string | null;
  enterChurch: (churchId: string, churchName: string) => void;
  exitChurch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChurchId, setActiveChurchId] = useState<string | null>(null);
  const [activeChurchName, setActiveChurchName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Recarrega a igreja ativa do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_CHURCH_KEY);
      const savedName = localStorage.getItem(ACTIVE_CHURCH_NAME_KEY);
      if (saved) {
        setActiveChurchId(saved);
        setActiveChurchName(savedName);
      }
    }
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
        // Limpa a igreja ativa ao fazer logout
        setActiveChurchId(null);
        setActiveChurchName(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ACTIVE_CHURCH_KEY);
          localStorage.removeItem(ACTIVE_CHURCH_NAME_KEY);
        }
        const isAgendaPublicScale = pathname?.match(/^\/agenda\/[^/]+\/[^/]+$/);
        const isPublic = pathname === '/' || pathname === '/login' || pathname?.startsWith('/formulario') || pathname?.startsWith('/vendas') || isAgendaPublicScale;
        if (!isPublic) {
          router.push('/login');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const loadUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, church_id, email')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
      }

      let finalRole: UserRole = (data?.role as UserRole) || 'secretaria';
      if (authUser.email === 'gestaozare@gmail.com') {
        finalRole = 'superadmin';
      }

      let resolvedChurchId = data?.church_id || null;
      let resolvedChurchName = 'Desconhecida';

      if (!resolvedChurchId) {
        const { data: firstChurch } = await supabase
          .from('churches')
          .select('id, name')
          .limit(1)
          .single();
        resolvedChurchId = firstChurch?.id || null;
        if (firstChurch) resolvedChurchName = firstChurch.name;
      } else {
        const { data: userChurch } = await supabase
          .from('churches')
          .select('name')
          .eq('id', resolvedChurchId)
          .single();
        if (userChurch) resolvedChurchName = userChurch.name;
      }

      setCurrentUser({
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        role: finalRole,
        churchId: resolvedChurchId,
        churchName: resolvedChurchName,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Entra na visão de uma igreja específica (para diretores/master)
  const enterChurch = (churchId: string, churchName: string) => {
    setActiveChurchId(churchId);
    setActiveChurchName(churchName);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_CHURCH_KEY, churchId);
      localStorage.setItem(ACTIVE_CHURCH_NAME_KEY, churchName);
    }
  };

  // Sai da visão da igreja e volta ao painel geral
  const exitChurch = () => {
    setActiveChurchId(null);
    setActiveChurchName(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_CHURCH_KEY);
      localStorage.removeItem(ACTIVE_CHURCH_NAME_KEY);
    }
  };

  // Derivações de permissão centralizadas
  const canSeeAllChurches = currentUser?.role === 'superadmin' || currentUser?.role === 'pastor_diretor';
  const canSeeFinanceiro = currentUser?.role !== 'secretaria' && currentUser?.role !== 'kids_leader';
  const canManageSystem = currentUser?.role === 'superadmin';

  // Redirecionamento de proteção de rotas
  useEffect(() => {
    const isAgendaPublicScale = pathname?.match(/^\/agenda\/[^/]+\/[^/]+$/);
    const isPublic = pathname === '/' || pathname === '/login' || pathname?.startsWith('/formulario') || pathname?.startsWith('/vendas') || isAgendaPublicScale;
    if (!loading && !currentUser && !isPublic) {
      router.push('/login');
    }
  }, [loading, currentUser, pathname, router]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      canSeeAllChurches,
      canSeeFinanceiro,
      canManageSystem,
      signOut,
      activeChurchId,
      activeChurchName,
      enterChurch,
      exitChurch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
