"use client";
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useGlobalData } from '@/hooks/useGlobalData';

// Tipo local (view model camelCase)
interface FinancialTransaction {
  id: string;
  churchId: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  memberId?: string;
  supplierId?: string;
  status: string;
  date: string;
  dueDate?: string;
  paidDate?: string;
  attachment_url?: string;
}
type Transaction = FinancialTransaction;

export default function ContasPagar() {
  const { currentUser, canSeeAllChurches, activeChurchId } = useAuth();
  const { churches, churchServices, suppliers } = useGlobalData();
  
  const [church, setChurch] = useState(activeChurchId ? activeChurchId : (canSeeAllChurches ? 'ALL' : currentUser?.churchId || ''));

  useEffect(() => {
    if (activeChurchId) {
      setChurch(activeChurchId);
    } else if (canSeeAllChurches) {
      setChurch('ALL');
    }
  }, [activeChurchId, canSeeAllChurches]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${mm}-${String(lastDay).padStart(2, '0')}`;
  });
  const [cultoFilter, setCultoFilter] = useState('ALL');
  const [horarioFilter, setHorarioFilter] = useState('ALL');

  const availableCultos = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    const names = new Set(svcs.map(s => s.name));
    return Array.from(names).sort();
  }, [church, churchServices]);

  const availableHorarios = useMemo(() => {
    let svcs: any[] = [];
    if (church === 'ALL') {
      svcs = churchServices || [];
    } else {
      svcs = churchServices?.filter(s => s.church_id === church) || [];
    }
    if (cultoFilter === 'ALL') {
      const times = new Set(svcs.map(s => s.time));
      return Array.from(times).sort();
    } else {
      const times = new Set(svcs.filter(s => s.name === cultoFilter).map(s => s.time));
      return Array.from(times).sort();
    }
  }, [church, cultoFilter, churchServices]);

  useEffect(() => {
    setHorarioFilter('ALL');
  }, [cultoFilter]);

  // Efeito para sincronizar filtro caso a flag mude
  useEffect(() => {
    if (activeChurchId) {
      setChurch(activeChurchId);
    } else if (!canSeeAllChurches && currentUser?.churchId) {
      setChurch(currentUser.churchId);
    }
  }, [activeChurchId, canSeeAllChurches, currentUser]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'despesa');

    if (data && data.length > 0) {
      const formatadas: Transaction[] = data.map(t => ({
        id: t.id,
        churchId: t.church_id || '1',
        type: 'despesa',
        category: t.category,
        description: t.description || '',
        amount: Number(t.amount),
        paymentMethod: t.payment_method || '',
        supplierId: t.supplier_id || undefined,
        status: t.status as any,
        date: t.date,
        dueDate: t.due_date || undefined,
        paidDate: t.paid_date || undefined,
        attachment_url: t.attachment_url || undefined
      }));
      setLocalTransactions(formatadas);
    } else {
      setLocalTransactions([]);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  // Kanban DND States
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<{ id: string; status: 'pendente' | 'confirmado' | 'vencido' } | null>(null);

  // View States
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingFullTransaction, setEditingFullTransaction] = useState<Transaction | null>(null);
  const [attachmentLink, setAttachmentLink] = useState<string | null>(null);
  
  // Patrimônio State
  const [isAsset, setIsAsset] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showAssetLabelModal, setShowAssetLabelModal] = useState<any | null>(null);
  const [newSuppliers, setNewSuppliers] = useState<{id: string, name: string}[]>([]);

  // Config dinâmica da igreja selecionada
  const rawConfig = churches?.find((c: any) => c.id === church)?.config;
  const selectedChurchConfig = rawConfig
    ? (typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig)
    : null;
  const despesasCats: string[] = selectedChurchConfig?.despesas || ['Aluguel', 'Energia', 'Água', 'Internet/Telefone', 'Manutenção', 'Material de Escritório', 'Salários/Ajudas'];
  const pagamentosCats: string[] = selectedChurchConfig?.pagamentos || ['PIX', 'Dinheiro', 'Boleto', 'Transferência', 'Cartão de Crédito', 'Débito Automático'];

  const [selectedCategory, setSelectedCategory] = useState(() => despesasCats[0] || 'Aluguel');

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const finalCategory = selectedCategory === 'NOVA' ? formData.get('customCategory') : selectedCategory;
      
      let finalSupplierId = formData.get('supplierId') as string || undefined;
      if (selectedSupplier === 'NOVO') {
        const customSupplierName = formData.get('customSupplier') as string;
        if (customSupplierName) {
          const { data: newSupplier, error: supError } = await supabase
            .from('suppliers')
            .insert({ name: customSupplierName })
            .select()
            .single();
            
          if (!supError && newSupplier) {
            finalSupplierId = newSupplier.id;
            setNewSuppliers(prev => [...prev, { id: newSupplier.id, name: newSupplier.name }]);
          }
        }
      }

      const amount = parseFloat(formData.get('amount') as string) || 0;
      const descriptionField = formData.get('description') as string;
      const dateField = formData.get('date') as string;
      const statusField = formData.get('status') as 'pendente' | 'confirmado';
      const dueDateField = formData.get('dueDate') as string;
      const paymentMethodField = formData.get('paymentMethod') as string;

      // Verificar se o ID do fornecedor é um UUID válido
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalSupplierId || '');

      let attachmentUrl = null;
      const file = formData.get('attachment') as File | null;
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${currentUser?.churchId || 'public'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error('Erro ao enviar anexo: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrlData.publicUrl;
      }

      // Gravar no Supabase
      let newTransaction: Transaction;
      
      if (editingFullTransaction) {
        const { data: updTxDb, error } = await supabase
          .from('transactions')
          .update({
            supplier_id: finalSupplierId,
            category: finalCategory as string,
            amount: amount,
            description: descriptionField,
            date: dateField,
            paid_date: statusField === 'confirmado' ? dateField : null,
            due_date: statusField === 'pendente' ? (dueDateField || dateField) : null,
            status: statusField,
            payment_method: paymentMethodField,
            ...(attachmentUrl ? { attachment_url: attachmentUrl } : {})
          })
          .eq('id', editingFullTransaction.id)
          .select()
          .single();

        if (error || !updTxDb) {
          throw new Error('Erro ao editar despesa no banco: ' + error?.message);
        }

        newTransaction = {
          id: updTxDb.id,
          churchId: updTxDb.church_id || '1',
          supplierId: updTxDb.supplier_id || undefined,
          type: 'despesa',
          category: updTxDb.category,
          amount: Number(updTxDb.amount),
          description: updTxDb.description || '',
          date: updTxDb.date,
          paidDate: updTxDb.paid_date || undefined,
          dueDate: updTxDb.due_date || undefined,
          status: updTxDb.status as any,
          paymentMethod: updTxDb.payment_method || '',
          attachment_url: updTxDb.attachment_url || undefined
        };
        
        setLocalTransactions(prev => prev.map(t => t.id === newTransaction.id ? newTransaction : t));
        setEditingFullTransaction(null);
      } else {
        const { data: newTxDb, error } = await supabase
          .from('transactions')
          .insert({
            church_id: currentUser?.churchId || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            supplier_id: finalSupplierId,
            type: 'despesa',
            category: finalCategory as string,
            amount: amount,
            description: descriptionField,
            date: dateField,
            paid_date: statusField === 'confirmado' ? dateField : null,
            due_date: statusField === 'pendente' ? (dueDateField || dateField) : null,
            status: statusField,
            payment_method: paymentMethodField,
            attachment_url: attachmentUrl
          })
          .select()
          .single();

        if (error || !newTxDb) {
          throw new Error('Erro ao lançar despesa no banco: ' + error?.message);
        }

        newTransaction = {
          id: newTxDb.id,
          churchId: newTxDb.church_id || '1',
          supplierId: newTxDb.supplier_id || undefined,
          type: 'despesa',
          category: newTxDb.category,
          amount: Number(newTxDb.amount),
          description: newTxDb.description || '',
          date: newTxDb.date,
          paidDate: newTxDb.paid_date || undefined,
          dueDate: newTxDb.due_date || undefined,
          status: newTxDb.status as any,
          paymentMethod: newTxDb.payment_method || '',
          attachment_url: newTxDb.attachment_url || undefined
        };
        
        setLocalTransactions(prev => [newTransaction, ...prev]);
      }

      if (!editingFullTransaction) {
        // Registrar no patrimônio se a opção estiver ativa
        let createdAssetObj = null;
        if (isAsset) {
          const assetName = formData.get('assetName') as string;
          const assetLocation = formData.get('assetLocation') as string;

          const { data: newAssetDb, error: assetError } = await supabase
            .from('assets')
            .insert({
              church_id: currentUser?.churchId || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
              name: assetName,
              category: finalCategory as string,
              condition: 'Novo',
              location: assetLocation,
              purchase_value: amount,
              purchase_date: dateField,
              expense_id: newTransaction.id
            })
            .select()
            .single();

          if (assetError) {
            alert('Despesa lançada, mas erro ao registrar patrimônio: ' + assetError.message);
          } else if (newAssetDb) {
            createdAssetObj = {
              id: newAssetDb.id,
              churchId: newAssetDb.church_id || '1',
              name: newAssetDb.name,
              category: newAssetDb.category,
              condition: newAssetDb.condition as any,
              location: newAssetDb.location,
              purchaseValue: Number(newAssetDb.purchase_value || 0),
              purchaseDate: newAssetDb.purchase_date || '',
              expenseId: newAssetDb.expense_id || undefined
            };
          }
        }
        
        if (createdAssetObj) {
          setShowAssetLabelModal(createdAssetObj);
        }
      }
      
      setShowExpenseModal(false);
      setIsAsset(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAttachment = async (transaction: Transaction) => {
    if (!confirm('Tem certeza que deseja remover a nota permanentemente?')) return;
    try {
      if (transaction.attachment_url) {
        const urlParts = transaction.attachment_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        await supabase.storage.from('receipts').remove([`${folder}/${fileName}`]);
      }
      
      const { error } = await supabase
        .from('transactions')
        .update({ attachment_url: null })
        .eq('id', transaction.id);

      if (error) throw new Error(error.message);
      
      setLocalTransactions(prev => prev.map(t => t.id === transaction.id ? { ...t, attachment_url: undefined } : t));
      if (selectedTransaction?.id === transaction.id) {
        setSelectedTransaction(prev => prev ? { ...prev, attachment_url: undefined } : null);
      }
    } catch (err: any) {
      alert('Erro ao remover anexo: ' + err.message);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este lançamento de despesa?')) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setLocalTransactions(prev => prev.filter(t => t.id !== id));
      setSelectedTransaction(null);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Filtra as transações de despesa pelo período/igreja
  const transactions = useMemo(() => {
    return localTransactions.filter(t => {
      if (t.type !== 'despesa') return false;
      if (church !== 'ALL' && t.churchId !== church) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      
      if (cultoFilter !== 'ALL') {
        const desc = t.description.toLowerCase();
        if (!desc.includes(cultoFilter.toLowerCase())) return false;
      }
      
      if (horarioFilter !== 'ALL') {
        if (!t.description.includes(horarioFilter)) return false;
      }
      
      return true;
    });
  }, [church, startDate, endDate, cultoFilter, horarioFilter, localTransactions]);

  const pendentes = transactions.filter(t => t.status === 'pendente');
  const confirmadas = transactions.filter(t => t.status === 'confirmado');
  const vencidas = transactions.filter(t => t.status === 'vencido');

  const sum = (arr: Transaction[]) => arr.reduce((acc, curr) => acc + curr.amount, 0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getSupplierName = (id?: string) => {
    if (!id) return '-';
    const found = suppliers.find(s => s.id === id) || newSuppliers.find(s => s.id === id);
    return found?.name || 'Desconhecido';
  };

  const expiringSoonCount = pendentes.filter(t => {
    if(!t.dueDate) return false;
    const diff = getDaysDiff(t.dueDate);
    return diff >= 0 && diff <= 3;
  }).length;

  // Kanban Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: 'pendente' | 'confirmado' | 'vencido') => {
    e.preventDefault();
    if (!draggedItemId) return;
    
    const transaction = localTransactions.find(t => t.id === draggedItemId);
    if (!transaction || transaction.status === status) {
      setDraggedItemId(null);
      return;
    }
    
    setEditingTransaction({ id: draggedItemId, status });
    setDraggedItemId(null);
    setAttachmentLink(null);
  };

  const handleConfirmEditDrop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const formData = new FormData(e.currentTarget);
    const dateField = formData.get('dateField') as string;

    // Atualizar no Supabase
    const { error } = await supabase
      .from('transactions')
      .update({
        status: editingTransaction.status,
        paid_date: editingTransaction.status === 'confirmado' ? dateField : null,
        due_date: editingTransaction.status !== 'confirmado' ? dateField : null
      })
      .eq('id', editingTransaction.id);

    if (error) {
      alert('Erro ao atualizar status da despesa no banco: ' + error.message);
      return;
    }

    setLocalTransactions(prev => prev.map(t => {
      if (t.id === editingTransaction.id) {
        return {
          ...t,
          status: editingTransaction.status,
          paidDate: editingTransaction.status === 'confirmado' ? dateField : undefined,
          dueDate: editingTransaction.status !== 'confirmado' ? dateField : undefined,
        };
      }
      return t;
    }));
    setEditingTransaction(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', paddingBottom: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>📉 Contas a Pagar</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gestão de pagamentos e fornecedores</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{ padding: '4px 12px', background: viewMode === 'kanban' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
              🗂️ Kanban
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '4px 12px', background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
              📄 Lista
            </button>
          </div>
          {canSeeAllChurches ? (
            <select value={church} onChange={e => setChurch(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
              <option value="ALL">Todas as Igrejas</option>
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div className="search-input glass-input" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.8, pointerEvents: 'none' }}>
              {churches.find(c => c.id === church)?.name || 'Igreja Local'}
            </div>
          )}
          <select value={cultoFilter} onChange={e => setCultoFilter(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
            <option value="ALL">Todos os Cultos</option>
            {availableCultos.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={horarioFilter} onChange={e => setHorarioFilter(e.target.value)} className="search-input glass-input" style={{ padding: '6px 12px' }}>
            <option value="ALL">Todos os Horários</option>
            {availableHorarios.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>De:</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="search-input glass-input" style={{ padding: '5px 10px', fontSize: '0.8rem', colorScheme: 'dark' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até:</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="search-input glass-input" style={{ padding: '5px 10px', fontSize: '0.8rem', colorScheme: 'dark' }} />
            </div>
          </div>
          <button onClick={() => setShowExpenseModal(true)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#e74c3c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            + Nova Despesa
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', flex: 1, overflow: 'hidden' }}>
        
        {/* COL 1: A PAGAR */}
        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, 'pendente')}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}
        >
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(241,196,15,0.15)', border: '1px solid rgba(241,196,15,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#f1c40f' }}>🟡 A PAGAR</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(241,196,15,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{pendentes.length}</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>{formatCurrency(sum(pendentes))}</div>
            {expiringSoonCount > 0 && (
              <div style={{ fontSize: '0.65rem', color: '#f1c40f', marginTop: '4px', fontWeight: 600 }}>
                ⚠️ {expiringSoonCount} vencem em menos de 3 dias
              </div>
            )}
          </div>
          
          {pendentes.map(t => {
             const daysDiff = t.dueDate ? getDaysDiff(t.dueDate) : 999;
             return (
              <div 
                key={t.id} 
                className="glass hover-card" 
                draggable 
                onDragStart={(e) => handleDragStart(e, t.id)}
                onClick={() => { setSelectedTransaction(t); setAttachmentLink(null); }}
                style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {t.category}
                    {t.attachment_url && <span title="Possui anexo" style={{ fontSize: '0.9rem' }}>📎</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1c40f' }}>{formatCurrency(t.amount)}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.description}</div>
                <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>🏢 {getSupplierName(t.supplierId)}</span>
                  <span>💳 {t.paymentMethod}</span>
                  {t.dueDate && <span>📅 Venc: {t.dueDate.split('-').reverse().join('/')}</span>}
                </div>
                {daysDiff <= 3 && daysDiff >= 1 && (
                  <div style={{ fontSize: '0.65rem', background: 'rgba(241,196,15,0.2)', color: '#f1c40f', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                    ⚠️ Vence em {daysDiff} dia(s)
                  </div>
                )}
                {daysDiff === 0 && (
                  <div style={{ fontSize: '0.65rem', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                    🚨 VENCE HOJE
                  </div>
                )}
                {daysDiff < 0 && (
                  <div style={{ fontSize: '0.65rem', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                    🚨 Atrasado
                  </div>
                )}
                {/* Botões antigos removidos em favor do Drag and Drop */}
              </div>
             );
          })}
        </div>

        {/* COL 2: PAGAS */}
        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, 'confirmado')}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}
        >
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#2ecc71' }}>✅ PAGAS</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(46,204,113,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{confirmadas.length}</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>{formatCurrency(sum(confirmadas))}</div>
          </div>
          
          {confirmadas.map(t => (
            <div 
              key={t.id} 
              className="glass hover-card" 
              draggable 
              onDragStart={(e) => handleDragStart(e, t.id)}
              onClick={() => { setSelectedTransaction(t); setAttachmentLink(null); }}
              style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(46,204,113,0.2)', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {t.category}
                  {t.attachment_url && <span title="Possui anexo" style={{ fontSize: '0.9rem' }}>📎</span>}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2ecc71' }}>{formatCurrency(t.amount)}</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.description}</div>
              <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>🏢 {getSupplierName(t.supplierId)}</span>
                <span>💳 {t.paymentMethod}</span>
                {t.paidDate && <span>📅 Pago: {t.paidDate.split('-').reverse().join('/')}</span>}
              </div>
              {/* Botão de estorno removido em favor do Drag and Drop */}
            </div>
          ))}
        </div>

        {/* COL 3: NÃO PAGAS */}
        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, 'vencido')}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}
        >
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#e74c3c' }}>❌ NÃO PAGAS</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(231,76,60,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{vencidas.length}</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>{formatCurrency(sum(vencidas))}</div>
          </div>
          
          {vencidas.map(t => {
            const daysOverdue = t.dueDate ? Math.abs(getDaysDiff(t.dueDate)) : 0;
            return (
              <div 
                key={t.id} 
                className="glass hover-card" 
                draggable 
                onDragStart={(e) => handleDragStart(e, t.id)}
                onClick={() => { setSelectedTransaction(t); setAttachmentLink(null); }}
                style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(231,76,60,0.2)', display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.8, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {t.category}
                    {t.attachment_url && <span title="Possui anexo" style={{ fontSize: '0.9rem' }}>📎</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e74c3c' }}>{formatCurrency(t.amount)}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.description}</div>
                <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>🏢 {getSupplierName(t.supplierId)}</span>
                  {t.dueDate && <span>📅 Venceu: {t.dueDate.split('-').reverse().join('/')}</span>}
                </div>
                <div style={{ fontSize: '0.65rem', background: 'rgba(231,76,60,0.2)', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                  ⏰ Vencida há {daysOverdue} dia(s)
                </div>
                {/* Botões antigos removidos em favor do Drag and Drop */}
              </div>
            );
          })}
        </div>
      </div>
      ) : (
        <div className="glass" style={{ flex: 1, padding: '20px', borderRadius: '12px', overflowY: 'auto' }}>
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Data</th>
                <th style={{ padding: '12px 8px' }}>Descrição</th>
                <th style={{ padding: '12px 8px' }}>Fornecedor</th>
                <th style={{ padding: '12px 8px' }}>Categoria</th>
                <th style={{ padding: '12px 8px' }}>Pagamento</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => {
                const isConfirmed = t.status === 'confirmado';
                const isLate = t.status === 'vencido' || (t.dueDate && getDaysDiff(t.dueDate) < 0 && !isConfirmed);
                return (
                  <tr 
                    key={t.id} 
                    onClick={() => { setSelectedTransaction(t); setAttachmentLink(null); }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                    className="hover-row"
                  >
                    <td style={{ padding: '12px 8px' }}>{t.date.split('-').reverse().join('/')}</td>
                    <td style={{ padding: '12px 8px' }}>{t.description}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{getSupplierName(t.supplierId)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {t.category}
                        {t.attachment_url && <span title="Possui anexo">📎</span>}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t.paymentMethod}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        background: isConfirmed ? 'rgba(46,204,113,0.15)' : isLate ? 'rgba(231,76,60,0.15)' : 'rgba(241,196,15,0.15)',
                        color: isConfirmed ? '#2ecc71' : isLate ? '#e74c3c' : '#f1c40f',
                        padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem'
                      }}>
                        {isConfirmed ? '✅ Pago' : isLate ? '🚨 Atrasado' : '🟡 A Pagar'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: isConfirmed ? '#2ecc71' : isLate ? '#e74c3c' : '#f1c40f' }}>
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma despesa encontrada no período.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* MODAL DE DESPESA */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }}>🔥 {editingFullTransaction ? 'Editar Despesa' : 'Nova Despesa'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Categoria</label>
                  {selectedCategory === 'NOVA' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input name="customCategory" type="text" placeholder="Nova categoria..." required autoFocus className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box', border: '1px solid #f1c40f' }} />
                      <button type="button" onClick={() => setSelectedCategory(despesasCats[0] || 'Aluguel')} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>×</button>
                    </div>
                  ) : (
                    <select name="category" required value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                      {despesasCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="NOVA">➕ Adicionar Nova Categoria...</option>
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Valor (R$)</label>
                  <input name="amount" type="number" step="0.01" min="0" required placeholder="0.00" defaultValue={editingFullTransaction?.amount} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Meio de Pagamento</label>
                  <select name="paymentMethod" required defaultValue={editingFullTransaction?.paymentMethod} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                    {pagamentosCats.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Fornecedor</label>
                  {selectedSupplier === 'NOVO' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input name="customSupplier" type="text" placeholder="Novo fornecedor..." required autoFocus className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box', border: '1px solid #f1c40f' }} />
                      <button type="button" onClick={() => setSelectedSupplier('')} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>×</button>
                    </div>
                  ) : (
                    <select name="supplierId" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Selecione...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option value="NOVO">➕ Adicionar Novo Fornecedor...</option>
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Descrição / Histórico</label>
                  <input name="description" type="text" required placeholder="Ex: Compra de materiais para EBD" defaultValue={editingFullTransaction?.description} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Status do Pagamento</label>
                  <select name="status" defaultValue={editingFullTransaction?.status || 'confirmado'} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}>
                    <option value="confirmado">✅ Pago (Liquidado)</option>
                    <option value="pendente">🟡 Pendente (A Pagar)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Data de Competência</label>
                  <input name="date" type="date" required defaultValue={editingFullTransaction?.date || new Date().toISOString().split('T')[0]} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Data de Vencimento (Opcional)</label>
                  <input name="dueDate" type="date" defaultValue={editingFullTransaction?.dueDate || ''} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                
                {!editingFullTransaction && (
                  <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={isAsset} onChange={e => setIsAsset(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                      Registrar como Patrimônio/Bens (Móveis, Eletrônicos, Imóveis)
                    </label>
                  </div>
                )}
                
                {isAsset && !editingFullTransaction && (
                  <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(52, 152, 219, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 152, 219, 0.3)', marginTop: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3498db', marginBottom: '4px' }}>Nome do Bem / Patrimônio</label>
                      <input name="assetName" type="text" placeholder="Ex: Mesa de Som Yamaha 16 Canais" required={isAsset} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3498db', marginBottom: '4px' }}>Local de Uso/Armazenamento</label>
                      <input name="assetLocation" type="text" placeholder="Ex: Templo Principal - Mesa de Som" required={isAsset} className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowExpenseModal(false); setEditingFullTransaction(null); }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: '8px', background: '#e74c3c', border: 'none', color: '#fff', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Salvando...' : (editingFullTransaction ? '💾 Salvar Alteração' : '🔥 Lançar Despesa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP DE EDIÇÃO KANBAN (DROP) */}
      {editingTransaction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', animation: 'fadeIn 0.2s ease' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingTransaction.status === 'confirmado' ? '✅ Confirmar Pagamento' : editingTransaction.status === 'pendente' ? '🟡 Retornar para A Pagar' : '❌ Marcar como Vencido'}
            </h3>
            <form onSubmit={handleConfirmEditDrop}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  A transação será movida. Deseja atualizar a data?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {editingTransaction.status === 'confirmado' ? 'Data do Pagamento' : 'Nova Data de Vencimento'}
                  </label>
                  <input name="dateField" type="date" required className="search-input glass-input" style={{ padding: '10px', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Anexar Nota Fiscal / Recibo (Opcional)
                  </label>
                  <div style={{ padding: '12px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    {attachmentLink ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                          📄 <span style={{ color: '#3498db', textDecoration: 'underline', cursor: 'pointer' }}>nota_fiscal_v2.pdf</span>
                        </div>
                        <button type="button" onClick={() => setAttachmentLink(null)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.7rem' }}>🗑️</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          type="button"
                          onClick={() => setAttachmentLink('https://fake-storage.supabase.co/nota_fiscal.pdf')}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                          + Anexar Arquivo
                        </button>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Salvo na nuvem.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setEditingTransaction(null)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', background: '#3498db', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>💾 Salvar Alteração</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DE TRANSAÇÃO */}
      {selectedTransaction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedTransaction(null)}>
          <div className="glass" style={{ padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', animation: 'fadeIn 0.2s ease', position: 'relative' }} onClick={e => e.stopPropagation()}>
            
            <button onClick={() => setSelectedTransaction(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  🔥
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Detalhes da Despesa</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: #{selectedTransaction.id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginRight: '30px' }}>
                <button onClick={() => { 
                  setEditingFullTransaction(selectedTransaction); 
                  setSelectedCategory(selectedTransaction.category); 
                  setSelectedSupplier(selectedTransaction.supplierId || ''); 
                  setShowExpenseModal(true); 
                  setSelectedTransaction(null); 
                }} style={{ background: '#3498db', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>📝 Editar</button>
                <button onClick={() => handleDeleteTransaction(selectedTransaction.id)} style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>🗑️ Excluir</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Valor</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e74c3c' }}>{formatCurrency(selectedTransaction.amount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ 
                    background: selectedTransaction.status === 'confirmado' ? 'rgba(46,204,113,0.2)' : 'rgba(241,196,15,0.2)',
                    color: selectedTransaction.status === 'confirmado' ? '#2ecc71' : '#f1c40f',
                    padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem'
                  }}>
                    {selectedTransaction.status === 'confirmado' ? '✅ Pago' : '🟡 A Pagar'}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Descrição</div>
                <div style={{ fontWeight: 600 }}>{selectedTransaction.description}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categoria</div>
                <div style={{ fontWeight: 600 }}>{selectedTransaction.category}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fornecedor</div>
                <div style={{ fontWeight: 600 }}>🏢 {getSupplierName(selectedTransaction.supplierId)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Forma de Pagamento</div>
                <div style={{ fontWeight: 600 }}>💳 {selectedTransaction.paymentMethod}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Data de Competência</div>
                <div style={{ fontWeight: 600 }}>📅 {selectedTransaction.date.split('-').reverse().join('/')}</div>
              </div>
              <div>
                {selectedTransaction.status === 'confirmado' ? (
                  <>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Data de Pagamento</div>
                    <div style={{ fontWeight: 600, color: '#2ecc71' }}>✅ {selectedTransaction.paidDate?.split('-').reverse().join('/')}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Data de Vencimento</div>
                    <div style={{ fontWeight: 600, color: '#f1c40f' }}>⏳ {selectedTransaction.dueDate?.split('-').reverse().join('/')}</div>
                  </>
                )}
              </div>
            </div>

            {/* SEÇÃO DE ANEXO / COMPROVANTE */}
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>📁 Anexos e Notas Fiscais</div>
              
              {selectedTransaction.attachment_url ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    📄 <a href={selectedTransaction.attachment_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', textDecoration: 'underline', cursor: 'pointer' }}>Ver Nota Fiscal</a>
                  </div>
                  <button onClick={() => handleRemoveAttachment(selectedTransaction)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ Remover</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nenhum anexo salvo para esta transação.</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* POPUP DE ETIQUETA / ATIVO GERADO */}
      {showAssetLabelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowAssetLabelModal(null)}>
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAssetLabelModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(46,204,113,0.15)', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
              🎉
            </div>
            
            <h3 style={{ margin: 0, fontSize: '1.2rem', textAlign: 'center', color: '#2ecc71' }}>Ativo Gerado com Sucesso!</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
              O item foi registrado no inventário de patrimônio.
            </p>

            <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <div><strong>Bem:</strong> {showAssetLabelModal.name}</div>
              <div><strong>Local:</strong> {showAssetLabelModal.location}</div>
              <div><strong>Valor:</strong> {formatCurrency(showAssetLabelModal.purchaseValue)}</div>
            </div>

            {/* QR Code */}
            <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '6px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? `${window.location.origin}/qrcode/patrimonio/${showAssetLabelModal.id}` : `https://sistema.igreja.com/qrcode/patrimonio/${showAssetLabelModal.id}`
                )}`} 
                alt="QR Code" 
                width="120" 
                height="120" 
              />
            </div>

            <div style={{ display: 'flex', width: '100%', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={() => setShowAssetLabelModal(null)} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '', 'width=400,height=600');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <body style="font-family: sans-serif; display: flex; flex-direction: column; alignItems: center; text-align: center; padding: 20px;">
                          <h2 style="margin-bottom: 5px;">Patrimônio da Igreja</h2>
                          <h4 style="margin-top: 0; color: #555;">${churches.find((c: any) => c.id === showAssetLabelModal.churchId)?.name || 'Igreja Local'}</h4>
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/qrcode/patrimonio/' + showAssetLabelModal.id)}" />
                          <p style="font-size: 14px; margin-top: 15px; font-weight: bold;">${showAssetLabelModal.name}</p>
                          <p style="font-size: 12px; color: #777;">ID: ${showAssetLabelModal.id}</p>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 500);
                  }
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#3498db', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                🖨️ Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
