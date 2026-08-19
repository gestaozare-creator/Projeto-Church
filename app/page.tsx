"use client";
import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Member, Church } from '@/types/database';
import { useChurches } from '@/hooks/useChurches';
import { useMembers } from '@/hooks/useMembers';
import VendasPage from './vendas/page';

const getFunctionColor = (func?: string, cardConfig?: any) => {
  const f = (func || '').toLowerCase();

  // Regra padrão de cores solicitada:
  if (f.includes('presb')) return '#f4d03f'; // Dourado clarinho
  if (f.includes('diác') || f.includes('diac')) return '#f5b041'; // Laranja claro
  if (f.includes('obreiro')) return '#5dade2'; // Azul claro
  if (f.includes('membro')) return '#58d68d'; // Verde limão/claro

  // Outras funções (mantendo um padrão bonito)
  if (f.includes('pastor')) return '#8e44ad';
  if (f.includes('evangelista')) return '#d35400';
  if (f.includes('lider') || f.includes('líder')) return '#f39c12';

  return cardConfig?.primaryColor || '#cda136';
};

export default function Home() {
  const { currentUser, loading, canSeeAllChurches, isPastorRegional, activeChurchId, activeMinistryId } = useAuth();
  const [search, setSearch] = useState('');
  const [church, setChurch] = useState(activeChurchId ? activeChurchId : ((canSeeAllChurches || isPastorRegional) ? 'ALL' : currentUser?.churchId || ''));

  // SEGURANÇA: useChurches filtra por ministryId no banco — nunca carrega igrejas de outras redes
  const { churches: dbChurches, loading: churchesLoading } = useChurches(activeMinistryId);



  // churchIds da rede ativa — para filtro de membros no banco
  const scopedChurchIds = useMemo(() => dbChurches.map(c => c.id), [dbChurches]);

  // SEGURANÇA: useMembers usa churchIds da rede ativa, filtra no banco
  const { members: allMembers, loading: membersLoading, setMembers } = useMembers(undefined, scopedChurchIds);

  // Igrejas da rede (já chegam filtradas do banco via useChurches)
  const scopedChurches = dbChurches;

  useEffect(() => {
    if (activeChurchId) {
      setChurch(activeChurchId);
    } else if (scopedChurches.length > 0) {
      if (church === 'ALL' || !scopedChurches.some(c => c.id === church)) {
        setChurch('ALL');
      }
    }
  }, [activeChurchId, scopedChurches]);

  // Membros filtrados — dados já chegam do banco somente da rede ativa
  const members = useMemo(() => {
    if (activeChurchId) {
      return allMembers.filter(m => m.church_id === activeChurchId);
    }
    if (church === 'ALL') {
      return allMembers;
    }
    return allMembers.filter(m => m.church_id === church);
  }, [allMembers, activeChurchId, church]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cultoFilter, setCultoFilter] = useState('ALL');
  const [horarioFilter, setHorarioFilter] = useState('ALL');

  const availableHorarios = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = scopedChurches.flatMap(c => c.services || []);
    } else {
      const c = scopedChurches.find(c => c.id === church);
      svcs = c?.services || [];
    }
    if (cultoFilter === 'ALL') {
      const times = new Set(svcs.map(s => s.time));
      return Array.from(times).sort();
    } else {
      const times = new Set(svcs.filter(s => s.name === cultoFilter).map(s => s.time));
      return Array.from(times).sort();
    }
  }, [church, cultoFilter, dbChurches]);

  // Lista de cultos únicos cadastrados no banco para preencher o filtro superior
  const availableCultos = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = dbChurches.flatMap(c => c.services || []);
    } else {
      const c = dbChurches.find(c => c.id === church);
      svcs = c?.services || [];
    }
    const names = new Set(svcs.map(s => s.name));
    return Array.from(names).sort();
  }, [church, dbChurches]);


  // Auto-open integrate modal if redirect from visitantes
  useEffect(() => {
    if (typeof window !== 'undefined' && members.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const integrateId = params.get('integrate');
      if (integrateId) {
        const m = members.find(x => x.id === integrateId);
        if (m) {
          setEditForm({
            ...m,
            status: 'ativo',
            function: m.function && m.function !== 'Visitante' && m.function !== 'Visitante (Kids)' && m.function !== 'Ainda não definida' ? m.function : 'Membro',
            integrationDate: new Date().toISOString().split('T')[0]
          });
          setPhotoPreview(m.photoUrl || null);
          setIsCreating(true);
          setIsEditing(true);
          // Limpa a URL
          window.history.replaceState({}, '', '/');
        }
      }
    }
  }, [members]);

  useEffect(() => {
    setHorarioFilter('ALL');
  }, [cultoFilter]);

  // Sincronizar igreja selecionada com igreja do admin logado
  useEffect(() => {
    if (activeChurchId) {
      setChurch(activeChurchId);
    } else if (!canSeeAllChurches && currentUser?.churchId) {
      setChurch(currentUser.churchId);
    }
  }, [activeChurchId, canSeeAllChurches, currentUser]);

  const [sel, setSel] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [editForm, setEditForm] = useState<any>({ name: '', function: '', ministry: 'Louvor', phone: '', email: '', address: '', integrationDate: '', churchId: '1', photoUrl: '', status: 'ativo' });
  const [customFunction, setCustomFunction] = useState(false);
  const [customMinistry, setCustomMinistry] = useState(false);
  const [customFunctions, setCustomFunctions] = useState<string[]>([]);
  const [customMinistries, setCustomMinistries] = useState<string[]>([]);
  const [customProfession, setCustomProfession] = useState(false);
  const [customProfessions, setCustomProfessions] = useState<string[]>([]);
  const [customChurch, setCustomChurch] = useState(false);
  const [newChurchName, setNewChurchName] = useState('');
  const [customChurches, setCustomChurches] = useState<{ id: string, name: string }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // WhatsApp Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMsg, setWaMsg] = useState('');

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const openWhatsApp = (name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    setWaPhone(cleanPhone);
    setWaMsg(`Olá, ${name}. ${getGreeting()}, como vai?`);
    setShowWaModal(true);
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/55${waPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
    setShowWaModal(false);
  };

  const filtered = useMemo(() => members.filter(m => {
    const s = (m.name?.toLowerCase().includes(search.toLowerCase()) || false) || (m.function?.toLowerCase().includes(search.toLowerCase()) || false);
    const c = church === 'ALL' || church === 'all' || m.church_id === church;
    const isMember = m.status === 'ativo' || m.status === 'inativo' || m.status === 'aguardando_aprovacao';

    // Filtro por Culto selecionado
    if (cultoFilter !== 'ALL' && m.culto !== cultoFilter) return false;
    // Filtro por Horário selecionado
    if (horarioFilter !== 'ALL' && m.horario && !m.horario.includes(horarioFilter)) return false;

    let d = true;
    const mDate = (m.integrationDate || '').split('T')[0] || '2026-01-01';
    if (startDate && mDate < startDate) d = false;
    if (endDate && mDate > endDate) d = false;

    return s && c && isMember && d;
  }), [members, search, church, startDate, endDate, cultoFilter, horarioFilter]);

  if (!loading && !currentUser) {
    return <VendasPage />;
  }

  const pendentes = filtered.filter(m => m.status === 'aguardando_aprovacao');
  const ativos = filtered.filter(m => m.status === 'ativo');
  const inativos = filtered.filter(m => m.status === 'inativo');

  const changeStatus = async (id: string, ns: 'ativo' | 'inativo' | 'visitante' | 'em_conversao' | 'aguardando_aprovacao') => {
    if (ns === 'ativo') {
      const m = members.find(x => x.id === id);
      if (m && m.status === 'aguardando_aprovacao') {
        setEditForm({ ...m, status: 'ativo', integrationDate: new Date().toISOString().split('T')[0] });
        setPhotoPreview(m.photoUrl || null);
        setIsApproving(true); setIsEditing(true);
        return;
      }
    }

    const { error } = await supabase
      .from('members')
      .update({ status: ns })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status do membro: ' + error.message);
      return;
    }

    setMembers(p => p.map(m => m.id === id ? { ...m, status: ns } : m));
    if (sel?.id === id) setSel(p => p ? { ...p, status: ns } : null);
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const isExp = (d?: string) => { if (!d) return false; const e = new Date(d); e.setFullYear(e.getFullYear() + 2); return e < new Date(); };
  const calcExp = (d?: string) => { if (!d) return '—'; const e = new Date(d); e.setFullYear(e.getFullYear() + 2); return e.toLocaleDateString('pt-BR'); };

  const openEdit = (m: Member) => {
    setEditForm({
      ...m,
      churchId: m.church_id || (church && church !== 'ALL' ? church : currentUser?.churchId || ''),
      birthDate: m.birthDate || '',
      maritalStatus: m.maritalStatus || '',
      employmentStatus: m.employmentStatus || '',
      profession: m.profession || '',
      isBaptized: m.isBaptized || '',
      baptismDate: m.baptismDate || ''
    });
    setPhotoPreview(m.photoUrl || null); setIsCreating(false); setIsApproving(false); setCustomFunction(false); setCustomMinistry(false); setCustomProfession(false); setCustomChurch(false); setIsEditing(true);
  };
  const openCreate = () => {
    const today = new Date();
    const defaultIntegration = today.toISOString().split('T')[0];
    const defaultValidity = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear() + 1}`;

    setEditForm({ id: '', name: '', function: 'Membro', ministry: 'Louvor', phone: '', email: '', address: '', integrationDate: defaultIntegration, cardValidity: defaultValidity, churchId: (church && church !== 'ALL') ? church : (currentUser?.churchId || dbChurches[0]?.id || ''), photoUrl: '', status: 'ativo', birthDate: '', maritalStatus: '', employmentStatus: '', profession: '', isBaptized: '', baptismDate: '' });
    setPhotoPreview(null); setIsCreating(true); setIsApproving(false); setCustomFunction(false); setCustomMinistry(false); setCustomProfession(false); setCustomChurch(false); setIsEditing(true);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { const r = new FileReader(); r.onloadend = () => { const res = r.result as string; setPhotoPreview(res); setEditForm((p: any) => ({ ...p, photoUrl: res })); }; r.readAsDataURL(f); }
  };

  const handleSave = async (e: React.FormEvent | React.MouseEvent, overrideStatus?: string) => {
    e.preventDefault();

    if (!editForm.birthDate || !editForm.maritalStatus || !editForm.isBaptized) {
      alert('Por favor, preencha os campos obrigatórios: Data de Nascimento, Estado Civil e se é Batizado(a).');
      return;
    }
    if (editForm.isBaptized === 'Sim' && !editForm.baptismDate) {
      alert('Por favor, informe a Data do Batismo.');
      return;
    }

    const finalPhoto = editForm.photoUrl || `https://i.pravatar.cc/150?u=${editForm.name.replace(/\s/g, '')}`;

    const cleanPhone = editForm.phone ? editForm.phone.replace(/\D/g, '') : '';

    if (isCreating && cleanPhone) {
      const validChurchIds = dbChurches.map(c => c.id);
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('phone', cleanPhone)
        .in('church_id', validChurchIds)
        .limit(1);

      if (existing && existing.length > 0) {
        alert('Este número de WhatsApp já está cadastrado no sistema.');
        return;
      }
    }

    const dbPayload = {
      name: editForm.name,
      function: editForm.function,
      ministry: editForm.ministry,
      phone: cleanPhone,
      email: editForm.email,
      address: editForm.address,
      status: overrideStatus || editForm.status,
      church_id: editForm.churchId && editForm.churchId.length > 5 ? editForm.churchId : ((church && church !== 'ALL') ? church : (currentUser?.churchId || dbChurches[0]?.id || '')),
      integration_date: editForm.integrationDate,
      photo_url: finalPhoto,
      card_validity: editForm.cardValidity,
      birth_date: editForm.birthDate || null,
      marital_status: editForm.maritalStatus || null,
      employment_status: editForm.employmentStatus || null,
      profession: editForm.profession || null,
      is_baptized: editForm.isBaptized || null,
      baptism_date: editForm.isBaptized === 'Sim' ? (editForm.baptismDate || null) : null
    };

    if (isCreating) {
      let { data, error } = await supabase
        .from('members')
        .insert({ ...dbPayload, id: 'm_' + Date.now().toString() })
        .select()
        .single();

      if (error && (error.message?.includes('baptism_date') || error.message?.includes('is_baptized') || error.message?.includes('column'))) {
        const fallbackPayload = { ...dbPayload };
        delete fallbackPayload.is_baptized;
        delete fallbackPayload.baptism_date;
        const retryRes = await supabase
          .from('members')
          .insert({ ...fallbackPayload, id: 'm_' + Date.now().toString() })
          .select()
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        alert('Erro ao criar membro: ' + error.message);
        return;
      }

      if (data) {
        const newM: Member = {
          id: data.id,
          church_id: data.church_id || '1',
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          state: data.state || 'Geral',
          function: data.function || 'Ainda não definida',
          ministry: data.ministry || '',
          photoUrl: finalPhoto,
          integrationDate: data.integration_date || (data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : ''),
          cardValidity: data.card_validity || '',
          status: data.status as any,
          isBaptized: editForm.isBaptized,
          baptismDate: editForm.baptismDate
        };
        setMembers(p => [...p, newM]);
        setSel(newM);
      }
    } else {
      let { error } = await supabase
        .from('members')
        .update(dbPayload)
        .eq('id', editForm.id);

      if (error && (error.message?.includes('baptism_date') || error.message?.includes('is_baptized') || error.message?.includes('column'))) {
        const fallbackPayload = { ...dbPayload };
        delete fallbackPayload.is_baptized;
        delete fallbackPayload.baptism_date;
        const retryRes = await supabase
          .from('members')
          .update(fallbackPayload)
          .eq('id', editForm.id);
        error = retryRes.error;
      }

      if (error) {
        alert('Erro ao atualizar membro: ' + error.message);
        return;
      }

      const updatedM: Member = {
        ...editForm,
        status: overrideStatus || editForm.status,
        photoUrl: finalPhoto
      };

      setMembers(p => p.map(m => m.id === editForm.id ? updatedM : m));
      setSel(updatedM);
    }

    setIsEditing(false); setIsCreating(false); setIsApproving(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((p: any) => {
      const next = { ...p, [name]: value };
      if (name === 'integrationDate' && value) {
        const [yyyy, mm] = value.split('-');
        if (yyyy && mm) {
          next.cardValidity = `${mm}/${parseInt(yyyy) + 1}`;
        }
      }
      return next;
    });
  };

  const handlePrint = () => {
    if (!cardRef.current) return;
    const w = window.open('', '_blank', 'width=520,height=380');
    if (!w) return;

    // Captura o HTML da carteirinha e garante que o background-image seja preservado
    const cardHtml = cardRef.current.outerHTML;

    // CSS com print-color-adjust para forçar impressão de backgrounds e imagens
    const printStyles = `
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        margin: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #f0f0f0;
        font-family: 'Inter', sans-serif;
      }
      @media print {
        body {
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: 420px 265px;
          margin: 0;
        }
      }
    `;

    w.document.write(`<!DOCTYPE html><html><head><title>Carteirinha</title><style>${printStyles}</style></head><body>${cardHtml}<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 500); };<\/script></body></html>`);
    w.document.close();
  };

  const statusBadge = (s?: string) => {
    const val = s || 'pendente';
    if (val === 'ativo') return <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', fontWeight: '700', border: '1px solid rgba(46,204,113,0.3)' }}>ATIVO</span>;
    if (val === 'pendente') return <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(243,156,18,0.15)', color: '#f39c12', fontWeight: '700', border: '1px solid rgba(243,156,18,0.3)' }}>AGUARDANDO</span>;
    if (val === 'inativo') return <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(149,165,166,0.15)', color: '#95a5a6', fontWeight: '700', border: '1px solid rgba(149,165,166,0.3)' }}>INATIVO</span>;
    return <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{val.toUpperCase()}</span>;
  };

  const Row = ({ member, type }: { member: Member, type: 'ativo' | 'inativo' | 'visitante' | 'em_conversao' | 'pendente' }) => {
    const isSel = sel?.id === member.id;
    const exp = isExp(member.integrationDate);
    return (
      <div className={`glass member-card ${isSel ? 'card-selected' : ''}`} style={{ padding: '14px 16px', flexDirection: 'row', alignItems: 'center', gap: '14px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => setSel(member)}>
        <img src={member.photoUrl} alt={member.name} className="member-photo-small" style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: '600', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</span>
            {type === 'ativo' && (exp ? <span className="badge-expired">VENCIDA</span> : <span className="badge-valid">ATIVA</span>)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{member.function !== 'Ainda não definida' ? member.function : member.phone}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); openWhatsApp(member.name, member.phone || ''); }}
          style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #25d366', background: 'transparent', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#25d366'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.fill = '#25d366'; }}
          title="Abrir WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </button>
      </div>
    );
  };

  const ColHead = ({ color, title, count }: { color: string, title: string, count: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, display: 'inline-block' }} />{title}
      </h4>
      <span className="badge" style={{ background: color, padding: '2px 7px', fontSize: '0.65rem', margin: 0 }}>{count}</span>
    </div>
  );

  const selectedChurchObj = sel ? dbChurches.find(c => c.id === sel.church_id) : null;

  return (
    <div className="page-wrapper">
      {/* BARRA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <button className="mobile-only-btn glass-button" style={{ display: 'none', padding: '8px 12px', fontSize: '0.8rem', gap: '5px' }} onClick={() => setShowMobileFilters(!showMobileFilters)}>
          🔍 {showMobileFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="view-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', border: '1px solid var(--card-border)' }}>
            <button onClick={() => setViewMode('kanban')} className={viewMode === 'kanban' ? 'active' : ''} style={{ padding: '6px 12px', background: viewMode === 'kanban' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'kanban' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
              🗂️ Kanban
            </button>
            <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''} style={{ padding: '6px 12px', background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
              📄 Lista
            </button>
          </div>
          <button className="modal-btn mobile-only-btn" style={{ display: 'none', margin: 0, padding: '8px 14px', fontSize: '0.8rem', backgroundColor: '#2ecc71' }} onClick={openCreate}>+ Novo</button>
        </div>
      </div>

      <div className={`filters-container ${showMobileFilters ? 'mobile-visible' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '260px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', opacity: 0.4 }}>🔍</span>
          <input type="text" placeholder="Buscar..." className="search-input glass-input" style={{ width: '100%', padding: '8px 8px 8px 30px', fontSize: '0.82rem' }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(canSeeAllChurches || isPastorRegional) ? (
          <select className="filter-select" style={{ padding: '8px', fontSize: '0.8rem', minWidth: '140px' }} value={church} onChange={e => setChurch(e.target.value)}>
            <option value="ALL">⛪ Todas as Igrejas da Rede</option>
            {scopedChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <div className="filter-select" style={{ padding: '8px', fontSize: '0.8rem', minWidth: '140px', opacity: 0.8, pointerEvents: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            {scopedChurches.find(c => c.id === (activeChurchId || church))?.name || 'Igreja Local'}
          </div>
        )}
        <select value={cultoFilter} onChange={e => setCultoFilter(e.target.value)} className="search-input glass-input" style={{ padding: '8px', fontSize: '0.8rem' }}>
          <option value="ALL">Todos os Cultos</option>
          {availableCultos.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={horarioFilter} onChange={e => setHorarioFilter(e.target.value)} className="search-input glass-input" style={{ padding: '8px', fontSize: '0.8rem' }}>
          <option value="ALL">Horários</option>
          {availableHorarios.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>De:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="search-input glass-input" style={{ padding: '7px 8px', fontSize: '0.8rem', colorScheme: 'dark' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até:</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="search-input glass-input" style={{ padding: '7px 8px', fontSize: '0.8rem', colorScheme: 'dark' }} />
        </div>
        <button className="modal-btn desktop-only-btn" style={{ margin: 0, padding: '8px 14px', fontSize: '0.8rem', backgroundColor: '#2ecc71' }} onClick={openCreate}>+ Novo</button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Total: <strong style={{ color: 'var(--primary-light)' }}>{members.length}</strong></span>
      </div>

      {/* 3 COLUNAS KANBAN OU LISTA */}
      {viewMode === 'list' ? (
        <div className="glass scroll-container" style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
          <div className="table-responsive-cards">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--table-border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Membro</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Contato</th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? members.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--table-border)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setSel(m)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td data-label="Membro" style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', fontSize: '1rem' }}>{m.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.function} · {m.ministry}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Status" style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      {statusBadge(m.status)}
                    </td>
                    <td data-label="Contato" style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      {m.phone ? (
                        <button onClick={e => { e.stopPropagation(); openWhatsApp(m.name, m.phone || ''); }} style={{ background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #25d366' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        </button>
                      ) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Nenhum membro encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="responsive-grid-3 kanban-board">
          {/* PENDENTES */}
          <div className="glass kanban-col">
            <ColHead color="#f39c12" title="Aguardando" count={pendentes.length} />
            <div className="scroll-container" style={{ flex: 1, paddingRight: '4px' }}>
              {pendentes.length > 0 ? pendentes.map(m => <Row key={m.id} member={m} type="pendente" />) : (
                <div style={{ textAlign: 'center', padding: '25px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><div style={{ fontSize: '1.3rem', marginBottom: '6px', opacity: 0.4 }}>✅</div>Nenhum pendente</div>
              )}
            </div>
          </div>

          {/* ATIVOS */}
          <div className="glass kanban-col">
            <ColHead color="#2ecc71" title="Ativos" count={ativos.length} />
            <div className="scroll-container" style={{ flex: 1, paddingRight: '4px' }}>
              {ativos.length > 0 ? ativos.map(m => <Row key={m.id} member={m} type="ativo" />) : (
                <div style={{ textAlign: 'center', padding: '25px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><div style={{ fontSize: '1.3rem', marginBottom: '6px', opacity: 0.4 }}>👥</div>Nenhum ativo</div>
              )}
            </div>
          </div>

          {/* INATIVOS */}
          <div className="glass kanban-col">
            <ColHead color="#95a5a6" title="Inativos" count={inativos.length} />
            <div className="scroll-container" style={{ flex: 1, paddingRight: '4px' }}>
              {inativos.length > 0 ? inativos.map(m => <Row key={m.id} member={m} type="inativo" />) : (
                <div style={{ textAlign: 'center', padding: '25px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}><div style={{ fontSize: '1.3rem', marginBottom: '6px', opacity: 0.4 }}>😴</div>Nenhum inativo</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL DETALHES DO MEMBRO */}
      {sel && !isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', margin: '15px', position: 'relative' }}>
            <button onClick={() => setSel(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px', flexShrink: 0 }}>
                <img src={sel.photoUrl} alt={sel.name} className="modal-photo" style={{ width: '85px', height: '85px', border: '3px solid var(--primary-light)', display: 'block', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{sel.name}</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span className="badge" style={{ padding: '3px 8px', fontSize: '0.6rem', margin: 0 }}>{dbChurches.find((c: Church) => c.id === sel.church_id)?.name || 'Igreja'}</span>
                  {sel.status === 'aguardando_aprovacao' && <span className="badge" style={{ background: '#f39c12', padding: '3px 8px', fontSize: '0.6rem', margin: 0, color: '#fff' }}>PENDENTE</span>}
                  {sel.status === 'ativo' && (isExp(sel.integrationDate) ? <span className="badge-expired" style={{ padding: '3px 8px' }}>VENCIDA</span> : <span className="badge-valid" style={{ padding: '3px 8px' }}>ATIVA</span>)}
                  {sel.status === 'inativo' && <span className="badge" style={{ background: '#95a5a6', padding: '3px 8px', fontSize: '0.6rem', margin: 0, color: '#fff' }}>INATIVO</span>}
                </div>
              </div>
              <div className="scroll-container" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                <InfoCard label="Função" value={sel.function || ''} />
                {sel.ministry && <InfoCard label="Ministério" value={sel.ministry} />}
                <InfoCard label="Contato" value={`📞 ${sel.phone}${sel.email ? '\n✉️ ' + sel.email : ''}`} />
                <InfoCard label="Endereço" value={`📍 ${sel.address}`} />
                {(sel.maritalStatus || sel.isBaptized) && (
                  <InfoCard label="Dados Pessoais & Batismo" value={`${sel.maritalStatus ? '💍 Estado Civil: ' + sel.maritalStatus + '\n' : ''}${sel.isBaptized ? '🌊 Batizado: ' + sel.isBaptized + (sel.isBaptized === 'Sim' && sel.baptismDate ? ' (' + fmt(sel.baptismDate) + ')' : '') : ''}`} />
                )}
                {sel.integrationDate && (
                  <div className="glass" style={{ padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carteirinha</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.8rem' }}>🗓️ {fmt(sel.integrationDate)}</div>
                    <div style={{ color: isExp(sel.integrationDate) ? '#e74c3c' : '#27ae60', fontWeight: '500', fontSize: '0.8rem' }}>
                      {isExp(sel.integrationDate) ? '⚠️ Expirou: ' : '✅ Expira: '}{calcExp(sel.integrationDate)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexShrink: 0 }}>
                <button style={{ flex: 1, padding: '10px', border: '1px solid var(--primary-light)', background: 'transparent', color: 'var(--primary-light)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }} onClick={() => { openEdit(sel); setSel(null); }}>📝 Editar Dados / Status</button>
                {sel.status === 'ativo' && <button className="modal-btn" style={{ flex: 1, margin: 0, padding: '10px', fontSize: '0.8rem' }} onClick={() => setShowCard(true)}>🪪 Carteirinha</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARTEIRINHA */}
      {showCard && sel && (
        <div className="modal-overlay" onClick={() => setShowCard(false)}>
          <div style={{ animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            {/* Carteirinha visual */}
            <div ref={cardRef} style={{
              width: '420px', height: '265px', borderRadius: '12px', overflow: 'hidden',
              background: selectedChurchObj?.cardConfig?.backgroundUrl
                ? `url(${selectedChurchObj.cardConfig.backgroundUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, ${selectedChurchObj?.cardConfig?.primaryColor || '#0f172a'}, #2c3e50)`,
              color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>

              {/* Photo */}
              <div style={{
                position: 'absolute', top: '40px', left: '40px', width: '120px', height: '175px',
                borderRadius: '12px', background: 'rgba(255,255,255,0.2)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                <img src={sel.photoUrl || 'https://via.placeholder.com/150'} alt={sel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Function Band */}
              <div style={{
                position: 'absolute', top: '110px', left: '175px', right: '15px', height: '40px',
                background: getFunctionColor(sel.function, selectedChurchObj?.cardConfig),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, letterSpacing: '1.5px', fontSize: '1.1rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)', color: '#fff',
                borderRadius: '4px', zIndex: 1
              }}>
                {(sel.function || 'MEMBRO').toUpperCase()}
              </div>

              {/* Member Details */}
              <div style={{ position: 'absolute', top: '165px', left: '175px', right: '15px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '3px', zIndex: 1 }}>
                <div><span style={{ opacity: 0.9, fontWeight: 500 }}>NOME:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{sel.name?.toUpperCase()}</span></div>
                <div><span style={{ opacity: 0.9, fontWeight: 500 }}>DATA DO BATISMO:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{sel.baptismDate ? fmt(sel.baptismDate) : (fmt(sel.integrationDate) || '—')}</span></div>
                <div><span style={{ opacity: 0.9, fontWeight: 500 }}>CONGREGAÇÃO:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{selectedChurchObj?.name?.toUpperCase()}</span></div>
                <div><span style={{ opacity: 0.9, fontWeight: 500 }}>VALIDADE:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px', color: isExp(sel.cardValidity || sel.integrationDate) ? '#ff6b6b' : '#fff' }}>{sel.cardValidity || calcExp(sel.integrationDate)}</span></div>
              </div>

            </div>

            {/* Botões abaixo da carteirinha */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
              <button onClick={handlePrint} className="modal-btn" style={{ margin: 0, padding: '10px 25px', fontSize: '0.9rem' }}>🖨️ Imprimir</button>
              <button onClick={() => setShowCard(false)} style={{ padding: '10px 25px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => { setIsEditing(false); setIsCreating(false); setIsApproving(false); }}>
          <div className="modal-content" style={{ maxWidth: '520px', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setIsEditing(false); setIsCreating(false); setIsApproving(false); }}>&times;</button>
            <form onSubmit={handleSave} className="modal-body">
              <h3 style={{ borderBottom: '1px solid var(--table-border)', paddingBottom: '10px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {isApproving ? '✅ Aprovar Membro' : isCreating ? '➕ Novo Membro' : '📝 Editar'}
              </h3>
              {isApproving && <p style={{ fontSize: '0.82rem', color: '#2ecc71', marginBottom: '10px', padding: '8px', background: 'rgba(46,204,113,0.08)', borderRadius: '8px', border: '1px solid rgba(46,204,113,0.2)' }}>Defina a foto, função e data de integração.</p>}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <label htmlFor="photo-upload" style={{ cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: '85px', height: '85px', borderRadius: '50%', border: '3px dashed var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(59,130,246,0.05)' }}>
                    {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.6rem', opacity: 0.4 }}>📷</span>}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff' }}>✏️</div>
                  <input id="photo-upload" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Nome</label><input type="text" name="name" value={editForm.name} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Função / Habilidade</label>
                    {customFunction ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" placeholder="Nome da nova função..." value={editForm.function} onChange={e => setEditForm((p: any) => ({ ...p, function: e.target.value }))} className="search-input glass-input" style={{ flex: 1, padding: '8px' }} autoFocus required />
                        <button type="button" onClick={() => { if (editForm.function && !customFunctions.includes(editForm.function)) setCustomFunctions(p => [...p, editForm.function]); setCustomFunction(false); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>✓</button>
                        <button type="button" onClick={() => { setCustomFunction(false); setEditForm((p: any) => ({ ...p, function: '' })); }} style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                      </div>
                    ) : (
                      <select name="function" value={editForm.function} onChange={e => { if (e.target.value === '__new__') { setCustomFunction(true); setEditForm((p: any) => ({ ...p, function: '' })); } else { onChange(e); } }} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required>
                        <option value="">Selecione...</option>
                        {(selectedChurchObj?.config?.funcoes || ['Membro', 'Obreiro(a)', 'Diácono(a)', 'Presbítero', 'Pastor']).map((f: string) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                        {customFunctions.map(f => <option key={f} value={f}>{f}</option>)}
                        <option value="__new__">➕ Criar nova função...</option>
                      </select>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Ministério</label>
                    {customMinistry ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" placeholder="Nome do novo ministério..." value={editForm.ministry} onChange={e => setEditForm((p: any) => ({ ...p, ministry: e.target.value }))} className="search-input glass-input" style={{ flex: 1, padding: '8px' }} autoFocus />
                        <button type="button" onClick={() => { if (editForm.ministry && !customMinistries.includes(editForm.ministry)) setCustomMinistries(p => [...p, editForm.ministry]); setCustomMinistry(false); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>✓</button>
                        <button type="button" onClick={() => { setCustomMinistry(false); setEditForm((p: any) => ({ ...p, ministry: '' })); }} style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                      </div>
                    ) : (
                      <select name="ministry" value={editForm.ministry} onChange={e => { if (e.target.value === '__new__') { setCustomMinistry(true); setEditForm((p: any) => ({ ...p, ministry: '' })); } else { onChange(e); } }} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                        <option value="">Selecione...</option>
                        {(dbChurches.find(c => c.id === editForm.churchId)?.departments || ['Louvor', 'Obreiros', 'Infantil', 'Mídia', 'Pastoral', 'Intercessão', 'Evangelismo', 'Diaconia']).map((d: string) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                        {customMinistries.map(m => <option key={m} value={m}>{m}</option>)}
                        <option value="__new__">➕ Criar novo ministério...</option>
                      </select>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Data de Nascimento *</label><input type="date" name="birthDate" value={editForm.birthDate || ''} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Estado Civil *</label>
                    <select name="maritalStatus" value={editForm.maritalStatus || ''} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required>
                      <option value="">Selecione...</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Já é Batizado(a)? *</label>
                    <select name="isBaptized" value={editForm.isBaptized || ''} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required>
                      <option value="">Selecione...</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  {editForm.isBaptized === 'Sim' && (
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Data do Batismo *</label>
                      <input type="date" name="baptismDate" value={editForm.baptismDate || ''} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Situação Profissional</label>
                    <select name="employmentStatus" value={editForm.employmentStatus || ''} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
                      <option value="">Selecione...</option>
                      <option value="CLT">Assalariado (CLT)</option>
                      <option value="Autônomo">Autônomo</option>
                      <option value="Empresário">Empresário(a)</option>
                      <option value="Desempregado">Desempregado(a)</option>
                      <option value="Estudante">Estudante</option>
                      <option value="Aposentado">Aposentado(a)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Profissão</label>
                    {customProfession ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" placeholder="Qual a profissão?" value={editForm.profession || ''} onChange={e => setEditForm((p: any) => ({ ...p, profession: e.target.value }))} className="search-input glass-input" style={{ flex: 1, padding: '8px' }} autoFocus />
                        <button type="button" onClick={() => { if (editForm.profession && !customProfessions.includes(editForm.profession)) setCustomProfessions(p => [...p, editForm.profession]); setCustomProfession(false); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>OK</button>
                        <button type="button" onClick={() => { setCustomProfession(false); setEditForm((p: any) => ({ ...p, profession: '' })); }} style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}>X</button>
                      </div>
                    ) : (
                      <select name="profession" value={editForm.profession || ''} onChange={e => { if (e.target.value === '__new__') { setCustomProfession(true); setEditForm((p: any) => ({ ...p, profession: '' })); } else { onChange(e); } }} className="search-input glass-input" style={{ width: '100%', padding: '8px' }}>
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
                        {customProfessions.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="__new__">➕ Outra (Especificar)</option>
                      </select>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Telefone</label><input type="text" name="phone" value={editForm.phone} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Igreja</label>
                    {customChurch ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" placeholder="Nome da nova igreja..." value={newChurchName} onChange={e => setNewChurchName(e.target.value)} className="search-input glass-input" style={{ flex: 1, padding: '8px' }} autoFocus />
                        <button type="button" onClick={() => { if (newChurchName) { const id = 'c_' + Date.now(); setCustomChurches(p => [...p, { id, name: newChurchName }]); setEditForm((p: any) => ({ ...p, churchId: id })); } setCustomChurch(false); setNewChurchName(''); }} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#2ecc71', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>✓</button>
                        <button type="button" onClick={() => { setCustomChurch(false); setNewChurchName(''); }} style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                      </div>
                    ) : (
                      <select
                        name="churchId"
                        value={editForm.churchId}
                        onChange={e => { if (e.target.value === '__new__') { setCustomChurch(true); } else { onChange(e); } }}
                        className="search-input glass-input"
                        style={{ width: '100%', padding: '8px' }}
                        disabled={!(canSeeAllChurches || isPastorRegional)}
                      >
                        {dbChurches.map((c: Church) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        {customChurches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        {canSeeAllChurches && (
                          <option value="__new__">➕ Cadastrar nova igreja...</option>
                        )}
                      </select>
                    )}
                  </div>
                </div>
                <div><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Endereço</label><input type="text" name="address" value={editForm.address} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} required /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Data de Integração</label><input type="date" name="integrationDate" value={editForm.integrationDate} onChange={onChange} className="search-input glass-input" style={{ width: '100%', padding: '8px' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>Validade da Carteirinha</label><input type="text" name="cardValidity" value={editForm.cardValidity || ''} onChange={onChange} placeholder="Ex: 12/2026" className="search-input glass-input" style={{ width: '100%', padding: '8px' }} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button type="button" className="modal-btn" style={{ flex: 1, backgroundColor: '#7f8c8d', minWidth: '110px' }} onClick={() => { setIsEditing(false); setIsCreating(false); setIsApproving(false); }}>Cancelar</button>

                {isCreating ? (
                  <button type="submit" className="modal-btn" style={{ flex: 2, backgroundColor: '#2ecc71', minWidth: '110px' }}>Cadastrar</button>
                ) : (
                  <>
                    {editForm.status === 'aguardando_aprovacao' && (
                      <>
                        <button type="submit" className="modal-btn" style={{ flex: 1, backgroundColor: '#3498db', minWidth: '110px' }}>💾 Salvar Modificações</button>
                        <button type="button" className="modal-btn" style={{ flex: 1, backgroundColor: '#2ecc71', minWidth: '110px' }} onClick={(e) => handleSave(e, 'ativo')}>✅ Aprovar e Ativar</button>
                        <button type="button" className="modal-btn" style={{ flex: 1, backgroundColor: '#e74c3c', minWidth: '110px' }} onClick={(e) => handleSave(e, 'inativo')}>❌ Inativar</button>
                      </>
                    )}
                    {editForm.status === 'ativo' && (
                      <>
                        <button type="submit" className="modal-btn" style={{ flex: 2, backgroundColor: '#2ecc71', minWidth: '110px' }}>Salvar Alterações</button>
                        <button type="button" className="modal-btn" style={{ flex: 1, backgroundColor: 'rgba(231,76,60,0.2)', color: '#e74c3c', minWidth: '110px' }} onClick={(e) => { if (confirm('Inativar membro?')) handleSave(e, 'inativo'); }}>❌ Inativar</button>
                      </>
                    )}
                    {editForm.status === 'inativo' && (
                      <>
                        <button type="submit" className="modal-btn" style={{ flex: 2, backgroundColor: '#3498db', minWidth: '110px' }}>Salvar Alterações</button>
                        <button type="button" className="modal-btn" style={{ flex: 1, backgroundColor: '#2ecc71', minWidth: '110px' }} onClick={(e) => handleSave(e, 'ativo')}>✅ Reativar</button>
                      </>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP */}
      {showWaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '420px', margin: '15px' }}>
            <h3 style={{ marginTop: 0, color: '#25d366', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><svg viewBox="0 0 24 24" width="20" height="20" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> Mensagem WhatsApp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Edite a mensagem abaixo antes de enviar:</p>
            <textarea
              value={waMsg}
              onChange={e => setWaMsg(e.target.value)}
              className="search-input glass-input"
              style={{ padding: '12px', width: '100%', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontSize: '0.9rem', lineHeight: '1.5' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowWaModal(false)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button type="button" onClick={sendWhatsApp} style={{ background: '#25d366', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="glass" style={{ padding: '8px 10px', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.75rem', whiteSpace: 'pre-line' }}>{value}</div>
    </div>
  );
}
