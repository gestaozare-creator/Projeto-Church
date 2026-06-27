"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FormularioVisitante() {
  const [step, setStep] = useState<'form' | 'visit' | 'success'>('form');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    region: '',
    howKnew: '',
    wantsVisit: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveVisitorToDb = async (finalForm: typeof form) => {
    // Cadastrar visitante como membro com status 'pendente' e função 'Visitante'
    // id da igreja padrão: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
    const { error } = await supabase
      .from('members')
      .insert({
        name: finalForm.name,
        phone: finalForm.phone,
        state: finalForm.region,
        ministry: finalForm.howKnew,
        function: 'Visitante',
        status: 'pendente', // pendente = visitante no fluxo do app
        address: finalForm.address || '',
        church_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
      });

    if (error) {
      alert('Erro ao enviar dados para o servidor: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.wantsVisit === 'sim' && !form.address) {
      setStep('visit');
      return;
    }
    await saveVisitorToDb(form);
    setStep('success');
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveVisitorToDb(form);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '50px 40px',
          textAlign: 'center',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '10px' }}>Obrigado pela sua visita!</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6' }}>
            Seus dados foram registrados com sucesso. Estamos felizes em tê-lo(a) conosco!
          </p>
          {form.wantsVisit === 'sim' && (
            <p style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: '15px' }}>
              ✅ Sua visita será agendada em breve!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '5px' }}>ChurchFlow</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Ficha de Visitante</p>
          <div style={{ width: '50px', height: '3px', background: '#3b82f6', margin: '15px auto 0', borderRadius: '2px' }}></div>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Nome Completo</label>
              <input 
                type="text" name="name" value={form.name} onChange={handleChange} required
                placeholder="Digite seu nome completo"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Telefone (WhatsApp)</label>
              <input 
                type="tel" name="phone" value={form.phone} onChange={handleChange} required
                placeholder="(11) 99999-9999"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Região / Bairro</label>
              <input 
                type="text" name="region" value={form.region} onChange={handleChange} required
                placeholder="Ex: Zona Sul, Bela Vista..."
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Como conheceu a igreja?</label>
              <select 
                name="howKnew" value={form.howKnew} onChange={handleChange} required
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">Selecione...</option>
                <option value="Redes Sociais">Redes Sociais</option>
                <option value="Convite de Amigo">Convite de Amigo</option>
                <option value="Passou na Frente">Passou na Frente</option>
                <option value="Eventos">Eventos</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '10px', color: '#0f172a' }}>Deseja receber uma visita?</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{
                  flex: 1, padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                  border: form.wantsVisit === 'sim' ? '2px solid #2ecc71' : '1px solid #e2e8f0',
                  backgroundColor: form.wantsVisit === 'sim' ? 'rgba(46, 204, 113, 0.08)' : '#fff',
                  fontWeight: '600', fontSize: '0.95rem', color: form.wantsVisit === 'sim' ? '#2ecc71' : '#64748b',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="wantsVisit" value="sim" checked={form.wantsVisit === 'sim'} onChange={handleChange} style={{ display: 'none' }} />
                  ✅ Sim
                </label>
                <label style={{
                  flex: 1, padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                  border: form.wantsVisit === 'nao' ? '2px solid #e74c3c' : '1px solid #e2e8f0',
                  backgroundColor: form.wantsVisit === 'nao' ? 'rgba(231, 76, 60, 0.08)' : '#fff',
                  fontWeight: '600', fontSize: '0.95rem', color: form.wantsVisit === 'nao' ? '#e74c3c' : '#64748b',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="wantsVisit" value="nao" checked={form.wantsVisit === 'nao'} onChange={handleChange} style={{ display: 'none' }} />
                  ❌ Não
                </label>
              </div>
            </div>

            <button type="submit" style={{
              marginTop: '10px', padding: '14px', borderRadius: '10px', border: 'none',
              backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '1.05rem',
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)'
            }}>
              Enviar Ficha
            </button>
          </form>
        )}

        {step === 'visit' && (
          <form onSubmit={handleVisitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'rgba(46, 204, 113, 0.08)', borderRadius: '12px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
              <p style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1rem' }}>🏠 Que bom que deseja uma visita!</p>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '5px' }}>Por favor, informe seu endereço completo.</p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Endereço Completo</label>
              <input 
                type="text" name="address" value={form.address} onChange={handleChange} required
                placeholder="Rua, Número, Bairro, Cidade"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" style={{
              marginTop: '10px', padding: '14px', borderRadius: '10px', border: 'none',
              backgroundColor: '#2ecc71', color: '#fff', fontWeight: 'bold', fontSize: '1.05rem',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)'
            }}>
              ✅ Confirmar e Agendar Visita
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '25px' }}>
          Powered by ChurchFlow — Seus dados estão protegidos.
        </p>
      </div>
    </div>
  );
}
