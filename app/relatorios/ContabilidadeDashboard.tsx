"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

interface ContabilidadeDashboardProps {
  churchId: string;
  year: number;
}

interface AccountingReportStatus {
  month: number;
  year: number;
  status: 'GERADO';
  generated_at: string;
  generated_by: string;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function ContabilidadeDashboard({ churchId, year }: ContabilidadeDashboardProps) {
  const [reportsStatus, setReportsStatus] = useState<AccountingReportStatus[]>([]);
  const [loadingMonth, setLoadingMonth] = useState<number | null>(null);
  const [churchName, setChurchName] = useState('Igreja');

  // Load church config to get accounting history
  useEffect(() => {
    if (!churchId) return;
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('churches')
        .select('name, config')
        .eq('id', churchId)
        .single();
      
      if (data) {
        setChurchName(data.name || 'Igreja');
        const config = data.config || {};
        if (config.accountingReports) {
          setReportsStatus(config.accountingReports);
        } else {
          setReportsStatus([]);
        }
      }
    };
    fetchConfig();
  }, [churchId]);

  const handleGenerate = async (monthIndex: number) => {
    setLoadingMonth(monthIndex);
    try {
      // 1. Fetch transactions for this month and church
      const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('church_id', churchId)
        .gte('date', startDate)
        .lt('date', endDate)
        .in('type', ['EXPENSE', 'despesa']);

      if (error) throw error;

      // 2. Prepare Excel
      const excelData = (transactions || []).map(t => ({
        Data: t.date,
        Categoria: t.category || '-',
        'Descrição / Fornecedor': t.description || '-',
        'Método de Pagamento': t.payment_method || '-',
        Valor: Number(t.amount || 0),
        'Tem Comprovante?': t.attachment_url ? 'Sim' : 'Não'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Despesas');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // 3. Prepare ZIP
      const zip = new JSZip();
      zip.file(`Resumo_Despesas_${monthNames[monthIndex]}_${year}.xlsx`, excelBuffer);

      const comprovantesFolder = zip.folder("Comprovantes");

      // 4. Download and add receipts
      let counter = 1;
      for (const t of (transactions || [])) {
        if (t.attachment_url) {
          try {
            let fileUrl = t.attachment_url;
            const res = await fetch(fileUrl);
            const blob = await res.blob();

            let ext = 'pdf';
            if (blob.type.includes('image/jpeg')) ext = 'jpg';
            else if (blob.type.includes('image/png')) ext = 'png';
            else if (fileUrl.toLowerCase().endsWith('.jpg') || fileUrl.toLowerCase().endsWith('.jpeg')) ext = 'jpg';
            else if (fileUrl.toLowerCase().endsWith('.png')) ext = 'png';

            const cleanCategory = (t.category || 'Despesa').replace(/[^a-z0-9]/gi, '_');
            const fileName = `${t.date}_${cleanCategory}_R$${t.amount}_(${counter}).${ext}`;
            comprovantesFolder?.file(fileName, blob);
            counter++;
          } catch (err) {
            console.error(`Erro ao baixar anexo para transação ${t.id}`, err);
          }
        }
      }

      // 5. Generate ZIP and Download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Relatorio_Contabil_${churchName.replace(/\s+/g, '_')}_${monthNames[monthIndex]}_${year}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // 6. Save State in Supabase
      const { data: userData } = await supabase.auth.getUser();
      const userMeta = userData?.user?.user_metadata || {};
      const userName = userMeta.name || 'Usuário';

      const newStatus: AccountingReportStatus = {
        month: monthIndex,
        year: year,
        status: 'GERADO',
        generated_at: new Date().toISOString(),
        generated_by: userName
      };

      const updatedHistory = [...reportsStatus.filter(r => !(r.month === monthIndex && r.year === year)), newStatus];
      
      const { data: latestChurch } = await supabase.from('churches').select('config').eq('id', churchId).single();
      const currentConfig = latestChurch?.config || {};
      
      const { error: updateError } = await supabase
        .from('churches')
        .update({
          config: {
            ...currentConfig,
            accountingReports: updatedHistory
          }
        })
        .eq('id', churchId);

      if (updateError) throw updateError;
      
      setReportsStatus(updatedHistory);

    } catch (err) {
      console.error(err);
      alert('Houve um erro ao gerar o relatório contábil.');
    } finally {
      setLoadingMonth(null);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div className="glass" style={{ padding: '20px', borderRadius: '14px' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', color: 'var(--text-primary)' }}>
          📁 Gestão Contábil - {year}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Gere arquivos compactados (.zip) contendo todas as despesas do mês e os respectivos comprovantes anexados para enviar à sua contabilidade.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {monthNames.map((mName, idx) => {
            const status = reportsStatus.find(r => r.month === idx && r.year === year);
            const isGenerated = !!status;

            return (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '12px 16px', 
                background: isGenerated ? 'rgba(46, 204, 113, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isGenerated ? 'rgba(46, 204, 113, 0.2)' : 'var(--card-border)'}`,
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontWeight: 'bold', minWidth: '100px' }}>{mName}</div>
                  {isGenerated ? (
                    <div style={{ fontSize: '0.8rem', color: '#2ecc71', display: 'flex', flexDirection: 'column' }}>
                      <span>✅ Gerado em {new Date(status.generated_at).toLocaleDateString('pt-BR')} às {new Date(status.generated_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Por: {status.generated_by}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#e74c3c' }}>🔴 Pendente</div>
                  )}
                </div>

                <button
                  onClick={() => handleGenerate(idx)}
                  disabled={loadingMonth === idx}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isGenerated ? '#f39c12' : '#3498db',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: loadingMonth === idx ? 'not-allowed' : 'pointer',
                    opacity: loadingMonth === idx ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loadingMonth === idx ? '⏳ Gerando pacote...' : (isGenerated ? '🔄 Gerar Novamente' : '📥 Gerar Relatório ZIP')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
