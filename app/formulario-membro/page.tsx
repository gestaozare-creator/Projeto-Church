"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FormularioMembro() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(true);
  
  const [form, setForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    address: '', 
    churchId: '' 
  });

  const [isLocked, setIsLocked] = useState(false);

  // Carrega as igrejas reais do banco de dados em tempo real
  useEffect(() => {
    async function loadChurches() {
      const { data, error } = await supabase
        .from('churches')
        .select('id, name');
      
      if (!error && data) {
        setChurches(data);
        
        // Verifica se há o parâmetro ?church=ID na URL
        const params = new URLSearchParams(window.location.search);
        const churchParam = params.get('church');
        
        if (churchParam) {
          const exists = data.find(c => c.id === churchParam);
          if (exists) {
            setForm(prev => ({ ...prev, churchId: churchParam }));
            setIsLocked(true);
          } else if (data.length > 0) {
            setForm(prev => ({ ...prev, churchId: data[0].id }));
          }
        } else if (data.length > 0) {
          setForm(prev => ({ ...prev, churchId: data[0].id }));
        }
      }
      setLoadingChurches(false);
    }
    loadChurches();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.churchId) {
      alert('Nenhuma igreja selecionada ou disponível.');
      return;
    }

    const { error } = await supabase
      .from('members')
      .insert({
        id: 'm_' + Date.now().toString(), // Mapeamento correto de ID único
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        address: form.address,
        function: 'Membro',
        ministry: '',
        status: 'pendente', // Aguardando aprovação
        church_id: form.churchId,
        integration_date: new Date().toISOString().split('T')[0] // Define data padrão do cadastro
      });

    if (error) {
      alert('Erro ao enviar dados de cadastro: ' + error.message);
      return;
    }

    setStep('success');
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd',
    fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", outline: 'none',
    transition: 'border 0.2s', background: '#fafafa', boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '5px'
  };

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '50px 40px', maxWidth: '460px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🎉</div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '8px' }}>Cadastro Recebido!</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
            Seu cadastro foi enviado com sucesso e está <strong style={{ color: '#f39c12' }}>aguardando aprovação</strong> pela secretaria da igreja.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>A secretaria vai definir seu ministério e função. Você será contatado em breve. Deus abençoe! 🙏</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 35px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', letterSpacing: '1px', marginBottom: '4px' }}>CHURCHFLOW</div>
          <h2 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '6px' }}>📋 Cadastro de Membro</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Preencha seus dados para se cadastrar na igreja</p>
        </div>

        {loadingChurches ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Carregando congregações...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Nome Completo *</label>
              <input type="text" name="name" value={form.name} onChange={onChange} placeholder="Seu nome completo" style={fieldStyle} required />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Telefone (WhatsApp) *</label>
                <input type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="(00) 00000-0000" style={fieldStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" name="email" value={form.email} onChange={onChange} placeholder="seu@email.com" style={fieldStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Endereço *</label>
              <input type="text" name="address" value={form.address} onChange={onChange} placeholder="Bairro, Cidade" style={fieldStyle} required />
            </div>

            {!isLocked ? (
              <div>
                <label style={labelStyle}>Igreja / Congregação *</label>
                <select name="churchId" value={form.churchId} onChange={onChange} style={fieldStyle} required>
                  {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.85rem', color: '#475569' }}>
                <strong>Igreja / Congregação:</strong> {churches.find(c => c.id === form.churchId)?.name}
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
              ℹ️ Após aprovação, a secretaria da igreja definirá seu <strong>ministério</strong> e <strong>função</strong>.
            </div>

            <button type="submit" style={{
              marginTop: '4px', padding: '14px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
              fontSize: '1rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px',
              boxShadow: '0 4px 15px rgba(59,130,246,0.4)', transition: 'transform 0.2s'
            }}>
              Enviar Cadastro
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
              Seu cadastro ficará pendente até a aprovação pela secretaria.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
