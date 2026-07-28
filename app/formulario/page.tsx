"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FormularioVisitante() {
  const [step, setStep] = useState<'form' | 'visit' | 'success'>('form');
  const [churches, setChurches] = useState<any[]>([]);
  const [services, setServices] = useState<{ id: string; church_id: string; name: string; day_of_week: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    region: '',
    howKnew: '',
    wantsVisit: '',
    address: '',
    churchId: '',
    cultoName: '', // Armazenará o nome do culto selecionado (ex: Culto do Milagre)
    horarioSelected: '' // Armazenará o dia e horário selecionado (ex: Quinta-feira às 15:00)
  });

  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega as igrejas e os cultos do banco de dados
  useEffect(() => {
    async function loadData() {
      const { data: churchesData } = await supabase.from('churches').select('*');
      const { data: ministriesData } = await supabase.from('ministries').select('*');
      const { data: servicesDb } = await supabase.from('church_services').select('*');
      
      let churchesDb = null;
      if (churchesData) {
        churchesDb = churchesData.map(c => ({
          ...c,
          ministries: ministriesData?.find(m => m.id === c.ministry_id) || null
        }));
      }
      
      if (churchesDb) {
        setChurches(churchesDb);
        
        // Verifica se há o parâmetro ?church=ID na URL
        const params = new URLSearchParams(window.location.search);
        const churchParam = params.get('church');
        
        if (churchParam) {
          const exists = churchesDb.find(c => c.id === churchParam);
          if (exists) {
            setForm(prev => ({ ...prev, churchId: churchParam }));
            setIsLocked(true);
          } else if (churchesDb.length > 0) {
            setForm(prev => ({ ...prev, churchId: churchesDb[0].id }));
          }
        } else if (churchesDb.length > 0) {
          setForm(prev => ({ ...prev, churchId: churchesDb[0].id }));
        }
      }

      if (servicesDb) {
        setServices(servicesDb);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Filtra os cultos disponíveis para a igreja selecionada
  const availableServices = useMemo(() => {
    return services.filter(s => s.church_id === form.churchId);
  }, [services, form.churchId]);

  // Lista dinâmica de nomes de cultos únicos da igreja selecionada
  const uniqueCultoNames = useMemo(() => {
    const names = new Set(availableServices.map(s => s.name));
    return Array.from(names).sort();
  }, [availableServices]);

  // Filtra os horários disponíveis para o nome do culto selecionado
  const availableHorarios = useMemo(() => {
    if (!form.cultoName) return [];
    return availableServices.filter(s => s.name === form.cultoName).map(s => `${s.day_of_week} às ${s.time}`);
  }, [availableServices, form.cultoName]);

  // Sincroniza o primeiro nome de culto e o primeiro horário caso a igreja mude
  useEffect(() => {
    if (uniqueCultoNames.length > 0) {
      setForm(prev => ({ ...prev, cultoName: uniqueCultoNames[0] }));
    } else {
      setForm(prev => ({ ...prev, cultoName: '', horarioSelected: '' }));
    }
  }, [uniqueCultoNames]);

  // Sincroniza o primeiro horário quando o nome do culto mudar
  useEffect(() => {
    if (availableHorarios.length > 0) {
      setForm(prev => ({ ...prev, horarioSelected: availableHorarios[0] }));
    } else {
      setForm(prev => ({ ...prev, horarioSelected: '' }));
    }
  }, [availableHorarios]);

  const saveVisitorToDb = async (finalForm: typeof form) => {
    if (!finalForm.churchId) {
      alert('Nenhuma igreja selecionada ou disponível.');
      return false;
    }

    const cleanPhone = finalForm.phone ? finalForm.phone.replace(/\D/g, '') : '';
    
    const targetChurch = churches.find((c: any) => c.id === finalForm.churchId);
    if (!targetChurch) return false;
    const validChurchIds = churches.filter((c: any) => c.ministry_id === targetChurch.ministry_id).map((c: any) => c.id);

    if (cleanPhone) {
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('phone', cleanPhone)
        .in('church_id', validChurchIds)
        .limit(1);
        
      if (existing && existing.length > 0) {
        alert('Este número de WhatsApp já está cadastrado no sistema.');
        return false;
      }
    }

    const { error } = await supabase
      .from('members')
      .insert({
        id: 'm_' + Date.now().toString(),
        name: finalForm.name,
        phone: cleanPhone,
        state: finalForm.region,
        ministry: finalForm.howKnew,
        function: 'Visitante',
        status: 'pendente',
        address: finalForm.address || '',
        church_id: finalForm.churchId,
        culto: finalForm.cultoName, // Salva o nome do culto escolhido
        horario: finalForm.horarioSelected, // Salva o dia/horário escolhido
        integration_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      alert('Erro ao enviar dados para o servidor: ' + error.message);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wantsVisit) {
      alert('Por favor, responda se deseja receber uma visita (Sim ou Não).');
      return;
    }
    if (form.wantsVisit === 'sim' && !form.address) {
      setStep('visit');
      return;
    }
    
    setIsSubmitting(true);
    const success = await saveVisitorToDb(form);
    setIsSubmitting(false);
    
    if (success) {
      setStep('success');
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await saveVisitorToDb(form);
    setIsSubmitting(false);
    
    if (success) {
      setStep('success');
    }
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

  const activeChurch = churches.find(c => c.id === form.churchId);
  const activeLogo = activeChurch?.cover_photo_url || activeChurch?.logo_url || activeChurch?.ministries?.logo_url;
  const activeMinistryName = activeChurch?.ministries?.name;
  
  let themeColor = '#1e293b';
  let themeColorLight = '#0f172a';
  try {
    if (activeChurch?.config) {
      const conf = typeof activeChurch.config === 'string' ? JSON.parse(activeChurch.config) : activeChurch.config;
      if (conf.theme_color) {
        themeColor = conf.theme_color;
        themeColorLight = conf.theme_color + 'dd'; // slight transparency or variation
      }
    }
  } catch(e) {}

  return (
    <div style={{ minHeight: '100vh', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${themeColorLight} 0%, ${themeColor} 100%)`, padding: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {activeLogo && (
            <img src={activeLogo} alt="Logo da Igreja" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '15px' }} />
          )}
          <h1 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '5px' }}>Ficha de Visitante - {activeMinistryName || 'Geral'}</h1>
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '5px' }}>Igreja - <strong>{activeChurch?.name}</strong></p>
          <div style={{ width: '50px', height: '3px', background: '#3b82f6', margin: '10px auto 15px', borderRadius: '2px' }}></div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Carregando opções...</div>
        ) : step === 'form' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.9rem', color: '#475569', marginBottom: '10px' }}>
              <strong>Igreja que Visita:</strong> {churches.find(c => c.id === form.churchId)?.name}
            </div>

            {/* Seleção do Culto e Horário Manuais */}
            {uniqueCultoNames.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Culto da Visita *</label>
                  <select 
                    name="cultoName" value={form.cultoName} onChange={handleChange} required
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
                  >
                    {uniqueCultoNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                {availableHorarios.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Horário do Culto *</label>
                    <select 
                      name="horarioSelected" value={form.horarioSelected} onChange={handleChange} required
                      style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
                    >
                      {availableHorarios.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Nome Completo *</label>
              <input 
                type="text" name="name" value={form.name} onChange={handleChange} required
                placeholder="Digite seu nome completo"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Telefone (WhatsApp) *</label>
              <input 
                type="tel" name="phone" value={form.phone} onChange={handleChange} required
                placeholder="(11) 99999-9999"
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Região / Bairro *</label>
              <input 
                type="text" name="region" value={form.region} onChange={handleChange} required
                placeholder="Ex: Zona Sul, Bela Vista..."
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Como conheceu a igreja? *</label>
              <select 
                name="howKnew" value={form.howKnew} onChange={handleChange} required
                style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">Selecione...</option>
                <option value="Amigos / Parentes">Amigos / Parentes</option>
                <option value="Convite de amigo">Convite de amigo</option>
                <option value="Convite especial">Convite especial</option>
                <option value="Evangelismo">Evangelismo</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Passou em frente">Passou em frente</option>
                <option value="Rádio">Rádio</option>
                <option value="Redes Sociais">Redes Sociais</option>
                <option value="Youtube">Youtube</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: '#0f172a' }}>Deseja receber uma visita? *</label>
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

            <button type="submit" style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Ficha'}
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
