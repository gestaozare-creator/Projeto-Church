"use client";

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MinistryFormModalProps {
  onClose: () => void;
  onSave: (ministry: any) => void;
  initialData?: any; // Para modo edição
}

export function MinistryFormModal({ onClose, onSave, initialData }: MinistryFormModalProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    director_pastor_name: initialData?.director_pastor_name || '',
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let logo_url = initialData?.logo_url || null;

    try {
      // 1. Fazer o upload da logo se houver uma nova
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `networks/${fileName}`; // Guardado na pasta networks

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile);

        if (uploadError) {
          throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);

        logo_url = publicUrlData.publicUrl;
      }

      // 2. Salvar no banco de dados (Insert ou Update)
      let dbResponse;
      if (isEditing) {
        dbResponse = await supabase.from('ministries')
          .update({
            name: formData.name,
            director_pastor_name: formData.director_pastor_name,
            logo_url: logo_url
          })
          .eq('id', initialData.id)
          .select();
      } else {
        dbResponse = await supabase.from('ministries')
          .insert([{
            name: formData.name,
            director_pastor_name: formData.director_pastor_name,
            logo_url: logo_url
          }])
          .select();
      }

      if (dbResponse.error) throw new Error(dbResponse.error.message);
      
      if (dbResponse.data && dbResponse.data.length > 0) {
        onSave(dbResponse.data[0]);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ borderRadius: '16px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{isEditing ? 'Editar Rede' : 'Criar Nova Rede'}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isEditing ? 'Atualize as informações do Ministério' : 'Cadastre um Ministério para agrupar Igrejas'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* UPLOAD DA LOGO */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: logoPreview ? `url(${logoPreview}) center/cover` : 'rgba(255,255,255,0.05)', 
                border: '2px dashed rgba(255,255,255,0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {!logoPreview && <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }}>📷</span>}
              <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', textAlign: 'center', fontSize: '0.65rem', padding: '4px 0', color: '#fff', fontWeight: 'bold' }}>
                {logoPreview ? 'Trocar' : 'Upload Logo'}
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>

          <div>
            <label className="input-label">Nome da Rede (Ministério)</label>
            <input 
              required 
              type="text" 
              className="search-input glass-input" 
              placeholder="Ex: Rede Batista Independente"
              style={{ width: '100%' }} 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div>
            <label className="input-label">Pastor Diretor (Responsável pela Rede)</label>
            <input 
              required 
              type="text" 
              className="search-input glass-input" 
              placeholder="Ex: Pr. João Silva"
              style={{ width: '100%' }} 
              value={formData.director_pastor_name} 
              onChange={e => setFormData({...formData, director_pastor_name: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Salvando...' : 'Salvar Rede'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
