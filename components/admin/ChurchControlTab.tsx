"use client";

import { useState } from 'react';

type Tab = 'receitas' | 'despesas' | 'pagamentos' | 'departamentos' | 'funcoes';

interface ChurchControlTabProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ChurchControlTab({ formData, setFormData }: ChurchControlTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<Tab>('receitas');
  const [newItem, setNewItem] = useState('');

  // Fallbacks para garantir que existam arrays no formData.config
  const config = formData.config || {};
  const receitas = config.receitas || ['Dízimo', 'Oferta', 'Doação'];
  const despesas = config.despesas || ['Aluguel', 'Energia', 'Água'];
  const pagamentos = config.pagamentos || ['PIX', 'Dinheiro', 'Cartão'];
  const departamentos = formData.departments || ['Louvor', 'Obreiros', 'Infantil'];
  const funcoes = config.funcoes || ['Líder', 'Voluntário'];

  const getActiveList = () => {
    switch(activeSubTab) {
      case 'receitas': return receitas;
      case 'despesas': return despesas;
      case 'pagamentos': return pagamentos;
      case 'departamentos': return departamentos;
      case 'funcoes': return funcoes;
    }
  };

  const updateList = (newList: string[]) => {
    if (activeSubTab === 'departamentos') {
      setFormData({ ...formData, departments: newList });
    } else {
      setFormData({
        ...formData,
        config: {
          ...config,
          [activeSubTab]: newList
        }
      });
    }
  };

  const list = getActiveList();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    updateList([...list, newItem.trim()]);
    setNewItem('');
  };

  const handleRemove = (itemToRemove: string) => {
    updateList(list.filter((i: string) => i !== itemToRemove));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button type="button" onClick={() => setActiveSubTab('receitas')} className="glass" style={{ padding: '8px 12px', borderRadius: '12px', border: activeSubTab === 'receitas' ? '1px solid #3498db' : 'none', color: activeSubTab === 'receitas' ? '#3498db' : '#fff', background: activeSubTab === 'receitas' ? 'rgba(52,152,219,0.1)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          Receitas ({receitas.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('despesas')} className="glass" style={{ padding: '8px 12px', borderRadius: '12px', border: activeSubTab === 'despesas' ? '1px solid #e74c3c' : 'none', color: activeSubTab === 'despesas' ? '#e74c3c' : '#fff', background: activeSubTab === 'despesas' ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          Despesas ({despesas.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('pagamentos')} className="glass" style={{ padding: '8px 12px', borderRadius: '12px', border: activeSubTab === 'pagamentos' ? '1px solid #2ecc71' : 'none', color: activeSubTab === 'pagamentos' ? '#2ecc71' : '#fff', background: activeSubTab === 'pagamentos' ? 'rgba(46,204,113,0.1)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          Pagamentos ({pagamentos.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('departamentos')} className="glass" style={{ padding: '8px 12px', borderRadius: '12px', border: activeSubTab === 'departamentos' ? '1px solid #9b59b6' : 'none', color: activeSubTab === 'departamentos' ? '#9b59b6' : '#fff', background: activeSubTab === 'departamentos' ? 'rgba(155,89,182,0.1)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          Departamentos ({departamentos.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('funcoes')} className="glass" style={{ padding: '8px 12px', borderRadius: '12px', border: activeSubTab === 'funcoes' ? '1px solid #f1c40f' : 'none', color: activeSubTab === 'funcoes' ? '#f1c40f' : '#fff', background: activeSubTab === 'funcoes' ? 'rgba(241,196,15,0.1)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          Funções ({funcoes.length})
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input 
            type="text" 
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            className="search-input glass-input" 
            placeholder={`Nova categoria em ${activeSubTab}...`}
            style={{ flex: 1, padding: '10px' }}
          />
          <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Adicionar</button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {list.map((item: string) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#fff' }}>{item}</span>
              <button type="button" onClick={() => handleRemove(item)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
