"use client";

import { useState } from 'react';

type Tab = 'receitas' | 'despesas' | 'pagamentos' | 'departamentos' | 'funcoes';

export default function ControlePage() {
  const [activeTab, setActiveTab] = useState<Tab>('receitas');

  const [receitas, setReceitas] = useState(['Dízimo', 'Oferta', 'Oferta Oficial', 'Campanha', 'Doação', 'Aluguel de Espaço']);
  const [despesas, setDespesas] = useState(['Aluguel', 'Energia', 'Água', 'Internet/Telefone', 'Manutenção', 'Material de Escritório', 'Salários']);
  const [pagamentos, setPagamentos] = useState(['PIX', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'Boleto']);
  const [departamentos, setDepartamentos] = useState(['Louvor', 'Obreiros', 'Infantil', 'Mídia', 'Pastoral']);
  const [funcoes, setFuncoes] = useState(['Líder de Louvor', 'Baterista', 'Tecladista', 'Obreiro', 'Professora Kids']);

  const getActiveList = () => {
    switch(activeTab) {
      case 'receitas': return receitas;
      case 'despesas': return despesas;
      case 'pagamentos': return pagamentos;
      case 'departamentos': return departamentos;
      case 'funcoes': return funcoes;
    }
  };

  const getSetter = () => {
    switch(activeTab) {
      case 'receitas': return setReceitas;
      case 'despesas': return setDespesas;
      case 'pagamentos': return setPagamentos;
      case 'departamentos': return setDepartamentos;
      case 'funcoes': return setFuncoes;
    }
  };

  const list = getActiveList();
  const setter = getSetter();

  const [newItem, setNewItem] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setter([...list, newItem.trim()]);
    setNewItem('');
  };

  const handleRemove = (itemToRemove: string) => {
    setter(list.filter(i => i !== itemToRemove));
  };

  return (
    <div className="scroll-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: '14px', paddingBottom: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>🔧 Opções de Controle</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gerencie as categorias e opções do sistema globalmente</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button onClick={() => setActiveTab('receitas')} className="glass" style={{ padding: '10px 16px', borderRadius: '20px', border: activeTab === 'receitas' ? '1px solid #3498db' : 'none', color: activeTab === 'receitas' ? '#3498db' : '#fff', background: activeTab === 'receitas' ? 'rgba(52,152,219,0.1)' : '', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Receitas <span style={{ opacity: 0.5, fontSize: '0.7em', marginLeft: '4px' }}>({receitas.length})</span>
        </button>
        <button onClick={() => setActiveTab('despesas')} className="glass" style={{ padding: '10px 16px', borderRadius: '20px', border: activeTab === 'despesas' ? '1px solid #e74c3c' : 'none', color: activeTab === 'despesas' ? '#e74c3c' : '#fff', background: activeTab === 'despesas' ? 'rgba(231,76,60,0.1)' : '', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Despesas <span style={{ opacity: 0.5, fontSize: '0.7em', marginLeft: '4px' }}>({despesas.length})</span>
        </button>
        <button onClick={() => setActiveTab('pagamentos')} className="glass" style={{ padding: '10px 16px', borderRadius: '20px', border: activeTab === 'pagamentos' ? '1px solid #2ecc71' : 'none', color: activeTab === 'pagamentos' ? '#2ecc71' : '#fff', background: activeTab === 'pagamentos' ? 'rgba(46,204,113,0.1)' : '', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Pagamentos <span style={{ opacity: 0.5, fontSize: '0.7em', marginLeft: '4px' }}>({pagamentos.length})</span>
        </button>
        <button onClick={() => setActiveTab('departamentos')} className="glass" style={{ padding: '10px 16px', borderRadius: '20px', border: activeTab === 'departamentos' ? '1px solid #9b59b6' : 'none', color: activeTab === 'departamentos' ? '#9b59b6' : '#fff', background: activeTab === 'departamentos' ? 'rgba(155,89,182,0.1)' : '', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Departamentos <span style={{ opacity: 0.5, fontSize: '0.7em', marginLeft: '4px' }}>({departamentos.length})</span>
        </button>
        <button onClick={() => setActiveTab('funcoes')} className="glass" style={{ padding: '10px 16px', borderRadius: '20px', border: activeTab === 'funcoes' ? '1px solid #f1c40f' : 'none', color: activeTab === 'funcoes' ? '#f1c40f' : '#fff', background: activeTab === 'funcoes' ? 'rgba(241,196,15,0.1)' : '', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Funções <span style={{ opacity: 0.5, fontSize: '0.7em', marginLeft: '4px' }}>({funcoes.length})</span>
        </button>
      </div>

      {/* LISTA */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            className="search-input glass-input" 
            placeholder={`Adicionar novo item em ${activeTab}...`}
            style={{ flex: 1, padding: '12px' }}
          />
          <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '0 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Adicionar</button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
          {list.map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.85rem' }}>{item}</span>
              <button 
                onClick={() => handleRemove(item)}
                style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                title="Remover"
              >×</button>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', gridColumn: '1 / -1' }}>Nenhum item cadastrado nesta categoria.</div>
          )}
        </div>

      </div>
      
    </div>
  );
}
