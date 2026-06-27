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
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  canSeeAllChurches: boolean;
  canSeeFinanceiro: boolean;
  canManageSystem: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
        if (pathname !== '/login') {
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
      // Fetch role and church_id from our custom table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, church_id, email')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
      }

      setCurrentUser({
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        role: (data?.role as UserRole) || 'secretaria', // fallback
        churchId: data?.church_id || null,
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

  // Derivações de permissão centralizadas
  const canSeeAllChurches = currentUser?.role === 'superadmin' || currentUser?.role === 'pastor_diretor';
  const canSeeFinanceiro = currentUser?.role !== 'secretaria' && currentUser?.role !== 'kids_leader';
  const canManageSystem = currentUser?.role === 'superadmin';

  // Redirecionamento de proteção de rotas
  useEffect(() => {
    if (!loading && !currentUser && pathname !== '/login') {
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
