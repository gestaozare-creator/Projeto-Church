"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Asset } from '../../../../lib/mock-data';
import { supabase } from '@/lib/supabaseClient';

export default function PatrimonioQRView() {
  const params = useParams();
  const id = params?.id as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAsset() {
      if (!id) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setAsset({
          id: data.id,
          churchId: data.church_id || '1',
          name: data.name,
          category: data.category,
          condition: data.condition as any,
          location: data.location,
          purchaseValue: Number(data.purchase_value || 0),
          purchaseDate: data.purchase_date || '',
          expenseId: data.expense_id || undefined
        });
        
        if (data.church_id) {
          const { data: churchData } = await supabase.from('churches').select('name').eq('id', data.church_id).maybeSingle();
          if (churchData) {
            setChurchName(churchData.name);
          }
        }
      }
      setLoading(false);
    }
    
    fetchAsset();
  }, [id]);

  const [churchName, setChurchName] = useState('Igreja Desconhecida');

  const getChurchName = () => churchName;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>
        <h2>Carregando informações do patrimônio...</h2>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>
        <h2>Item não encontrado ou removido.</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e1e2f 0%, #12121a 100%)', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🪑</div>
          <h2 style={{ margin: 0, color: '#3498db' }}>{asset.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>ID: #{asset.id}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>Propriedade de</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>⛪ {getChurchName()}</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>Localização Atual</div>
            <div style={{ fontSize: '1rem' }}>{asset.location}</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>Categoria</div>
              <div style={{ fontSize: '1rem' }}>{asset.category}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>Condição</div>
              <div style={{ fontSize: '1rem', color: asset.condition === 'Em Manutenção' ? '#f39c12' : '#2ecc71' }}>{asset.condition}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
          Este item é patrimônio registrado no Sistema Church. Em caso de extravio, por favor, notifique a secretaria da igreja.
        </div>

      </div>

    </div>
  );
}
