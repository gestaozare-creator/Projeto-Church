"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FormularioVisitante() {
  const [step, setStep] = useState<'form' | 'visit' | 'success'>('form');
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(true);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    region: '',
    howKnew: '',
    wantsVisit: '',
    address: '',
    churchId: ''
  });

  // Carrega as igrejas reais do banco de dados
  useEffect(() => {
    async function loadChurches() {
      const { data, error } = await supabase
        .from('churches')
        .select('id, name')
        .eq('status', 'ativa');
      
      if (!error && data) {
        setChurches(data);
        if (data.length > 0) {
          setForm(prev => ({ ...prev, churchId: data[0].id }));
        }
      }
      setLoadingChurches(false);
    }
    loadChurches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveVisitorToDb = async (finalForm: typeof form) => {
    if (!finalForm.churchId) {
      alert('Nenhuma igreja selecionada ou disponível.');
      return;
    }

    const { error } = await supabase
      .from('members')
      .insert({
        name: finalForm.name,
        phone: finalForm.phone,
        state: finalForm.region,
        ministry: finalForm.howKnew,
        function: 'Visitante',
        status: 'pendente', // Pendente de aprovação (fluxo de visitantes)
        address: finalForm.address || '',
        church_id: finalForm.churchId
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '50px 40px', textAlign: 'center', maxWidth: '450px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '10px' }}>Obrigado pela sua visita!</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6' }}>Seus dados foram registrados com sucesso. Estamos felizes em tê-lo(a) conosco!</p>
          {form.wantsVisit === 'sim' && (
            <p style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: '15px' }}>✅ Sua visita será agendada em breve!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '40px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '5px' }}>ChurchFlow</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Ficha de Visitante</p>
          <div style={{ width: '50px', height: '3px', background: '#3b82f6', margin: '15px auto 0', borderRadius: '2px' }}></div>
        </div>

        {loadingChurches ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Carregando opções...</div>
        ) : step === 'form' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Igreja / Congregação que Visita *</label>
              <select 
                name="churchId" value={form.churchId} onChange={handleChange} required
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

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
                <option value="Amigos / Parentes">Amigos / Parentes</option>
                <option value="Redes Sociais">Redes Sociais</option>
                <option value="Passou em frente">Passou em frente</option>
                <option value="Convite especial">Convite especial</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Deseja receber uma visita?</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', background: form.wantsVisit === 'sim' ? '#ebf5ff' : '#fff', borderColor: form.wantsVisit === 'sim' ? '#3b82f6' : '#e2e8f0', fontWeight: '600', fontSize: '0.95rem' }}>
                  <input type="radio" name="wantsVisit" value="sim" checked={form.wantsVisit === 'sim'} onChange={handleChange} style={{ display: 'none' }} />
                  <span style={{ color: form.wantsVisit === 'sim' ? '#2563eb' : '#64748b' }}>✅ Sim</span>
                </label>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', background: form.wantsVisit === 'nao' ? '#fef2f2' : '#fff', borderColor: form.wantsVisit === 'nao' ? '#ef4444' : '#e2e8f0', fontWeight: '600', fontSize: '0.95rem' }}>
                  <input type="radio" name="wantsVisit" value="nao" checked={form.wantsVisit === 'nao'} onChange={handleChange} style={{ display: 'none' }} />
                  <span style={{ color: form.wantsVisit === 'nao' ? '#dc2626' : '#64748b' }}>❌ Não</span>
                </label>
              </div>
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', marginTop: '10px' }}>
              Enviar Ficha
            </button>
          </form>
        ) : (
          <form onSubmit={handleVisitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              Como você deseja receber uma visita, por favor informe o seu endereço completo:
            </p>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Endereço Completo *</label>
              <textarea 
                name="address" value={form.address} onChange={handleChange} required rows={3}
                placeholder="Rua, Número, Complemento, Bairro e Cidade"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setStep('form')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>
                Voltar
              </button>
              <button type="submit" style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(46,204,113,0.3)' }}>
                Finalizar Cadastro
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
