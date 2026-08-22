"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { processImportRow, ProcessedRow } from '../../utils/importSanitizer';

interface ImportMembersModalProps {
  supabase: any;
  activeChurchId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportMembersModal({ supabase, activeChurchId, onClose, onSuccess }: ImportMembersModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Review, 3: Processing
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [existingPhones, setExistingPhones] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega os telefones existentes da igreja para detectar duplicidade
  useEffect(() => {
    async function loadExisting() {
      if (!activeChurchId) return;
      const { data, error } = await supabase
        .from('members')
        .select('id, phone')
        .eq('church_id', activeChurchId)
        .not('phone', 'is', null)
        .not('phone', 'eq', '');
      
      if (!error && data) {
        const map = new Map<string, string>();
        data.forEach((m: any) => {
          if (m.phone) map.set(m.phone, m.id);
        });
        setExistingPhones(map);
      }
    }
    loadExisting();
  }, [activeChurchId, supabase]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Nome: "João da Silva",
        Telefone: "(27) 99999-9999",
        Email: "joao@email.com",
        "Data de Nascimento": "25/12/1990",
        "Estado Civil": "Casado(a)",
        Função: "Membro",
        Ministério: "Louvor",
        Endereço: "Rua das Flores, 123",
        Batizado: "Sim",
        "Data Batismo": "01/01/2010",
        "Data Integração": "05/01/2010",
        Profissão: "Marceneiro"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_importacao_membros.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (!activeChurchId) {
          alert('Erro: Selecione uma congregação válida no filtro principal antes de importar.');
          return;
        }

        const processed = data.map((row, index) => 
          processImportRow(row, index + 2, activeChurchId, existingPhones) // +2 pois a linha 1 é o header e o array inicia em 0
        );
        
        setRows(processed);
        setStep(2);
      } catch (err) {
        alert("Erro ao ler o arquivo. Certifique-se de que é uma planilha válida.");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirm = async () => {
    setStep(3);
    const validRows = rows.filter(r => r.status !== 'error').map(r => r.data);
    
    // Batch upsert (100 de cada vez)
    const batchSize = 100;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('members')
        .upsert(batch, { onConflict: 'id' }); // Como geramos os IDs no sanitizer ou pegamos o ID existente, podemos usar upsert no ID
        
      if (error) {
        alert(`Erro na importação (lote ${i}): ` + error.message);
        setStep(2);
        return;
      }
      
      setProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }
    
    alert("Importação concluída com sucesso!");
    onSuccess();
    onClose();
  };

  if (!activeChurchId || activeChurchId === 'ALL') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1100]">
        <div className="glass p-6 rounded-2xl w-full max-w-md m-4 text-center">
          <h3 className="text-xl mb-4">⚠️ Atenção</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Você precisa selecionar uma igreja específica no filtro principal para poder importar membros.</p>
          <button onClick={onClose} className="w-full bg-[var(--primary-color)] text-white p-3 rounded-lg font-bold">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1100] p-4">
      <div className="glass p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative" style={{ backgroundColor: '#1a1a1a' }}>
        
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-[var(--text-secondary)] text-xl cursor-pointer">✕</button>
        
        <h2 className="text-xl mb-4 border-b border-[var(--card-border)] pb-3">📥 Importar Membros</h2>

        {step === 1 && (
          <div className="flex flex-col items-center justify-center gap-6 py-10">
            <button 
              onClick={downloadTemplate}
              className="bg-transparent border border-[#2ecc71] text-[#2ecc71] px-4 py-2 rounded-lg font-bold hover:bg-[#2ecc71]/10 transition-colors"
            >
              📊 Baixar Planilha Modelo (Excel)
            </button>
            
            <div 
              className="border-2 border-dashed border-[var(--card-border)] p-12 rounded-xl text-center w-full max-w-md cursor-pointer hover:border-[var(--primary-light)] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-4xl block mb-2">📄</span>
              <p className="font-bold">Clique ou arraste a planilha aqui</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">Formatos suportados: .xlsx, .csv</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-[var(--text-secondary)]">Foram lidas <strong>{rows.length}</strong> linhas da planilha.</p>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-green-400">🟢 OK ({rows.filter(r => r.status === 'ok').length})</span>
                <span className="text-yellow-400">🟡 Correções/Upsert ({rows.filter(r => r.status === 'warning').length})</span>
                <span className="text-red-400">🔴 Erros Críticos ({rows.filter(r => r.status === 'error').length})</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-black/20 rounded-xl border border-[var(--card-border)]">
              <table className="w-full text-left text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead className="sticky top-0 bg-[#222] border-b border-[var(--card-border)] z-10">
                  <tr>
                    <th className="p-3">Linha</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Telefone</th>
                    <th className="p-3">Mensagens / Inteligência</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--table-border)] hover:bg-white/5">
                      <td className="p-3 text-[var(--text-secondary)]">#{r.originalIndex}</td>
                      <td className="p-3">
                        {r.status === 'ok' && <span className="text-green-400 font-bold">🟢</span>}
                        {r.status === 'warning' && <span className="text-yellow-400 font-bold">🟡</span>}
                        {r.status === 'error' && <span className="text-red-400 font-bold">🔴</span>}
                      </td>
                      <td className="p-3 font-medium">{r.data.name || '-'}</td>
                      <td className="p-3">{r.data.phone || '-'}</td>
                      <td className="p-3 text-xs text-[var(--text-secondary)]">
                        {r.messages.length > 0 ? (
                          <ul className="list-disc pl-4 m-0">
                            {r.messages.map((m, idx) => <li key={idx} className={r.status === 'error' ? 'text-red-300' : 'text-yellow-200'}>{m}</li>)}
                          </ul>
                        ) : 'Tudo perfeito'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--card-border)]">
              <button 
                onClick={() => setStep(1)} 
                className="bg-transparent border border-[var(--card-border)] px-4 py-2 rounded-lg font-bold"
              >
                Voltar e Enviar Outro
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={rows.every(r => r.status === 'error')}
                className="bg-[#2ecc71] text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                Confirmar e Importar {rows.filter(r => r.status !== 'error').length} Registros
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <h3 className="text-xl mb-4">Processando Importação...</h3>
            <div className="w-full max-w-md h-4 bg-[var(--card-border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary-color)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-4 font-bold text-[var(--primary-light)]">{progress}% concluído</p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Por favor, não feche esta janela.</p>
          </div>
        )}

      </div>
    </div>
  );
}
