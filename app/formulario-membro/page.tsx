"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const MaskedDateInput = ({ name, value, onChange, required, style }: any) => {
  const [displayValue, setDisplayValue] = useState('');
  
  useEffect(() => {
    if (value && value.includes('-')) {
       const parts = value.split('-');
       if (parts.length === 3) {
         setDisplayValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
       } else {
         setDisplayValue(value);
       }
    } else {
       setDisplayValue('');
    }
  }, [value]);

  const handleDisplayChange = (e: any) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);
    let formatted = raw;
    if (raw.length > 2) formatted = raw.slice(0, 2) + '/' + raw.slice(2);
    if (raw.length > 4) formatted = formatted.slice(0, 5) + '/' + raw.slice(4);
    
    setDisplayValue(formatted);
    
    if (raw.length === 8) {
       const d = raw.slice(0, 2);
       const m = raw.slice(2, 4);
       const y = raw.slice(4, 8);
       onChange({ target: { name, value: `${y}-${m}-${d}` }});
    } else if (raw.length === 0) {
       onChange({ target: { name, value: '' }});
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="tel" 
        placeholder="DD/MM/AAAA"
        value={displayValue} 
        onChange={handleDisplayChange} 
        style={{ ...style, paddingRight: '40px', boxSizing: 'border-box' }} 
        required={required}
        maxLength={10}
      />
      <input
        type="date"
        name={name}
        value={value || ''}
        onChange={onChange}
        style={{ position: 'absolute', right: '0px', top: '0', opacity: 0, width: '40px', height: '100%', cursor: 'pointer', zIndex: 2 }}
      />
      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '1.1rem', zIndex: 1, opacity: 0.8 }}>📅</span>
    </div>
  );
};

export default function FormularioMembro() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [churches, setChurches] = useState<any[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(true);
  
  const [form, setForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    address: '', 
    churchId: '',
    birth_date: '',
    marital_status: '',
    employment_status: '',
    profession: '',
    is_baptized: '',
    baptism_date: ''
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customProfession, setCustomProfession] = useState('');

  const [isLocked, setIsLocked] = useState(false);

  // Carrega as igrejas reais do banco de dados em tempo real
  useEffect(() => {
    async function loadChurches() {
      const { data: churchesData, error } = await supabase.from('churches').select('*');
      const { data: ministriesData } = await supabase.from('ministries').select('*');
      
      if (!error && churchesData) {
        const mappedChurches = churchesData.map(c => ({
          ...c,
          ministries: ministriesData?.find(m => m.id === c.ministry_id) || null
        }));
        
        setChurches(mappedChurches);
        
        // Verifica se há o parâmetro ?church=ID na URL
        const params = new URLSearchParams(window.location.search);
        const churchParam = params.get('church');
        
        if (churchParam) {
          const exists = mappedChurches.find(c => c.id === churchParam);
          if (exists) {
            setForm(prev => ({ ...prev, churchId: churchParam }));
            setIsLocked(true);
          } else if (mappedChurches.length > 0) {
            setForm(prev => ({ ...prev, churchId: mappedChurches[0].id }));
          }
        } else if (mappedChurches.length > 0) {
          setForm(prev => ({ ...prev, churchId: mappedChurches[0].id }));
        }
      }
      setLoadingChurches(false);
    }
    loadChurches();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB.');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.churchId) {
      alert('Nenhuma igreja selecionada ou disponível.');
      return;
    }
    
    setIsSubmitting(true);

    const cleanPhone = form.phone ? form.phone.replace(/\D/g, '') : '';
      
    const targetChurch = churches.find((c: any) => c.id === form.churchId);
    if (!targetChurch) return;
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
        setIsSubmitting(false);
        return;
      }
    }

    let photo_url = null;

    try {
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `members/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile);

        if (uploadError) {
          throw new Error('Erro ao fazer upload da foto: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        photo_url = publicUrlData.publicUrl;
      }

      const insertPayload: any = {
        id: 'm_' + Date.now().toString(),
        name: form.name,
        phone: cleanPhone,
        email: form.email || null,
        address: form.address,
        function: 'Membro',
        ministry: '',
        status: 'aguardando_aprovacao',
        church_id: form.churchId,
        integration_date: new Date().toISOString().split('T')[0],
        photo_url: photo_url,
        birth_date: form.birth_date || null,
        marital_status: form.marital_status || null,
        employment_status: form.employment_status || null,
        profession: form.profession === 'Outra' ? customProfession : (form.profession || null),
        is_baptized: form.is_baptized || null,
        baptism_date: form.is_baptized === 'Sim' ? (form.baptism_date || null) : null
      };

      let { error } = await supabase
        .from('members')
        .insert(insertPayload);

      if (error && (error.message?.includes('baptism_date') || error.message?.includes('is_baptized') || error.message?.includes('column'))) {
        delete insertPayload.is_baptized;
        delete insertPayload.baptism_date;
        const retryRes = await supabase.from('members').insert(insertPayload);
        error = retryRes.error;
      }

      if (error) {
        throw error;
      }

      setStep('success');
    } catch (err: any) {
      alert('Erro ao enviar dados de cadastro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
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
      <div style={{ minHeight: '100vh', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', fontFamily: "'Inter', sans-serif" }}>
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

  const activeChurch = churches.find(c => c.id === form.churchId);
  const activeLogo = activeChurch?.cover_photo_url || activeChurch?.logo_url || activeChurch?.ministries?.logo_url;
  const activeMinistryName = activeChurch?.ministries?.name;
  
  let themeColor = '#1e3a5f';
  let themeColorLight = '#0f172a';
  
  let formConfig: any = {
    addressRequired: false,
    birthDateRequired: true,
    maritalStatusRequired: true,
    isBaptizedRequired: true,
    employmentStatusRequired: false,
    professionRequired: false
  };

  try {
    if (activeChurch) {
      const hqChurch = churches.find((c: any) => c.ministry_id === activeChurch.ministry_id && c.is_headquarters) || activeChurch;
      if (hqChurch?.config) {
        const conf = typeof hqChurch.config === 'string' ? JSON.parse(hqChurch.config) : hqChurch.config;
        if (conf.theme_color) {
          themeColor = conf.theme_color;
          themeColorLight = conf.theme_color + 'dd';
        }
        if (conf.formConfig) {
          formConfig = { ...formConfig, ...conf.formConfig };
        }
      }
    }
  } catch(e) {}

  return (
    <div style={{ minHeight: '100vh', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${themeColorLight}, ${themeColor})`, fontFamily: "'Inter', sans-serif", padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '35px 25px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          {activeLogo && (
            <img src={activeLogo} alt="Logo da Igreja" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '15px' }} />
          )}
          <h2 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '4px' }}>Cadastro de Membro - {activeMinistryName || 'Geral'}</h2>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '6px' }}>Igreja - <strong>{activeChurch?.name}</strong></p>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Preencha seus dados para se cadastrar na igreja</p>
        </div>

        {loadingChurches ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Carregando congregações...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* INSTRUÇÕES E UPLOAD DA FOTO */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>📷 Foto de Perfil (Para Carteirinha)</label>
              
              <ul style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, paddingLeft: '20px', lineHeight: '1.4' }}>
                <li>Tire uma foto bem iluminada do seu rosto.</li>
                <li>Evite usar óculos escuros, bonés ou chapéus.</li>
                <li>Prefira fundos neutros (como uma parede branca).</li>
                <li>Formatos aceitos: JPG ou PNG (Máx 5MB).</li>
              </ul>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '12px', 
                  background: photoPreview ? `url(${photoPreview}) center/cover` : '#e2e8f0', 
                  border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {!photoPreview && <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>👤</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={handlePhotoChange} 
                    style={{ fontSize: '0.8rem', width: '100%' }} 
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nome Completo *</label>
              <input type="text" name="name" value={form.name} onChange={onChange} placeholder="Seu nome completo" style={fieldStyle} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Telefone (WhatsApp) *</label>
                <input type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="(00) 00000-0000" style={fieldStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" name="email" value={form.email} onChange={onChange} placeholder="seu@email.com" style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Data de Nascimento {formConfig.birthDateRequired ? '*' : ''}</label>
                <MaskedDateInput name="birth_date" value={form.birth_date} onChange={onChange} style={fieldStyle} required={formConfig.birthDateRequired} />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Estado Civil {formConfig.maritalStatusRequired ? '*' : ''}</label>
                <select name="marital_status" value={form.marital_status} onChange={onChange} style={fieldStyle} required={formConfig.maritalStatusRequired}>
                  <option value="">Selecione...</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>É Batizado(a) nas Águas? {formConfig.isBaptizedRequired ? '*' : ''}</label>
                <select name="is_baptized" value={form.is_baptized} onChange={onChange} style={fieldStyle} required={formConfig.isBaptizedRequired}>
                  <option value="">Selecione...</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              {form.is_baptized === 'Sim' && (
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Data do Batismo {formConfig.isBaptizedRequired ? '*' : ''}</label>
                  <MaskedDateInput name="baptism_date" value={form.baptism_date} onChange={onChange} style={fieldStyle} required={formConfig.isBaptizedRequired} />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Situação Profissional {formConfig.employmentStatusRequired ? '*' : ''}</label>
                <select name="employment_status" value={form.employment_status} onChange={onChange} style={fieldStyle} required={formConfig.employmentStatusRequired}>
                  <option value="">Selecione...</option>
                  <option value="CLT">Assalariado (CLT)</option>
                  <option value="Autônomo">Autônomo</option>
                  <option value="Empresário">Empresário(a)</option>
                  <option value="Desempregado">Desempregado(a)</option>
                  <option value="Estudante">Estudante</option>
                  <option value="Aposentado">Aposentado(a)</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Profissão {formConfig.professionRequired ? '*' : ''}</label>
                <select name="profession" value={form.profession} onChange={onChange} style={fieldStyle} required={formConfig.professionRequired}>
                  <option value="">Selecione...</option>
                  <option value="Administrador(a)">Administrador(a)</option>
                  <option value="Advogado(a)">Advogado(a)</option>
                  <option value="Arquiteto(a)">Arquiteto(a)</option>
                  <option value="Assistente Social">Assistente Social</option>
                  <option value="Comerciante">Comerciante</option>
                  <option value="Contador(a)">Contador(a)</option>
                  <option value="Designer">Designer</option>
                  <option value="Desenvolvedor(a) / T.I.">Desenvolvedor(a) / T.I.</option>
                  <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                  <option value="Engenheiro(a)">Engenheiro(a)</option>
                  <option value="Fisioterapeuta">Fisioterapeuta</option>
                  <option value="Médico(a)">Médico(a)</option>
                  <option value="Motorista">Motorista</option>
                  <option value="Odontologista">Odontologista</option>
                  <option value="Pedreiro/Mestre de Obras">Pedreiro/Mestre de Obras</option>
                  <option value="Professor(a)">Professor(a)</option>
                  <option value="Psicólogo(a)">Psicólogo(a)</option>
                  <option value="Vendedor(a)">Vendedor(a)</option>
                  <option value="Outra">Outra (Especificar)</option>
                </select>
                {form.profession === 'Outra' && (
                  <input type="text" value={customProfession} onChange={e => setCustomProfession(e.target.value)} placeholder="Digite sua profissão" style={{ ...fieldStyle, marginTop: '8px' }} />
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Endereço {formConfig.addressRequired ? '*' : ''}</label>
              <input type="text" name="address" value={form.address} onChange={onChange} placeholder="Bairro, Cidade" style={fieldStyle} required={formConfig.addressRequired} />
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.85rem', color: '#475569' }}>
              <strong>Igreja / Congregação:</strong> {churches.find(c => c.id === form.churchId)?.name}
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
              ℹ️ Após aprovação, a secretaria da igreja definirá seu <strong>ministério</strong> e <strong>função</strong>.
            </div>

            <button type="submit" disabled={isSubmitting} style={{
              marginTop: '4px', padding: '14px', borderRadius: '12px', border: 'none',
              background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
              fontSize: '1rem', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
              boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(59,130,246,0.4)', transition: 'transform 0.2s'
            }}>
              {isSubmitting ? 'Enviando...' : 'Enviar Cadastro'}
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
