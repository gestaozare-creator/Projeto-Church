"use client";

import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'superadmin' | 'pastor_diretor' | 'admin' | 'financeiro' | 'secretaria' | 'kids_leader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  churchId: string | null;
}

export const MOCK_SYSTEM_USERS: User[] = [
  {
    id: 'u1',
    name: 'Dono do Sistema (Master)',
    email: 'master@projetochurch.com',
    role: 'superadmin',
    churchId: null, // Acesso total + Gestão do SaaS
  },
  {
    id: 'u5',
    name: 'Pr. Diretor (Presidente)',
    email: 'diretor@projetochurch.com',
    role: 'pastor_diretor',
    churchId: null, // Acesso total a todas as igrejas (sem gestão do SaaS)
  },
  {
    id: 'u2',
    name: 'Pr. Local da Sede (Admin)',
    email: 'pastor.sede@projetochurch.com',
    role: 'admin',
    churchId: 'igreja_sede_01', // Vê tudo, mas só da Sede
  },
  {
    id: 'u4',
    name: 'Tesoureiro Filial SP',
    email: 'tesouraria.filial@projetochurch.com',
    role: 'financeiro',
    churchId: 'filial_sp_02', // Vê tudo, mas só da Filial SP
  },
  {
    id: 'u3',
    name: 'Secretária da Sede',
    email: 'secretaria.sede@projetochurch.com',
    role: 'secretaria',
    churchId: 'igreja_sede_01', // Vê tudo MENOS financeiro, só da Sede
  },
  {
    id: 'u6',
    name: 'Tia Rose (Líder Kids)',
    email: 'kids@projetochurch.com',
    role: 'kids_leader',
    churchId: 'igreja_sede_01', // Acesso exclusivo ao Kids
  },
];

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  usersList: User[];
  /** Pode ver todas as igrejas (filtro global liberado) */
  canSeeAllChurches: boolean;
  /** Pode ver o menu financeiro */
  canSeeFinanceiro: boolean;
  /** Pode gerenciar o sistema (criar usuários, igrejas, etc.) — EXCLUSIVO Master */
  canManageSystem: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_SYSTEM_USERS[0]);

  // Derivações de permissão centralizadas
  const canSeeAllChurches = currentUser.role === 'superadmin' || currentUser.role === 'pastor_diretor';
  const canSeeFinanceiro = currentUser.role !== 'secretaria' && currentUser.role !== 'kids_leader';
  const canManageSystem = currentUser.role === 'superadmin';

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      usersList: MOCK_SYSTEM_USERS,
      canSeeAllChurches,
      canSeeFinanceiro,
      canManageSystem,
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
