"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

export type UserRole = 'superadmin' | 'pastor_diretor' | 'pastor_regional' | 'admin' | 'financeiro' | 'secretaria' | 'kids_leader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  churchId: string | null;
  churchName?: string;
  ministryId?: string | null;  // ministry_id da igreja do usuário (sua rede nativa)
  regionalChurches?: string[]; // Para Pastor Regional: array de IDs das igrejas
}

// Chaves usadas no localStorage para persistir a igreja ativa ao navegar
const ACTIVE_CHURCH_KEY = 'pg_active_church_id';
const ACTIVE_CHURCH_NAME_KEY = 'pg_active_church_name';
const ACTIVE_MINISTRY_KEY = 'pg_active_ministry_id';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  canSeeAllChurches: boolean;
  isPastorRegional: boolean;
  canSeeRelatorios: boolean;
  canSeeFinanceiro: boolean;
  canManageSystem: boolean;
  signOut: () => Promise<void>;
  // Igreja Ativa (contexto de visão do diretor/master/regional)
  activeChurchId: string | null;
  activeChurchName: string | null;
  // Ministério/Rede ativa — SEMPRE isolada
  activeMinistryId: string | null;
  // Para Regional
  regionalChurchIds: string[];
  enterChurch: (churchId: string, churchName: string, ministryId?: string) => void;
  exitChurch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChurchId, setActiveChurchId] = useState<string | null>(null);
  const [activeChurchName, setActiveChurchName] = useState<string | null>(null);
  const [activeMinistryId, setActiveMinistryId] = useState<string | null>(null);
  const [paymentWarning, setPaymentWarning] = useState<'none' | 'yellow' | 'red'>('none');
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Recarrega a igreja ativa do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_CHURCH_KEY);
      const savedName = localStorage.getItem(ACTIVE_CHURCH_NAME_KEY);
      const savedMinistry = localStorage.getItem(ACTIVE_MINISTRY_KEY);
      if (saved) {
        setActiveChurchId(saved);
        setActiveChurchName(savedName);
        if (savedMinistry) setActiveMinistryId(savedMinistry);
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
        setActiveChurchId(null);
        setActiveChurchName(null);
        setActiveMinistryId(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ACTIVE_CHURCH_KEY);
          localStorage.removeItem(ACTIVE_CHURCH_NAME_KEY);
          localStorage.removeItem(ACTIVE_MINISTRY_KEY);
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

      const rawName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário';
      const isReg = rawName.endsWith(' [REG]');
      const isDir = rawName.endsWith(' [DIR]');
      
      const trueName = isReg ? rawName.replace(' [REG]', '') : (isDir ? rawName.replace(' [DIR]', '') : rawName);
      
      let finalRole: UserRole = isReg ? 'pastor_regional' : (isDir ? 'pastor_diretor' : ((authUser.user_metadata?.role as UserRole) || (data?.role as UserRole) || 'secretaria'));
      if (authUser.email === 'gestaozare@gmail.com') {
        finalRole = 'superadmin';
      }

      let resolvedChurchId = data?.church_id || null;
      let resolvedChurchName = 'Desconhecida';
      let resolvedMinistryId: string | null = null;

      if (!resolvedChurchId) {
        const { data: firstChurch } = await supabase
          .from('churches')
          .select('id, name, ministry_id')
          .limit(1)
          .single();
        resolvedChurchId = firstChurch?.id || null;
        if (firstChurch) {
          resolvedChurchName = firstChurch.name;
          resolvedMinistryId = firstChurch.ministry_id || null;
        }
      } else {
        const { data: userChurch } = await supabase
          .from('churches')
          .select('name, ministry_id')
          .eq('id', resolvedChurchId)
          .single();
        if (userChurch) {
          resolvedChurchName = userChurch.name;
          resolvedMinistryId = userChurch.ministry_id || null;
        }
      }

      const user: User = {
        id: authUser.id,
        name: trueName,
        email: authUser.email || '',
        role: finalRole,
        churchId: resolvedChurchId,
        churchName: resolvedChurchName,
        ministryId: resolvedMinistryId,
        regionalChurches: authUser.user_metadata?.regional_churches || [],
      };
      setCurrentUser(user);

      // --- Payment & Blocking Logic ---
      if (resolvedMinistryId && finalRole !== 'superadmin') {
        const { data: ministryData } = await supabase
          .from('ministries')
          .select('last_paid_month, force_blocked')
          .eq('id', resolvedMinistryId)
          .single();
        
        if (ministryData) {
           if (ministryData.force_blocked) {
              setIsNetworkBlocked(true);
           } else {
              const now = new Date();
              const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
              const day = now.getDate();
              
              if (ministryData.last_paid_month !== currentMonth) {
                 if (day >= 1 && day <= 5) {
                    setPaymentWarning('yellow');
                 } else if (day >= 6 && day <= 10) {
                    setPaymentWarning('red');
                 } else if (day > 10) {
                    setIsNetworkBlocked(true);
                 }
              }
           }
        }
      }
      // --------------------------------

      // Se não há church ativa no localStorage, inicializa o activeMinistryId da rede do usuário
      // (mas apenas se ainda não há um ministryId ativo salvo — para não sobrescrever a sessão do diretor)
      if (typeof window !== 'undefined') {
        const savedMinistry = localStorage.getItem(ACTIVE_MINISTRY_KEY);
        if (!savedMinistry && resolvedMinistryId) {
          setActiveMinistryId(resolvedMinistryId);
        }
      }

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
  // ministryId é obrigatório para garantir o isolamento de rede
  const enterChurch = (churchId: string, churchName: string, ministryId?: string) => {
    setActiveChurchId(churchId);
    setActiveChurchName(churchName);
    if (ministryId) {
      setActiveMinistryId(ministryId);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_CHURCH_KEY, churchId);
      localStorage.setItem(ACTIVE_CHURCH_NAME_KEY, churchName);
      if (ministryId) {
        localStorage.setItem(ACTIVE_MINISTRY_KEY, ministryId);
      }
    }
  };

  // Sai da visão da igreja e volta ao painel geral
  const exitChurch = () => {
    setActiveChurchId(null);
    setActiveChurchName(null);
    // Ao sair, restaura o ministryId nativo do usuário
    const userMinistryId = currentUser?.ministryId || null;
    setActiveMinistryId(userMinistryId);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_CHURCH_KEY);
      localStorage.removeItem(ACTIVE_CHURCH_NAME_KEY);
      if (userMinistryId) {
        localStorage.setItem(ACTIVE_MINISTRY_KEY, userMinistryId);
      } else {
        localStorage.removeItem(ACTIVE_MINISTRY_KEY);
      }
    }
  };

  // Derivações de permissão centralizadas
  const canSeeAllChurches = currentUser?.role === 'superadmin' || currentUser?.role === 'pastor_diretor';
  const isPastorRegional = currentUser?.role === 'pastor_regional';
  const regionalChurchIds = currentUser?.regionalChurches || [];
  const canSeeRelatorios = currentUser?.role !== 'kids_leader';
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
      isPastorRegional,
      canSeeRelatorios,
      canSeeFinanceiro,
      canManageSystem,
      signOut,
      activeChurchId,
      activeChurchName,
      activeMinistryId,
      regionalChurchIds,
      enterChurch,
      exitChurch,
    }}>
      {!loading && paymentWarning !== 'none' && !isNetworkBlocked && (
        <div style={{
          background: paymentWarning === 'red' ? '#e74c3c' : '#f39c12',
          color: '#fff',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '0.9rem',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          {paymentWarning === 'red' 
            ? '⚠️ ATENÇÃO: O prazo máximo para pagamento do sistema encerra dia 10. Evite o bloqueio da rede!' 
            : '⚠️ Lembrete: A fatura do sistema vence no dia 5. Regularize o pagamento para evitar o bloqueio.'}
        </div>
      )}

      {isNetworkBlocked ? (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#0f172a',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>Acesso Bloqueado</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '30px' }}>
            O acesso a esta rede foi suspenso temporariamente por pendências de pagamento.
          </p>
          <p style={{ fontSize: '0.95rem', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            Por favor, entre em contato com o administrador ou suporte técnico para regularizar a situação e restabelecer os serviços.
          </p>
          <button 
            onClick={signOut}
            style={{ marginTop: '40px', padding: '12px 24px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Sair do Sistema
          </button>
        </div>
      ) : (
        <div style={{ paddingTop: paymentWarning !== 'none' ? '44px' : '0' }}>
          {children}
        </div>
      )}
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
