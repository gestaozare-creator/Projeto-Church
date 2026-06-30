"use client";

import { useState } from 'react';

interface ChurchIdCardTabProps {
  formData: any;
  setFormData: (data: any) => void;
}

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

export function ChurchIdCardTab({ formData, setFormData }: ChurchIdCardTabProps) {
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncColor, setNewFuncColor] = useState('#cda136');
  const cardConfig = formData.cardConfig || {
    primaryColor: '#3498db',
    showLogo: true,
    showSignature: false,
    customDisclaimer: 'Este documento é de uso exclusivo do membro.'
  };

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      cardConfig: {
        ...cardConfig,
        [field]: value
      }
    });
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => {
        handleChange('backgroundUrl', r.result as string);
      };
      r.readAsDataURL(f);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div style={{ background: 'rgba(52, 152, 219, 0.05)', border: '1px solid rgba(52, 152, 219, 0.2)', padding: '16px', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#3498db' }}>Personalização da Carteirinha de Membro</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Defina o visual e as informações que aparecerão na carteirinha digital e impressa dos membros desta congregação.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Cor Principal da Carteirinha</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="color" 
                  value={cardConfig.primaryColor} 
                  onChange={e => handleChange('primaryColor', e.target.value)}
                  style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="search-input glass-input"
                  value={cardConfig.primaryColor}
                  onChange={e => handleChange('primaryColor', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '4px' }}>
            <label className="input-label">Modelo de Fundo Personalizado (Upload)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', display: 'flex', alignItems: 'center', borderRadius: '8px', fontSize: '0.8rem', color: '#fff', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                📁 Selecionar Arquivo de Fundo
                <input type="file" accept="image/*" onChange={handleBackgroundUpload} style={{ display: 'none' }} />
              </label>
              {cardConfig.backgroundUrl && (
                <button type="button" onClick={() => handleChange('backgroundUrl', null)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>Remover Fundo</button>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>Faça upload de uma imagem (JPG, PNG) para substituir a cor principal pelo seu próprio design. As escritas serão mantidas por cima.</p>
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            <label className="input-label">Termo / Aviso no verso (Disclaimer)</label>
            <textarea 
              className="search-input glass-input"
              rows={3}
              value={cardConfig.customDisclaimer}
              onChange={e => handleChange('customDisclaimer', e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Texto legal ou aviso no verso da carteirinha..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' }}>
              <input type="checkbox" checked={cardConfig.showLogo} onChange={e => handleChange('showLogo', e.target.checked)} /> 
              Exibir Logo da Igreja na Carteirinha
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' }}>
              <input type="checkbox" checked={cardConfig.showSignature} onChange={e => handleChange('showSignature', e.target.checked)} /> 
              Exibir campo para Assinatura do Pastor
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginTop: '10px' }}>
        <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Pré-visualização (Frente):</h5>
        <div style={{ 
          width: '420px', 
          height: '265px', 
          background: cardConfig.backgroundUrl ? `url(${cardConfig.backgroundUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${cardConfig.primaryColor}, #2c3e50)`, 
          borderRadius: '12px',
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          transform: 'scale(0.85)',
          transformOrigin: 'top left'
        }}>
          {/* Photo */}
          <div style={{ 
            position: 'absolute', top: '40px', left: '40px', width: '120px', height: '175px', 
            borderRadius: '12px', background: 'rgba(255,255,255,0.2)', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
            zIndex: 2
          }}>👤</div>

          {/* Function Band */}
          <div style={{ 
            position: 'absolute', top: '110px', left: '175px', right: '15px', height: '40px',
            background: getFunctionColor('presb', cardConfig), 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, letterSpacing: '1.5px', fontSize: '1.1rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)', color: '#fff',
            borderRadius: '4px',
            zIndex: 1
          }}>
            FUNÇÃO
          </div>

          {/* Member Details */}
          <div style={{ position: 'absolute', top: '165px', left: '175px', right: '15px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '3px', zIndex: 1 }}>
            <div><span style={{ opacity: 0.9, fontWeight: 500 }}>NOME:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>NOME DO MEMBRO</span></div>
            <div><span style={{ opacity: 0.9, fontWeight: 500 }}>DATA DE BATISMO:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>DATA DO BATISMO</span></div>
            <div><span style={{ opacity: 0.9, fontWeight: 500 }}>CONGREGAÇÃO:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>NOME DA IGREJA</span></div>
            <div><span style={{ opacity: 0.9, fontWeight: 500 }}>VALIDADE:</span> <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{cardConfig.cardValidity || 'VALIDADE DA CARTEIRINHA'}</span></div>
          </div>

        </div>
      </div>
    </div>
  );
}
