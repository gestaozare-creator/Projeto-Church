"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      /* Imagem de fundo de uma igreja / adoração de alta qualidade, com um overlay escuro */
      background: 'linear-gradient(rgba(13, 14, 21, 0.8), rgba(13, 14, 21, 0.9)), url("https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2000&auto=format&fit=crop") center/cover no-repeat',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        borderRadius: '24px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(20, 25, 40, 0.5)'
      }}>
        
        {/* Lado Esquerdo - Branding (Visível apenas em telas maiores) */}
        <div style={{
          flex: 1,
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(46, 204, 113, 0.05))',
          borderRight: '1px solid rgba(255,255,255,0.05)'
        }} className="hidden md:flex">
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #3498db, #2ecc71)', borderRadius: '20px', margin: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 10px 20px rgba(52, 152, 219, 0.3)' }}>
            ⛪
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Gestão<br/>Church
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            O sistema inteligente e definitivo para a administração da sua igreja. Tenha o controle total em suas mãos.
          </p>
        </div>

        {/* Lado Direito - Formulário */}
        <div style={{
          flex: 1,
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(10, 12, 20, 0.7)'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              Bem-vindo de volta
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Faça login para acessar o painel de controle.
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(231,76,60,0.15)', color: '#e74c3c', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid rgba(231,76,60,0.3)' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3498db'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Senha
                </label>
                <a href="#" style={{ fontSize: '0.8rem', color: '#3498db', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#2980b9'} onMouseOut={e => e.currentTarget.style.color = '#3498db'}>
                  Esqueceu a senha?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 48px 16px 48px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3498db'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.color = '#fff'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                border: 'none',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={e => {
                if(!loading) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(52, 152, 219, 0.4)';
                }
              }}
              onMouseOut={e => {
                if(!loading) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(52, 152, 219, 0.3)';
                }
              }}
            >
              {loading ? 'Autenticando...' : (
                <>
                  Acessar Painel <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
