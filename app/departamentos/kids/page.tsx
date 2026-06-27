"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_MEMBERS, MOCK_KIDS, MOCK_KIDS_CHECKIN, Kid, KidCheckIn, Member } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

// Voluntários iniciais do Kids
const MOCK_KIDS_MEMBERS = [
  { id: '1', name: 'Tia Rose', function: 'Berçário (0-2)', status: 'ativo' },
  { id: '2', name: 'Tia Ana', function: 'Maternal (3-5)', status: 'ativo' },
  { id: '3', name: 'Tio Paulo', function: 'Juniores (6-9)', status: 'ativo' },
  { id: '4', name: 'Tia Carla', function: 'Teens (10-12)', status: 'ativo' },
  { id: '5', name: 'Tia Simone', function: 'Apoio', status: 'ativo' },
];

const KIDS_ROLES = ['Berçário (0-2)', 'Maternal (3-5)', 'Juniores (6-9)', 'Teens (10-12)', 'Apoio'];

export default function InfantilDashboardPage() {
  const { currentUser } = useAuth();
  
  // Abas do Módulo Kids
  const [activeTab, setActiveTab] = useState<'monitor' | 'checkin' | 'checkout' | 'escala'>('monitor');

  // Estados dos Dados Kids
  const [kidsList, setKidsList] = useState<Kid[]>(MOCK_KIDS);
  const [checkins, setCheckins] = useState<KidCheckIn[]>(MOCK_KIDS_CHECKIN);

  // Estados dos Formulários
  const [searchParentQuery, setSearchParentQuery] = useState('');
  const [parentResults, setParentResults] = useState<Member[]>([]);
  const [selectedParent, setSelectedParent] = useState<Member | null>(null);
  
  // Modais de Criação e Impressão
  const [showQuickVisitorModal, setShowQuickVisitorModal] = useState(false);
  const [showPulseiraModal, setShowPulseiraModal] = useState<KidCheckIn | null>(null);

  // Estados de Escala (Mantidos do painel anterior)
  const [selectedMonthStr, setSelectedMonthStr] = useState(new Date().toISOString().slice(0, 7)); 
  const [activeDate, setActiveDate] = useState<string>('2026-06-21'); // Domingo de base
  const [escalasGlobais, setEscalasGlobais] = useState<Record<string, Record<string, string[]>>>({
    '2026-06-21': {
      'Berçário (0-2)': ['1'],
      'Maternal (3-5)': ['2'],
      'Juniores (6-9)': ['3'],
      'Teens (10-12)': ['4'],
      'Apoio': ['5']
    }
  });

  // Alerta para os pais (WhatsApp / Push)
  const [selectedCheckInForAlert, setSelectedCheckInForAlert] = useState<KidCheckIn | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [alertSimulation, setAlertSimulation] = useState<{ active: boolean; type: 'whatsapp' | 'push'; status: 'sending' | 'success' } | null>(null);

  const alertTemplates = [
    "está com saudades e chorando muito. Favor vir à sala.",
    "precisa ir ao banheiro. Pode nos ajudar?",
    "se machucou de forma leve. Por favor, compareça à sala.",
    "precisa de uma troca de fralda/roupa.",
    "já está pronto para ser retirado (aula finalizada)."
  ];

  const handleSendAlert = (type: 'whatsapp' | 'push') => {
    if (!selectedCheckInForAlert) return;
    setAlertSimulation({ active: true, type, status: 'sending' });
    
    setTimeout(() => {
      setAlertSimulation({ active: true, type, status: 'success' });
      
      if (type === 'whatsapp') {
        const text = encodeURIComponent(`Olá, ${selectedCheckInForAlert.parentName}. Seu(sua) filho(a) ${selectedCheckInForAlert.kidName} ${customMessage}`);
        const phone = selectedCheckInForAlert.parentPhone.replace(/\D/g, '');
        window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${text}`, '_blank');
      }

      if (type === 'push') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(`⛪ ChurchFlow Kids: ${selectedCheckInForAlert.kidName}`, {
                body: `Olá ${selectedCheckInForAlert.parentName}, seu(sua) filho(a) ${selectedCheckInForAlert.kidName} ${customMessage}`,
              });
            }
          });
        }
      }
      
      setTimeout(() => {
        setAlertSimulation(null);
        setSelectedCheckInForAlert(null);
      }, 2500);
    }, 1500);
  };

  // Formulário de Cadastro Rápido de Visitante
  const [visitorData, setVisitorData] = useState({
    kidName: '',
    birthDate: '',
    parentName: '',
    parentPhone: '',
    allergies: ''
  });

  // Formulário de Check-out
  const [checkoutCodeInput, setCheckoutCodeInput] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<KidCheckIn | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Proporção Recomendada Crianças x Monitores (Tios) - Editável pelo Supervisor
  const [roomRules, setRoomRules] = useState({
    'Berçário': { label: '🍼 Berçário', minAge: 0, maxAge: 2, maxKidsPerTio: 3, capacity: 15 },
    'Maternal': { label: '🎨 Maternal', minAge: 3, maxAge: 5, maxKidsPerTio: 6, capacity: 25 },
    'Juniores': { label: '🚀 Juniores', minAge: 6, maxAge: 9, maxKidsPerTio: 10, capacity: 30 },
    'Teens': { label: '⚡ Teens', minAge: 10, maxAge: 12, maxKidsPerTio: 12, capacity: 30 }
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempRoomRules, setTempRoomRules] = useState(roomRules);
  const isSupervisor = ['superadmin', 'pastor_diretor', 'admin'].includes(currentUser?.role || '');

  // 1. MONITOR DE SALAS: Agrupamento em tempo real
  useEffect(() => {
    async function carregarDadosIniciais() {
      // 1. Buscar salas configuradas no Supabase
      const { data: salasDb } = await supabase.from('kids_rooms').select('*');
      if (salasDb && salasDb.length > 0) {
        const novasRegras: any = {};
        salasDb.forEach(sala => {
          const keySimplificada = sala.name.replace(/[^\w]/g, '').replace('🍼', '').replace('🎨', '').replace('🚀', '').replace('⚡', '').trim();
          novasRegras[sala.name.includes('Berçário') ? 'Berçário' : 
                      sala.name.includes('Maternal') ? 'Maternal' : 
                      sala.name.includes('Juniores') ? 'Juniores' : 'Teens'] = {
            id: sala.id,
            label: sala.name,
            minAge: sala.min_age,
            maxAge: sala.max_age,
            maxKidsPerTio: sala.max_kids_per_tio,
            capacity: sala.capacity
          };
        });
        setRoomRules(novasRegras);
      }

      // 2. Buscar crianças cadastradas
      const { data: kidsDb } = await supabase
        .from('kids')
        .select('*, members(name, phone)');
      if (kidsDb) {
        const kidsFormatadas: Kid[] = kidsDb.map(k => ({
          id: k.id,
          name: k.name,
          birthDate: k.birth_date,
          parentName: k.members?.name || 'Responsável Não Identificado',
          parentPhone: k.members?.phone || '',
          allergies: k.allergies || 'Sem alergias',
          churchId: '1'
        }));
        setKidsList(kidsFormatadas);
      }

      // 3. Buscar check-ins ativos de hoje
      const { data: checkinsDb } = await supabase
        .from('kids_checkins')
        .select('*, kids(*, members(name, phone)), kids_rooms(*)')
        .eq('status', 'presente');
      
      if (checkinsDb) {
        const checkinsFormatados: KidCheckIn[] = checkinsDb.map(c => ({
          id: c.id,
          kidId: c.kid_id,
          kidName: c.kids?.name || 'Criança',
          room: c.kids_rooms?.name?.includes('Berçário') ? 'Berçário' : 
                c.kids_rooms?.name?.includes('Maternal') ? 'Maternal' : 
                c.kids_rooms?.name?.includes('Juniores') ? 'Juniores' : 'Teens',
          checkInTime: new Date(c.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          securityCode: c.security_code,
          parentName: c.kids?.members?.name || 'Responsável',
          parentPhone: c.kids?.members?.phone || '',
          status: c.status
        }));
        setCheckins(checkinsFormatados);
      }
    }

    carregarDadosIniciais();

    // 4. Canal de tempo real (Realtime) para atualizações instantâneas de Check-in e Check-out
    const canalCheckins = supabase
      .channel('kids_checkins_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kids_checkins' }, () => {
        carregarDadosIniciais();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalCheckins);
    };
  }, []);

  // Agrupamento para renderização do Monitor de Salas
  const currentRoomStats = useMemo(() => {
    const presentCheckins = checkins.filter(c => c.status === 'presente');
    const rooms: Record<string, { kids: KidCheckIn[]; tios: string[] }> = {
      'Berçário': { kids: [], tios: escalasGlobais[activeDate]?.['Berçário (0-2)'] || [] },
      'Maternal': { kids: [], tios: escalasGlobais[activeDate]?.['Maternal (3-5)'] || [] },
      'Juniores': { kids: [], tios: escalasGlobais[activeDate]?.['Juniores (6-9)'] || [] },
      'Teens': { kids: [], tios: escalasGlobais[activeDate]?.['Teens (10-12)'] || [] }
    };

    presentCheckins.forEach(c => {
      if (rooms[c.room]) {
        rooms[c.room].kids.push(c);
      }
    });

    return rooms;
  }, [checkins, escalasGlobais, activeDate]);

  // Cálculo da idade a partir da data de nascimento
  const calculateAge = (birthDateStr: string) => {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Direcionar automaticamente a sala com base na idade
  const getRoomByAge = (age: number): 'Berçário' | 'Maternal' | 'Juniores' | 'Teens' => {
    if (age >= roomRules['Berçário'].minAge && age <= roomRules['Berçário'].maxAge) return 'Berçário';
    if (age >= roomRules['Maternal'].minAge && age <= roomRules['Maternal'].maxAge) return 'Maternal';
    if (age >= roomRules['Juniores'].minAge && age <= roomRules['Juniores'].maxAge) return 'Juniores';
    return 'Teens';
  };

  // Busca de Pais no Cadastro Geral
  const handleSearchParent = async () => {
    if (!searchParentQuery.trim()) {
      setParentResults([]);
      return;
    }
    const { data: membersDb, error } = await supabase
      .from('members')
      .select('*')
      .or(`name.ilike.%${searchParentQuery}%,phone.like.%${searchParentQuery}%`);

    if (membersDb) {
      setParentResults(membersDb);
    } else {
      setParentResults([]);
    }
  };

  // Efetuar o Check-in
  const handleCheckInKid = async (kid: Kid) => {
    const age = calculateAge(kid.birthDate);
    const room = getRoomByAge(age);
    const securityCode = `K-${Math.floor(1000 + Math.random() * 9000)}`;

    // Buscar o ID da sala correspondente no banco (usando limit 1 para evitar erros de duplicidade)
    const { data: roomsDb } = await supabase
      .from('kids_rooms')
      .select('id')
      .ilike('name', `%${room}%`)
      .limit(1);

    const roomDb = roomsDb && roomsDb[0];

    if (!roomDb) {
      alert('Erro: Sala correspondente não encontrada no banco do Supabase.');
      return;
    }

    // Criar check-in real no Supabase
    const { data: newCheckinDb, error } = await supabase
      .from('kids_checkins')
      .insert({
        kid_id: kid.id.startsWith('k-vis-') ? null : kid.id, // Se for visitante temporário, pode ser nulo ou cadastrado
        room_id: roomDb.id,
        security_code: securityCode,
        status: 'presente'
      })
      .select()
      .single();

    if (error) {
      alert('Erro ao realizar check-in no banco: ' + error.message);
      return;
    }

    const newCheckin: KidCheckIn = {
      id: newCheckinDb.id,
      kidId: kid.id,
      kidName: kid.name,
      room,
      checkInTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      securityCode,
      parentName: kid.parentName,
      parentPhone: kid.parentPhone,
      status: 'presente'
    };

    setCheckins([...checkins, newCheckin]);
    setShowPulseiraModal(newCheckin);
  };

  // Efetuar Check-in de Visitante Rápido
  const handleQuickVisitorCheckin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verificar se o responsável já existe (evita duplicar ao tentar novamente)
    let parentId = '';
    const { data: existingParent } = await supabase
      .from('members')
      .select('id')
      .eq('phone', visitorData.parentPhone)
      .eq('name', visitorData.parentName)
      .limit(1);

    if (existingParent && existingParent.length > 0) {
      parentId = existingParent[0].id;
    } else {
      // Criar primeiro o responsável como membro visitante temporário no banco
      const { data: newParentDb, error: parentError } = await supabase
        .from('members')
        .insert({
          name: visitorData.parentName,
          phone: visitorData.parentPhone,
          status: 'pendente',
          function: 'Visitante (Kids)',
          ministry: 'Infantil'
        })
        .select()
        .single();

      if (parentError || !newParentDb) {
        alert('Erro ao cadastrar responsável temporário: ' + parentError?.message);
        return;
      }
      parentId = newParentDb.id;
    }

    // 2. Criar a criança vinculada ao responsável no banco
    const { data: newKidDb, error: kidError } = await supabase
      .from('kids')
      .insert({
        name: visitorData.kidName,
        birth_date: visitorData.birthDate,
        parent_id: parentId,
        allergies: visitorData.allergies || 'Sem alergias',
        emergency_contact: visitorData.parentPhone
      })
      .select()
      .single();

    if (kidError || !newKidDb) {
      alert('Erro ao cadastrar criança visitante no banco: ' + kidError?.message);
      return;
    }

    const newKid: Kid = {
      id: newKidDb.id,
      name: visitorData.kidName,
      birthDate: visitorData.birthDate,
      parentName: visitorData.parentName,
      parentPhone: visitorData.parentPhone,
      allergies: visitorData.allergies || 'Sem alergias',
      churchId: '1'
    };

    // Salvar na lista local e fazer check-in
    setKidsList([...kidsList, newKid]);
    await handleCheckInKid(newKid);
    setShowQuickVisitorModal(false);
    setVisitorData({ kidName: '', birthDate: '', parentName: '', parentPhone: '', allergies: '' });
  };

  // Pesquisar liberação por código
  const handleSearchCheckout = () => {
    setCheckoutError('');
    setCheckoutResult(null);
    const found = checkins.find(c => c.securityCode === checkoutCodeInput.trim() && c.status === 'presente');
    if (found) {
      setCheckoutResult(found);
    } else {
      setCheckoutError('Nenhuma criança com este código de segurança ativa na sala no momento.');
    }
  };

  // Confirmar Saída / Check-out
  const handleConfirmCheckout = async (id: string) => {
    // Atualizar no Supabase
    const { error } = await supabase
      .from('kids_checkins')
      .update({
        status: 'liberado',
        checked_out_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao confirmar saída no banco: ' + error.message);
      return;
    }

    setCheckins(checkins.map(c => {
      if (c.id === id) {
        return { ...c, status: 'liberado', checkOutTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
      }
      return c;
    }));
    setCheckoutResult(null);
    setCheckoutCodeInput('');
    alert('Saída efetuada! Criança liberada para o responsável.');
  };

  // ==========================================
  // LÓGICA DA ESCALA (Mantida do painel anterior)
  // ==========================================
  const addCustomDate = () => {
    const input = prompt('Digite a data extra no formato AAAA-MM-DD');
    if (input) setActiveDate(input);
  };

  const stats = useMemo(() => {
    return {
      total: MOCK_KIDS_MEMBERS.length,
      ativos: MOCK_KIDS_MEMBERS.filter(m => m.status === 'ativo').length
    };
  }, []);

  const handleAssign = (role: string, memberId: string) => {
    setEscalasGlobais(prev => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      if (currentAssigned.includes(memberId)) return prev;
      return { ...prev, [activeDate]: { ...dayScale, [role]: [...currentAssigned, memberId] } };
    });
  };

  const handleRemove = (role: string, memberId: string) => {
    setEscalasGlobais(prev => {
      const dayScale = prev[activeDate] || {};
      const currentAssigned = dayScale[role] || [];
      return { ...prev, [activeDate]: { ...dayScale, [role]: currentAssigned.filter(id => id !== memberId) } };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '50px', overflowY: 'auto', maxHeight: 'calc(100vh - 80px)', width: '100%' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div>
            <h3 style={{ fontSize: '1.6rem', margin: 0, color: '#fd79a8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧸 Ministério Infantil Kids
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Monitoramento de salas, check-in integrado e controle de segurança com pulseiras.
            </span>
          </div>
          {isSupervisor && (
            <button 
              onClick={() => { setTempRoomRules({ ...roomRules }); setShowConfigModal(true); }}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              ⚙️ Configurações
            </button>
          )}
        </div>

        {/* ABAS DO PAINEL */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
          <button 
            onClick={() => setActiveTab('monitor')}
            style={{ background: activeTab === 'monitor' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            📺 Monitor
          </button>
          <button 
            onClick={() => setActiveTab('checkin')}
            style={{ background: activeTab === 'checkin' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            📥 Check-in
          </button>
          <button 
            onClick={() => setActiveTab('checkout')}
            style={{ background: activeTab === 'checkout' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            📤 Check-out
          </button>
          <button 
            onClick={() => setActiveTab('escala')}
            style={{ background: activeTab === 'escala' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            📅 Escala de Tios
          </button>
        </div>
      </div>

      {/* ABA 1: MONITOR DE SALAS */}
      {activeTab === 'monitor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CARDS COM CAPACIDADE E MONITORAMENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {Object.entries(roomRules).map(([key, rule]) => {
              const data = currentRoomStats[key];
              const totalPresente = data.kids.length;
              const totalTios = data.tios.length;
              const ratioExceeded = totalTios > 0 ? (totalPresente / totalTios > rule.maxKidsPerTio) : totalPresente > 0;

              return (
                <div key={key} className="glass" style={{ padding: '20px', borderRadius: '16px', borderLeft: `5px solid ${ratioExceeded ? '#e74c3c' : '#2ecc71'}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1rem', margin: 0, color: '#fff' }}>{rule.label} ({rule.minAge} a {rule.maxAge} anos)</h4>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                      Capacidade: {rule.capacity}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800 }}>{totalPresente}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>crianças presentes</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '8px' }}>
                    <span>Tios de serviço: <strong>{totalTios}</strong></span>
                    <span style={{ color: ratioExceeded ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
                      {ratioExceeded ? '⚠️ Precisa de Tios' : '✓ Proporção OK'}
                    </span>
                  </div>

                  {/* Lista de Presentes na Sala */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                    {data.kids.map(k => (
                      <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold' }}>👶 {k.kidName}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Resp: {k.parentName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#fd79a8', fontWeight: 'bold', fontSize: '0.7rem' }}>{k.securityCode}</span>
                          <button 
                            onClick={() => {
                              setSelectedCheckInForAlert(k);
                              setCustomMessage("está com saudades e chorando muito. Favor vir à sala.");
                            }}
                            title="Chamar Responsável"
                            style={{ background: 'rgba(253, 121, 168, 0.15)', color: '#fd79a8', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}
                          >
                            🔔 Chamar
                          </button>
                        </div>
                      </div>
                    ))}
                    {data.kids.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma criança nesta sala.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ABA 2: CHECK-IN / ENTRADA */}
      {activeTab === 'checkin' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* BUSCA E SELEÇÃO DE FAMÍLIA/KID */}
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.1rem', margin: 0 }}>🔍 Registrar Entrada (Check-in)</h4>
              <button 
                onClick={() => setShowQuickVisitorModal(true)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fd79a8', border: '1px solid rgba(253, 121, 168, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold' }}>
                👋 Visitante Rápido
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Pesquisar por Responsável ou Telefone..." 
                value={searchParentQuery}
                onChange={(e) => setSearchParentQuery(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
              />
              <button 
                onClick={handleSearchParent}
                style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Buscar
              </button>
            </div>

            {/* Resultados de Busca de Responsáveis */}
            {parentResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RESPONSÁVEIS ENCONTRADOS:</span>
                {parentResults.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedParent(p)}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', 
                      background: selectedParent?.id === p.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: selectedParent?.id === p.id ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px', cursor: 'pointer'
                    }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>📞 {p.phone}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>Selecionar</span>
                  </div>
                ))}
              </div>
            )}

            {/* Listar Dependentes da Família selecionada */}
            {selectedParent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                <h5 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                  CRIANÇAS VINCULADAS A *{selectedParent.name.toUpperCase()}*:
                </h5>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {kidsList
                    .filter(k => k.parentPhone === selectedParent.phone || k.parentName === selectedParent.name)
                    .map(k => {
                      const isAlreadyCheckedIn = checkins.some(c => c.kidId === k.id && c.status === 'presente');
                      const age = calculateAge(k.birthDate);
                      return (
                        <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>{k.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Idade: {age} anos • Sala Sugerida: <strong>{getRoomByAge(age)}</strong>
                            </div>
                            {k.allergies && <div style={{ fontSize: '0.7rem', color: '#fb7185', marginTop: '2px' }}>⚠️ Alergia: {k.allergies}</div>}
                          </div>
                          
                          <button 
                            disabled={isAlreadyCheckedIn}
                            onClick={() => handleCheckInKid(k)}
                            style={{ 
                              background: isAlreadyCheckedIn ? 'rgba(255,255,255,0.05)' : '#2ecc71',
                              color: isAlreadyCheckedIn ? 'var(--text-secondary)' : '#fff',
                              border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                              cursor: isAlreadyCheckedIn ? 'not-allowed' : 'pointer'
                            }}>
                            {isAlreadyCheckedIn ? '✓ Já na Sala' : 'Realizar Check-in'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>

          {/* PREVIEW E LISTA GERAL DE CHECK-IN ATIVOS */}
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>📥 Crianças na Sala (Hoje)</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
              {checkins.filter(c => c.status === 'presente').map(c => (
                <div key={c.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{c.kidName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Sala: <strong>{c.room}</strong> • Entrada: {c.checkInTime}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPulseiraModal(c)}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    🖨️ Re-imprimir Pulseira
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ABA 3: CHECK-OUT / SAÍDA */}
      {activeTab === 'checkout' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '10px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fd79a8' }}>🔒 Liberação Segura (Check-out)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Insira o código de segurança impresso na pulseira do responsável para liberar a criança da sala.
            </p>

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '350px', margin: '10px auto' }}>
              <input 
                type="text" 
                placeholder="Ex: K-9382" 
                value={checkoutCodeInput}
                onChange={(e) => setCheckoutCodeInput(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 18px', borderRadius: '8px', fontSize: '1.1rem', outline: 'none', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}
              />
              <button 
                onClick={handleSearchCheckout}
                style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Verificar
              </button>
            </div>

            {checkoutError && <div style={{ color: '#e74c3c', fontSize: '0.8rem' }}>{checkoutError}</div>}

            {/* Resultado da busca de liberação */}
            {checkoutResult && (
              <div style={{ background: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Criança Identificada:</span>
                  <span style={{ fontSize: '0.85rem', color: '#00cec9', fontWeight: 'bold' }}>{checkoutResult.room}</span>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{checkoutResult.kidName}</div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Responsável:</strong> {checkoutResult.parentName}<br />
                  <strong>Contato:</strong> {checkoutResult.parentPhone}
                </div>

                <button 
                  onClick={() => handleConfirmCheckout(checkoutResult.id)}
                  style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', width: '100%', marginTop: '10px' }}>
                  ✓ Confirmar Liberação e Saída
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 4: ESCALA DE PROFESSORES (Mantida e integrada) */}
      {activeTab === 'escala' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(320px, 2fr)', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* Lado Esquerdo: Datas */}
          <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0, paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>📅 Selecionar Domingo/Culto</h3>
            <input 
              type="month" 
              value={selectedMonthStr}
              onChange={(e) => setSelectedMonthStr(e.target.value)}
              className="search-input glass-input"
              style={{ padding: '8px 12px', borderRadius: '8px', width: '100%' }}
            />
            <button 
              onClick={() => setActiveDate('2026-06-21')}
              style={{ background: activeDate === '2026-06-21' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
              Culto - 21/06/2026 (Base)
            </button>
            <button onClick={addCustomDate} style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' }}>
              + Adicionar Domingo Extra
            </button>
          </div>

          {/* Lado Direito: Grid de Professores por Sala */}
          <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0' }}>🛠️ Escala de Monitores ({activeDate.split('-').reverse().join('/')})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {KIDS_ROLES.map(role => {
                const assigned = escalasGlobais[activeDate]?.[role] || [];
                const suggested = MOCK_KIDS_MEMBERS.filter(m => m.function === role && !assigned.includes(m.id));

                return (
                  <div key={role} style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '0.8rem', color: '#fd79a8', margin: '0 0 10px 0' }}>{role}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '30px', marginBottom: '8px' }}>
                      {assigned.map(id => (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(253, 121, 168, 0.1)', border: '1px solid #fd79a8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                          <span>{MOCK_KIDS_MEMBERS.find(m => m.id === id)?.name}</span>
                          <button onClick={() => handleRemove(role, id)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                    </div>
                    <select className="search-input glass-input" style={{ width: '100%', padding: '4px', fontSize: '0.7rem' }} value="" onChange={(e) => { if (e.target.value) handleAssign(role, e.target.value); }}>
                      <option value="" disabled>+ Voluntário</option>
                      {MOCK_KIDS_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODAL CADASTRO RÁPIDO DE VISITANTE */}
      {showQuickVisitorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <form onSubmit={handleQuickVisitorCheckin} className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>👋 Cadastro Rápido de Visitante Kids</h4>
              <button type="button" onClick={() => setShowQuickVisitorModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nome da Criança *</label>
                <input 
                  type="text" 
                  required
                  value={visitorData.kidName}
                  onChange={(e) => setVisitorData({ ...visitorData, kidName: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data de Nascimento *</label>
                  <input 
                    type="date" 
                    required
                    value={visitorData.birthDate}
                    onChange={(e) => setVisitorData({ ...visitorData, birthDate: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Telefone Responsável *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="(11) 99999-9999"
                    value={visitorData.parentPhone}
                    onChange={(e) => setVisitorData({ ...visitorData, parentPhone: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nome do Responsável *</label>
                <input 
                  type="text" 
                  required
                  value={visitorData.parentName}
                  onChange={(e) => setVisitorData({ ...visitorData, parentName: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alergias ou Observações Médicas</label>
                <input 
                  type="text" 
                  value={visitorData.allergies}
                  placeholder="Ex: Alergia a amendoim, intolerância..."
                  onChange={(e) => setVisitorData({ ...visitorData, allergies: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowQuickVisitorModal(false)}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                type="submit" 
                style={{ background: '#fd79a8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Confirmar Check-in
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO VISUAL DA PULSEIRA DE SEGURANÇA */}
      {showPulseiraModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '580px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#00cec9' }}>🖨️ Prévia da Pulseira de Segurança Kids</h4>
              <button onClick={() => setShowPulseiraModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* VIA 1: VIA DA CRIANÇA */}
              <div style={{ border: '2px dashed #00cec9', background: '#0a0f1d', borderRadius: '12px', padding: '15px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#00cec9', color: '#000', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>VIA DA CRIANÇA</span>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>DEPARTAMENTO KIDS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{showPulseiraModal.kidName}</div>
                <div style={{ fontSize: '0.8rem', color: '#fff', marginTop: '4px' }}>
                  Sala: <strong>{showPulseiraModal.room}</strong> • Entrada: {showPulseiraModal.checkInTime}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Responsável: {showPulseiraModal.parentName}<br />
                    Contato: {showPulseiraModal.parentPhone}
                  </div>
                  {/* QR Code Simulado e Código */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ width: '45px', height: '45px', background: '#fff', padding: '2px', display: 'inline-block', borderRadius: '4px' }}>
                      {/* Representação visual rápida de QR Code */}
                      <div style={{ width: '100%', height: '100%', background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 8px 8px' }}></div>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00cec9', marginTop: '2px' }}>{showPulseiraModal.securityCode}</div>
                  </div>
                </div>
              </div>

              {/* VIA 2: CANHOTO DO RESPONSÁVEL */}
              <div style={{ border: '2px dashed #fd79a8', background: '#0a0f1d', borderRadius: '12px', padding: '15px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#fd79a8', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>CANHOTO DO RESPONSÁVEL</span>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CUPOM DE RETIRADA</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Retirada de: {showPulseiraModal.kidName}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ⚠️ Apresente este canhoto de segurança na saída da sala.
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fd79a8' }}>{showPulseiraModal.securityCode}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => setShowPulseiraModal(null)}
                  style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Fechar
                </button>
                <button 
                  onClick={() => { alert('Pulseira enviada para a impressora térmica da recepção kids!'); setShowPulseiraModal(null); }}
                  style={{ flex: 2, background: '#00cec9', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  🖨️ Imprimir Pulseiras (Térmica)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA AO RESPONSÁVEL */}
      {selectedCheckInForAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 102, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '850px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fd79a8' }}>🔔 Disparar Alerta ao Responsável</h4>
              <button onClick={() => setSelectedCheckInForAlert(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', position: 'relative' }}>
              
              {/* Overlay de Simulação de Envio */}
              {alertSimulation && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.9)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                  {alertSimulation.status === 'sending' ? (
                    <>
                      <div className="loading-spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(253, 121, 168, 0.2)', borderTop: '5px solid #fd79a8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {alertSimulation.type === 'whatsapp' ? '📱 Abrindo WhatsApp e enviando mensagem...' : '⚡ Enviando Push Notification via ChurchFlow App...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '3rem', color: '#2ecc71' }}>✓</div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2ecc71' }}>Alerta Enviado com Sucesso!</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>O responsável foi notificado.</span>
                    </>
                  )}
                </div>
              )}

              {/* Lado Esquerdo: Formulário e Opções */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                  <strong>Criança:</strong> 👶 {selectedCheckInForAlert.kidName} ({selectedCheckInForAlert.room})<br />
                  <strong>Responsável:</strong> {selectedCheckInForAlert.parentName} • 📞 {selectedCheckInForAlert.parentPhone}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Selecione um Modelo de Mensagem:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {alertTemplates.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomMessage(tmpl)}
                        style={{ 
                          textAlign: 'left', background: customMessage === tmpl ? 'rgba(253, 121, 168, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: customMessage === tmpl ? '1px solid #fd79a8' : '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '6px', padding: '8px 12px', fontSize: '0.78rem', color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mensagem Personalizada:</label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleSendAlert('whatsapp')}
                    style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    💬 Enviar WhatsApp
                  </button>
                  <button
                    onClick={() => handleSendAlert('push')}
                    style={{ flex: 1, background: '#fd79a8', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    ⚡ Notificação Push (App)
                  </button>
                </div>
              </div>

              {/* Lado Direito: Preview no Celular */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '250px', height: '480px', border: '10px solid #222', borderRadius: '36px', position: 'relative', background: '#111', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                  {/* Speaker do celular */}
                  <div style={{ width: '60px', height: '6px', background: '#444', borderRadius: '3px', position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}></div>
                  
                  {/* Tela Interna */}
                  <div style={{ flex: 1, padding: '25px 12px 12px 12px', background: 'radial-gradient(circle, #222 0%, #050505 100%)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '2px' }}>PREVIEW NO TELEFONE DO RESPONSÁVEL</div>
                    
                    {/* Exibição de Push */}
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <span style={{ fontSize: '0.62rem', color: '#fd79a8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          ⛪ ChurchFlow App
                        </span>
                        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>agora</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Alerta Kids: {selectedCheckInForAlert.kidName}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.2' }}>
                        Olá {selectedCheckInForAlert.parentName}, seu(sua) filho(a) {selectedCheckInForAlert.kidName} {customMessage}
                      </div>
                    </div>

                    {/* Exibição de WhatsApp */}
                    <div style={{ background: '#075E54', borderRadius: '14px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: '#25D366', fontWeight: 'bold' }}>💬 WhatsApp</span>
                        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>agora</span>
                      </div>
                      <div style={{ background: '#dcf8c6', borderRadius: '8px', padding: '8px', color: '#000', fontSize: '0.65rem', alignSelf: 'flex-start', maxWidth: '90%', position: 'relative', marginTop: '4px' }}>
                        Olá, {selectedCheckInForAlert.parentName}. Seu(sua) filho(a) {selectedCheckInForAlert.kidName} {customMessage}
                        <div style={{ fontSize: '0.5rem', color: 'rgba(0,0,0,0.4)', textAlign: 'right', marginTop: '3px' }}>19:06 ✓✓</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Home indicator bar */}
                  <div style={{ width: '90px', height: '4px', background: '#555', borderRadius: '2px', position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÕES DE SALAS (SUPERVISOR) */}
      {showConfigModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 103, padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '650px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--card-bg)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#00cec9' }}>⚙️ Configurações de Salas (Supervisor)</h4>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
              {Object.entries(tempRoomRules).map(([key, room]) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fd79a8', fontSize: '0.9rem' }}>{key}</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nome da Sala</label>
                      <input 
                        type="text" 
                        value={room.label}
                        onChange={(e) => {
                          setTempRoomRules({
                            ...tempRoomRules,
                            [key]: { ...room, label: e.target.value }
                          });
                        }}
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Idade Mínima</label>
                      <input 
                        type="number" 
                        value={room.minAge}
                        onChange={(e) => {
                          setTempRoomRules({
                            ...tempRoomRules,
                            [key]: { ...room, minAge: parseInt(e.target.value) || 0 }
                          });
                        }}
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Idade Máxima</label>
                      <input 
                        type="number" 
                        value={room.maxAge}
                        onChange={(e) => {
                          setTempRoomRules({
                            ...tempRoomRules,
                            [key]: { ...room, maxAge: parseInt(e.target.value) || 0 }
                          });
                        }}
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Capacidade Máxima</label>
                      <input 
                        type="number" 
                        value={room.capacity}
                        onChange={(e) => {
                          setTempRoomRules({
                            ...tempRoomRules,
                            [key]: { ...room, capacity: parseInt(e.target.value) || 0 }
                          });
                        }}
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Crianças por Voluntário</label>
                      <input 
                        type="number" 
                        value={room.maxKidsPerTio}
                        onChange={(e) => {
                          setTempRoomRules({
                            ...tempRoomRules,
                            [key]: { ...room, maxKidsPerTio: parseInt(e.target.value) || 0 }
                          });
                        }}
                        style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  // Atualizar cada sala editada no Supabase
                  for (const [key, room] of Object.entries(tempRoomRules) as any) {
                    if (room.id) {
                      await supabase
                        .from('kids_rooms')
                        .update({
                          name: room.label,
                          min_age: room.minAge,
                          max_age: room.maxAge,
                          capacity: room.capacity,
                          max_kids_per_tio: room.maxKidsPerTio
                        })
                        .eq('id', room.id);
                    }
                  }
                  setRoomRules(tempRoomRules);
                  setShowConfigModal(false);
                  alert('Configurações de salas salvas com sucesso no banco de dados!');
                }}
                style={{ background: '#00cec9', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Salvar Configurações
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
