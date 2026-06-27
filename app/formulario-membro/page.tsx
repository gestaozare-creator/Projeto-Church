"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FormularioMembro() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', churchId: '1' });

  const churches = [
    { id: '1', name: 'Sede - Centro', uuid: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
    { id: '2', name: 'Filial - Zona Sul', uuid: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' },
    { id: '3', name: 'Filial - Campinas', uuid: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' }
  ];

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedChurch = churches.find(c => c.id === form.churchId);
    const churchUuid = selectedChurch ? selectedChurch.uuid : 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

    const { error } = await supabase
      .from('members')
      .insert({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        address: form.address,
        function: 'Ainda não definida',
        ministry: '',
        status: 'pendente', // pendente = aguardando aprovação
        church_id: churchUuid
      });

    if (error) {
      alert('Erro ao enviar dados de cadastro para o servidor: ' + error.message);
      return;
    }

    setStep('success');
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd',
    fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", outline: 'none',
    transition: 'border 0.2s', background: '#fafafa'
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
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 35px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', letterSpacing: '1px', marginBottom: '4px' }}>CHURCHFLOW</div>
          <h2 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '6px' }}>📋 Cadastro de Membro</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Preencha seus dados para se cadastrar na igreja</p>
        </div>

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

          <div>
            <label style={labelStyle}>Igreja / Congregação *</label>
            <select name="churchId" value={form.churchId} onChange={onChange} style={fieldStyle} required>
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

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
      </div>
    </div>
  );
}
