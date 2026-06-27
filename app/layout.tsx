"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AppContent({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, signOut, canSeeFinanceiro, canManageSystem } = useAuth();
  const [theme, setTheme] = useState('light');
  const [activeMenu, setActiveMenu] = useState('secretaria');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? '' : menuName);
  };

  const isPublicRoute = pathname?.startsWith('/formulario');
  const isLoginRoute = pathname === '/login';
  
  useEffect(() => {
    if ((isPublicRoute || isLoginRoute) && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isPublicRoute, isLoginRoute]);

  if (isPublicRoute || isLoginRoute) {
    return <>{children}</>;
  }

  if (loading || !currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0d0e15', color: '#fff' }}>
        Carregando...
      </div>
    );
  }

  // Badge visual do perfil
  const roleBadge: Record<string, { label: string; color: string }> = {
    superadmin: { label: '👑 MASTER', color: '#f1c40f' },
    pastor_diretor: { label: '⛪ DIRETOR', color: '#9b59b6' },
    admin: { label: '🏠 PASTOR LOCAL', color: '#3498db' },
    financeiro: { label: '💰 TESOUREIRO', color: '#2ecc71' },
    secretaria: { label: '📁 SECRETÁRIA', color: '#e67e22' },
    kids_leader: { label: '🧸 LÍDER KIDS', color: '#fd79a8' },
  };
  const badge = roleBadge[currentUser.role] || { label: currentUser.role.toUpperCase(), color: '#2ecc71' };
  
  return (
    <div className="app-container">
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <h1>Projeto Church</h1>
          <nav>
            {currentUser.role === 'kids_leader' ? (
              <div className="nav-item">
                <div className="nav-link active">🧸 Painel Kids</div>
                <div className="sub-menu">
                  <Link href="/departamentos/kids" className={`sub-link ${pathname === '/departamentos/kids' ? 'active' : ''}`}>🧸 Monitoramento Kids</Link>
                </div>
              </div>
            ) : (
              <>
                {/* SECRETARIA — visível para todos */}
                {/* SECRETARIA — Oculto para Líder Kids */}
                {currentUser.role !== 'kids_leader' && (
                  <div className="nav-item">
                    <div 
                      className={`nav-link ${activeMenu === 'secretaria' ? 'active' : ''}`} 
                    onClick={() => toggleMenu('secretaria')}
                  >
                    📁 Secretaria
                  </div>
                  {activeMenu === 'secretaria' && (
                    <div className="sub-menu">
                      <Link href="/dashboard-secretaria" className={`sub-link ${pathname === '/dashboard-secretaria' ? 'active' : ''}`}>📈 Dashboard Secretaria</Link>
                      <Link href="/" className={`sub-link ${pathname === '/' ? 'active' : ''}`}>👥 Membros</Link>
                      <Link href="/compartilhar" className={`sub-link ${pathname === '/compartilhar' ? 'active' : ''}`} style={{ paddingLeft: '28px', fontSize: '0.82rem' }}>📋 Cadastro Online</Link>
                      <Link href="/mapeamento" className={`sub-link ${pathname === '/mapeamento' ? 'active' : ''}`}>🗺️ Mapeamento</Link>
                      <Link href="/visitantes" className={`sub-link ${pathname === '/visitantes' ? 'active' : ''}`}>👋 Visitantes</Link>
                      <Link href="/ranking" className={`sub-link ${pathname === '/ranking' ? 'active' : ''}`}>🏆 Ranking Almas</Link>
                      <Link href="/agenda" className={`sub-link ${pathname === '/agenda' ? 'active' : ''}`}>📅 Agenda</Link>
                      <Link href="/eventos" className={`sub-link ${pathname === '/eventos' ? 'active' : ''}`}>🎟️ Eventos</Link>
                    </div>
                    </div>
                  )}
                </div>
                )}

                {/* FINANCEIRO — oculto APENAS para secretária e Líder Kids */}
                {canSeeFinanceiro && (
                  <div className="nav-item">
                    <div 
                      className={`nav-link ${activeMenu === 'financeiro' ? 'active' : ''}`} 
                      onClick={() => toggleMenu('financeiro')}
                    >
                      💰 Financeiro
                    </div>
                    {activeMenu === 'financeiro' && (
                      <div className="sub-menu">
                        <Link href="/financeiro" className={`sub-link ${pathname === '/financeiro' ? 'active' : ''}`}>📈 Dashboard Financeiro</Link>
                        <Link href="/financeiro/receber" className={`sub-link ${pathname?.startsWith('/financeiro/receber') ? 'active' : ''}`}>💵 Contas a Receber</Link>
                        <Link href="/financeiro/pagar" className={`sub-link ${pathname?.startsWith('/financeiro/pagar') ? 'active' : ''}`}>📉 Contas a Pagar</Link>
                        <Link href="/financeiro/patrimonio" className={`sub-link ${pathname?.startsWith('/financeiro/patrimonio') ? 'active' : ''}`}>🪑 Gestão de Patrimônio</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* DEPARTAMENTOS — Oculto para Secretaria */}
                {currentUser.role !== 'secretaria' && (
                  <div className="nav-item">
                  <div 
                    className={`nav-link ${activeMenu === 'departamentos' ? 'active' : ''}`} 
                    onClick={() => toggleMenu('departamentos')}
                  >
                    🏢 Departamentos
                  </div>
                  {activeMenu === 'departamentos' && (
                    <div className="sub-menu">
                       <Link href="/departamentos/louvor" className={`sub-link ${pathname?.startsWith('/departamentos/louvor') ? 'active' : ''}`}>🎵 Louvor</Link>
                       <Link href="/departamentos/midia" className={`sub-link ${pathname?.startsWith('/departamentos/midia') ? 'active' : ''}`}>🎥 Mídia</Link>
                       <Link href="/departamentos/obreiros" className={`sub-link ${pathname?.startsWith('/departamentos/obreiros') ? 'active' : ''}`}>🛡️ Obreiros</Link>
                       <Link href="/departamentos/kids" className={`sub-link ${pathname?.startsWith('/departamentos/kids') ? 'active' : ''}`}>🧸 Infantil (Kids)</Link>
                    </div>
                  )}
                </div>
                )}

                {/* ADMINISTRAÇÃO — EXCLUSIVO DO MASTER */}
                {canManageSystem && (
                  <div className="nav-item">
                    <div 
                      className={`nav-link ${activeMenu === 'admin' ? 'active' : ''}`} 
                      onClick={() => toggleMenu('admin')}
                    >
                      ⚙️ Administração
                    </div>
                    {activeMenu === 'admin' && (
                      <div className="sub-menu">
                        <Link href="/admin/usuarios" className={`sub-link ${pathname === '/admin/usuarios' ? 'active' : ''}`}>👤 Gestão de Usuários</Link>
                        <Link href="/admin/igrejas" className={`sub-link ${pathname === '/admin/igrejas' ? 'active' : ''}`}>⛪ Gestão de Igrejas</Link>
                        <Link href="/admin/controle" className={`sub-link ${pathname === '/admin/controle' ? 'active' : ''}`}>🔧 Opções de Controle</Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>
        </div>

        {/* MOCK LOGIN WIDGET */}
        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginTop: '6px', fontSize: '0.65rem', color: badge.color, fontWeight: 'bold' }}>
            {badge.label}
          </div>
          {currentUser.churchId && (
            <div style={{ marginTop: '2px', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
              Igreja: {currentUser.churchId === 'igreja_sede_01' ? 'Sede' : 'Filial SP'}
            </div>
          )}
          <button onClick={signOut} className="glass-button" style={{ marginTop: 'auto', marginBottom: '20px', marginLeft: '20px', marginRight: '20px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
            Sair (Logout)
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            <h2>Visão Geral</h2>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
          </button>
        </header>
        {currentUser.role === 'kids_leader' && pathname !== '/departamentos/kids' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px', textAlign: 'center', padding: '20px' }} className="glass">
            <div style={{ fontSize: '3rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.2rem', color: '#fd79a8' }}>Acesso Restrito ao Departamento Kids</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
              Seu perfil de usuário possui permissão de acesso exclusiva para gerenciar o Ministério Infantil (Kids).
            </p>
            <Link href="/departamentos/kids" style={{ background: 'var(--primary-color)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Acessar Painel Kids
            </Link>
          </div>
        ) : children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Projeto Church — Gestão de Igrejas</title>
        <meta name="description" content="Plataforma SaaS de gestão multi-tenant para igrejas." />
      </head>
      <body>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
