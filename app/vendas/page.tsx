"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function VendasPage() {
  const [activeTab, setActiveTab] = useState<'secretaria' | 'financeiro' | 'kids'>('secretaria');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const whatsappPhone = '5541999999999';

  const prices = {
    secretaria: 97,
    financeiro: 97,
    kids: 47,
    combo: 197
  };

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === 'yearly') {
      return Math.round(monthlyPrice * 0.8); // 20% desconto no anual
    }
    return monthlyPrice;
  };

  const getWhatsAppLink = (planName: string, price: number) => {
    const text = encodeURIComponent(`Olá! Tenho interesse no *${planName}* (R$ ${price}/mês) do Projeto Church. Gostaria de mais informações para minha igreja!`);
    return `https://wa.me/${whatsappPhone}?text=${text}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* BANNER PROMO ESTÁTICO */}
      <div style={{ background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', color: '#fff', textAlign: 'center', padding: '10px 15px', fontSize: '0.88rem', fontWeight: 600, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        ⚡ Condição Especial de Lançamento: Ganhe 30% de Desconto no Plano Combo Completo!
      </div>

      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
            ⛪
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Projeto Church
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Gestão Eclesiástica Inteligente
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#modulos" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Módulos</a>
          <a href="#planos" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Planos & Preços</a>
          <Link href="/login" style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            Entrar no Sistema
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '60px 20px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 600, marginBottom: '20px' }}>
          ✨ A Plataforma Completa Para Sua Igreja Crescer com Organização
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: '1.25', margin: '0 0 20px 0', background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Tecnologia Moderna para Secretaria, Financeiro e Ministério Infantil
        </h1>

        <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 35px 0' }}>
          Controle membros, dízimos, despesas e visitantes com dashboards inteligentes, automação via WhatsApp e relatórios em tempo real.
        </p>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#planos" style={{ padding: '14px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 10px 25px rgba(99,102,241,0.4)', transition: 'transform 0.2s' }}>
            Conhecer os Planos
          </a>
          <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" style={{ padding: '14px 28px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💬 Falar com Consultor
          </a>
        </div>
      </section>

      {/* MÓDULOS DESTAQUE */}
      <section id="modulos" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 10px 0' }}>Escolha os Módulos que Sua Igreja Precisa</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Contrate apenas o que utilizar ou leve o pacote completo com super desconto.</p>
        </div>

        {/* CONTROLE DE ABAS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '35px' }}>
          <button 
            onClick={() => setActiveTab('secretaria')} 
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: activeTab === 'secretaria' ? '#6366f1' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            📇 Secretaria & Membros
          </button>
          <button 
            onClick={() => setActiveTab('financeiro')} 
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: activeTab === 'financeiro' ? '#2ecc71' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            💰 Gestão Financeira (DRE)
          </button>
          <button 
            onClick={() => setActiveTab('kids')} 
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: activeTab === 'kids' ? '#f39c12' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🧸 Ministério Infantil (Kids)
          </button>
        </div>

        {/* CONTEÚDO DA ABA */}
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
          <div>
            {activeTab === 'secretaria' && (
              <>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#818cf8', marginTop: 0 }}>Módulo de Secretaria & Membros</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>Gerencie todo o rebanho com facilidade. Cadastre membros, obreiros e líderes, emita carteirinhas digitais com QR Code e acompanhe o crescimento.</p>
                <ul style={{ color: '#94a3b8', lineHeight: '2', paddingLeft: '20px' }}>
                  <li>✅ Carteirinha Digital de Membro com QR Code</li>
                  <li>✅ Lembrete de Aniversariantes com Envio no WhatsApp</li>
                  <li>✅ Gestão de Visitantes e Funil de Acompanhamento (Kanban)</li>
                  <li>✅ Gestão de Departamentos e Células</li>
                </ul>
              </>
            )}
            {activeTab === 'financeiro' && (
              <>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80', marginTop: 0 }}>Módulo de Inteligência Financeira</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>Controle completo sobre o caixa da igreja com transparência e relatórios prontos em tempo real.</p>
                <ul style={{ color: '#94a3b8', lineHeight: '2', paddingLeft: '20px' }}>
                  <li>✅ Lançamento Rápido de Dízimos, Ofertas e Campanhas</li>
                  <li>✅ Gestão de Despesas com Anexo de Comprovantes/Notas</li>
                  <li>✅ Relatórios Automáticos de DRE (Demostração do Resultado)</li>
                  <li>✅ Gráficos Comparativos Mês a Mês</li>
                </ul>
              </>
            )}
            {activeTab === 'kids' && (
              <>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24', marginTop: 0 }}>Módulo de Ministério Infantil (Kids)</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>Segurança total e tranquilidade para os pais durante os cultos com tecnologia de ponta.</p>
                <ul style={{ color: '#94a3b8', lineHeight: '2', paddingLeft: '20px' }}>
                  <li>✅ Check-in e Check-out Seguro por QR Code</li>
                  <li>✅ Emissão de Etiquetas para Crianças e Responsáveis</li>
                  <li>✅ Alertas de Alergias e Restrições Alimentares</li>
                  <li>✅ Ficha Dedicada para Visitantes Kids</li>
                </ul>
              </>
            )}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '25px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
              {activeTab === 'secretaria' ? '🎴' : activeTab === 'financeiro' ? '📊' : '🏷️'}
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#fff' }}>Interface Moderna & Intuitiva</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Projetada para rodar em computadores, tablets e celulares sem complicações.</p>
          </div>
        </div>
      </section>

      {/* DEMONSTRAÇÃO DA SECRETARIA */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db', fontSize: '0.82rem', fontWeight: 600, marginBottom: '20px' }}>
            📇 Gestão de Membros Inteligente
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 15px 0', color: '#fff' }}>Muito Mais que uma Ficha Cadastral</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
            Transforme a secretaria da sua igreja em um centro de comando ativo. Automatize cadastros, mapeie seus membros e acompanhe a conversão de visitantes de forma visual.
          </p>
        </div>

        {/* FEATURE 1: DASHBOARD SECRETARIA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-dashboard.png" alt="Dashboard da Secretaria" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Dashboard Consolidado</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Métricas precisas e em tempo real sobre o rebanho. Saiba exatamente a saúde demográfica e ministerial da sua igreja em uma única tela.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#3498db' }}>➔</span> 
                <div><strong>Distribuição Ministerial:</strong> Gráficos detalhados mostrando membros por funções, departamentos e ministérios.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#3498db' }}>➔</span> 
                <div><strong>Evolução e Funil:</strong> Acompanhe a evolução mensal de conversão de visitantes e a taxa de retenção da igreja.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Tenha métricas exatas</button>
            </div>
          </div>
        </div>

        {/* FEATURE 2: CADASTRO ONLINE */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-cadastro.png" alt="Formulário Inteligente e Cadastro Online" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Cadastro Online Inteligente</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Descentralize o trabalho da secretaria. Envie um link personalizado para que o próprio membro ou visitante preencha seus dados de casa.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#9b59b6' }}>➔</span> 
                <div><strong>Logo Personalizada:</strong> O formulário carrega automaticamente a identidade visual da sua igreja, passando profissionalismo.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#9b59b6' }}>➔</span> 
                <div><strong>Validação de Foto:</strong> Orientações claras para o membro anexar a foto perfeita para a emissão da carteirinha digital.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Automatize os cadastros</button>
            </div>
          </div>
        </div>

        {/* FEATURE 3.1: GESTÃO DE MEMBROS E ANIVERSARIANTES */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-membro-editar.png" alt="Edição de Membro Simplificada" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Edição Descomplicada e Aniversariantes</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Mantenha o cadastro sempre atualizado. Com apenas um clique, o modal de edição rápida permite ajustar desde o ministério até a validade da carteirinha do membro, sem sair da tela.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Gestão Ágil:</strong> Controle o status (Ativo, Inativo, Aguardando) e filtre facilmente todos os membros pelo quadro visual intuitivo.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Aniversariantes do Mês:</strong> O sistema tem uma tela dedicada que lista automaticamente quem faz aniversário hoje e no mês, para a igreja nunca esquecer de celebrar com seu rebanho.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Organize seu rebanho</button>
            </div>
          </div>
        </div>

        {/* FEATURE 3.2: INTEGRAÇÃO WHATSAPP */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-whatsapp.png" alt="Integração Automática com WhatsApp" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Comunicação por WhatsApp a um Clique</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Aproximar o pastor e a secretaria dos membros nunca foi tão fácil. O contato é direto, humano e ultra veloz.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#10b981' }}>➔</span> 
                <div><strong>Mensagens Inteligentes:</strong> Ao clicar no ícone do WhatsApp no card do membro, o sistema já gera uma mensagem automática personalizada com o nome dele (ex: "Olá, João. Boa noite, como vai?").</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#10b981' }}>➔</span> 
                <div><strong>Sem Agendar Contatos:</strong> Você não precisa adicionar o número na sua agenda do celular. O disparo é imediato direto para a janela de conversa oficial do membro.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Conecte sua igreja</button>
            </div>
          </div>
        </div>

        {/* FEATURE 3.3: CARTEIRINHA DIGITAL */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-carteirinha.png" alt="Carteirinha de Membro Oficial" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Carteirinha Digital Oficial</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Gere um documento de identificação impecável para os membros da sua congregação. Automático e pronto para emissão.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#0ea5e9' }}>➔</span> 
                <div><strong>Design Profissional:</strong> A carteirinha carrega automaticamente a foto aprovada do membro, a logo da igreja, função, data de batismo e congregação.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#0ea5e9' }}>➔</span> 
                <div><strong>Impressão e PDF:</strong> Envie o PDF no WhatsApp do membro para que ele tenha no celular ou imprima crachás para toda a diretoria de forma padronizada com um clique.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Emita credenciais agora</button>
            </div>
          </div>
        </div>

        {/* FEATURE 4: GESTÃO DE VISITANTES */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-visitantes.png" alt="Gestão de Visitantes" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Acompanhamento de Visitantes (CRM)</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Não deixe nenhum visitante escapar. Trate cada alma com exclusividade usando nosso quadro de acompanhamento no estilo Kanban.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#f39c12' }}>➔</span> 
                <div><strong>Esteira de Conversão:</strong> Mova o visitante de "1º Contato" para "Em Conversão" e, finalmente, integre-o como Membro Oficial com um único botão.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#f39c12' }}>➔</span> 
                <div><strong>Histórico e Engajamento:</strong> Registre como o visitante conheceu a igreja e mantenha a janela de conexão sempre quente via WhatsApp.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Multiplique sua membresia</button>
            </div>
          </div>
        </div>

        {/* FEATURE 5: MAPEAMENTO */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/secretaria-mapeamento.png" alt="Mapeamento Local" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Mapeamento Geográfico Automático</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Visualize onde sua membresia mora de forma inteligente. Ideal para planejar a abertura de novas congregações ou células.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#e74c3c' }}>➔</span> 
                <div><strong>Geolocalização via Satélite:</strong> O sistema converte automaticamente o endereço de cada membro em um pino no mapa, sem nenhum esforço da sua parte.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#e74c3c' }}>➔</span> 
                <div><strong>Raio de Influência:</strong> Identifique imediatamente se um visitante mora perto da igreja ou de algum líder, facilitando o acolhimento local.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Mapeie sua igreja</button>
            </div>
          </div>
        </div>

      </section>

      {/* DEMONSTRAÇÃO DO FINANCEIRO */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ecc71', fontSize: '0.82rem', fontWeight: 600, marginBottom: '20px' }}>
            💰 Inteligência Financeira Real
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 15px 0', color: '#fff' }}>O Fim das Planilhas de Tesouraria</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
            Diferente de sistemas genéricos, o Gestão Church foi desenhado para a realidade da igreja. O gestor, pastor ou tesoureiro tem tudo o que precisa na ponta dos dedos de forma automatizada e visual.
          </p>
        </div>

        {/* FEATURE 1: DASHBOARD */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/financeiro-dashboard.png" alt="Dashboard Financeiro Real" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Dashboard Analítico Completo</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Visão geral do caixa com inteligência em tempo real e relatórios interativos. Tudo gerado automaticamente a cada lançamento.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Fluxo de Caixa Vivo:</strong> Saiba exatamente quanto entrou de dízimos e campanhas, separado por culto e horário.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Inteligência D-Export:</strong> Exportação rápida e estruturada de DRE e gráficos com um clique.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Comparativo YoY (Year-over-Year):</strong> Entenda o crescimento ou queda das receitas da igreja em relação aos anos anteriores.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Comece a organizar suas finanças</button>
            </div>
          </div>
        </div>

        {/* FEATURE 2: KANBAN E LISTA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/financeiro-kanban.png" alt="Kanban de Contas" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', marginBottom: '20px' }} />
            <img src="/financeiro-lista.png" alt="Agrupamento em Lista" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Organização Kanban e Lista Aninhada</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Gerencie contas a pagar e a receber como preferir: movendo os cartões visualmente no modelo Kanban ou detalhando tudo em lista expansível.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#f39c12' }}>➔</span> 
                <div><strong>Módulo Kanban:</strong> Visualize suas despesas em colunas claras (A Pagar, Pago, Atrasado) e gerencie o fluxo facilmente.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#f39c12' }}>➔</span> 
                <div><strong>Lista com Agrupamento Inteligente:</strong> Ao mudar para o modo lista, veja tudo agrupado rigorosamente por Status &gt; Ano &gt; Mês &gt; Dia em uma árvore expansível organizada.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Quero modernizar minha gestão</button>
            </div>
          </div>
        </div>

        {/* FEATURE 3: MODAL DE RECEITAS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/financeiro-modais.png" alt="Lançamento de Receitas" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Lançamento Rápido de Receitas e Dízimos</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Registre entradas financeiras em poucos segundos durante ou após o culto, mantendo o histórico de cada membro impecável.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Categorização Inteligente:</strong> Vincule rapidamente dízimos e ofertas a membros específicos para alimentar o ranking de entradas.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#2ecc71' }}>➔</span> 
                <div><strong>Detalhamento por Culto:</strong> Especifique exatamente em qual culto e horário a entrada ocorreu para gerar estatísticas precisas no painel.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Automatize seus dízimos hoje</button>
            </div>
          </div>
        </div>

        {/* FEATURE 4: MODAL DE DESPESAS E PATRIMÔNIO */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/financeiro-modais1.png" alt="Lançamento de Despesas e Patrimônio" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Gestão de Saídas: Fim da Papelada e Integração Patrimonial</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Diga adeus às pastas cheias de recibos físicos. Centralize tudo na nuvem e evite perda de documentos e tempo precioso.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#e74c3c' }}>➔</span> 
                <div><strong>Armazenamento de Notas:</strong> Tire foto ou suba o arquivo do comprovante/nota fiscal direto no lançamento. O documento fica salvo seguro para consultas futuras, eliminando papéis perdidos.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#e74c3c' }}>➔</span> 
                <div><strong>Gestão de Patrimônio Automática:</strong> Ao registrar a compra de um item (ex: caixa de som, cadeira), marque a opção "Registrar como Patrimônio". O sistema envia o bem diretamente para a página de Gestão de Patrimônio da igreja.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Elimine a papelada agora</button>
            </div>
          </div>
        </div>

        {/* FEATURE 6: LIVRO CAIXA E RELATÓRIOS AUTOMÁTICOS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/relatorios.png" alt="Livro Caixa e Relatórios PDF Automáticos" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Relatórios Automáticos e Livro Caixa</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Só lance entradas e saídas. O sistema faz todo o resto. O livro caixa ganha vida própria e os relatórios ficam disponíveis em PDF sem você precisar montar nada.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#9b59b6' }}>➔</span> 
                <div><strong>Zero Trabalho Braçal:</strong> Chega de formatar planilhas para gerar o Livro Caixa. A cada lançamento, os relatórios mensais e o balanço do mês se atualizam automaticamente.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#9b59b6' }}>➔</span> 
                <div><strong>Imprima ou Salve em PDF:</strong> Prestação de contas transparente. Reunião de diretoria chegando? Clique em imprimir ou exportar PDF e apresente relatórios profissionais e irrefutáveis sobre a saúde da igreja.</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Tenha relatórios automáticos</button>
            </div>
          </div>
        </div>

        {/* FEATURE 5: RELATÓRIO CONTABILIDADE E WHATSAPP */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexDirection: 'row-reverse', marginBottom: '40px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <img src="/relatorio contabilidade.png" alt="Relatório de Contabilidade e Envio via WhatsApp" style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px' }}>Contabilidade a um Clique no WhatsApp</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>Fechamento mensal sem dor de cabeça. Ao final do mês, basta um clique para gerar a pasta com planilhas e comprovantes, e outro clique para enviar direto pelo WhatsApp.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#3498db' }}>➔</span> 
                <div><strong>Botão de Envio Direto:</strong> Ao gerar o relatório da contabilidade, o sistema compila tudo em um pacote e abre automaticamente o WhatsApp pronto para enviar ao contador.</div>
              </li>
              <li style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#3498db' }}>➔</span> 
                <div><strong>Pasta Zipada Completa:</strong> A contabilidade não precisa implorar por notas. O pacote gerado já contém o Excel com os lançamentos mais a pasta de comprovantes anexados!</div>
              </li>
            </ul>
            <div style={{ marginTop: '25px' }}>
              <button onClick={() => window.location.href = '#planos'} className="glass-button" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '0.95rem' }}>Facilite sua contabilidade</button>
            </div>
          </div>
        </div>

      </section>

      {/* TABELA DE PREÇOS */}
      <section id="planos" style={{ padding: '60px 20px 100px', maxWidth: '1150px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '0 0 10px 0' }}>Planos Flexíveis para Cada Necessidade</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Sem fidelidade ou taxa de cancelamento.</p>

          {/* TOGGLE ANUAL / MENSAL */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '15px' }}>
            <span style={{ fontSize: '0.85rem', color: billingCycle === 'monthly' ? '#fff' : '#94a3b8', fontWeight: billingCycle === 'monthly' ? 700 : 400 }}>Mensal</span>
            <button 
              onClick={() => setBillingCycle(p => p === 'monthly' ? 'yearly' : 'monthly')} 
              style={{ width: '40px', height: '22px', borderRadius: '12px', background: billingCycle === 'yearly' ? '#6366f1' : '#475569', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: billingCycle === 'yearly' ? '21px' : '3px', transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: '0.85rem', color: billingCycle === 'yearly' ? '#fff' : '#94a3b8', fontWeight: billingCycle === 'yearly' ? 700 : 400 }}>Anual <small style={{ color: '#4ade80', fontWeight: 700 }}>(20% OFF)</small></span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          
          {/* CARD SECRETARIA */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 5px 0' }}>Secretaria</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 20px 0' }}>Para gestão completa de membros e visitantes.</p>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              R$ {getPrice(prices.secretaria)} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/mês</span>
            </div>
            <ul style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '2', paddingLeft: '18px', flex: 1, marginBottom: '25px' }}>
              <li>Membros & Obreiros</li>
              <li>Carteirinha Digital QR</li>
              <li>Aniversariantes WhatsApp</li>
              <li>Funil de Visitantes</li>
            </ul>
            <a href={getWhatsAppLink('Plano Secretaria', getPrice(prices.secretaria))} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Contratar Secretaria
            </a>
          </div>

          {/* CARD FINANCEIRO */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 5px 0' }}>Financeiro</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 20px 0' }}>Para controle total de entradas e saídas.</p>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              R$ {getPrice(prices.financeiro)} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/mês</span>
            </div>
            <ul style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '2', paddingLeft: '18px', flex: 1, marginBottom: '25px' }}>
              <li>Dízimos & Ofertas</li>
              <li>Despesas & Anexos</li>
              <li>Relatórios de DRE</li>
              <li>Gráficos em Tempo Real</li>
            </ul>
            <a href={getWhatsAppLink('Plano Financeiro', getPrice(prices.financeiro))} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Contratar Financeiro
            </a>
          </div>

          {/* CARD KIDS */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 5px 0' }}>Kids</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 20px 0' }}>Para segurança do Ministério Infantil.</p>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              R$ {getPrice(prices.kids)} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/mês</span>
            </div>
            <ul style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '2', paddingLeft: '18px', flex: 1, marginBottom: '25px' }}>
              <li>Check-in por QR Code</li>
              <li>Impressão de Etiquetas</li>
              <li>Alertas de Alergias</li>
              <li>Ficha Kids Dedicada</li>
            </ul>
            <a href={getWhatsAppLink('Plano Kids', getPrice(prices.kids))} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Contratar Kids
            </a>
          </div>

          {/* CARD COMBO COMPLETO (DESTACADO) */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)', border: '2px solid #6366f1', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', position: 'relative', transform: 'scale(1.03)', boxShadow: '0 10px 30px rgba(99,102,241,0.2)' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#6366f1', color: '#fff', padding: '3px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
              🔥 MAIS POPULAR
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 5px 0', color: '#a5b4fc' }}>Combo Completo</h3>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 20px 0' }}>Todos os módulos integrados com desconto máximo.</p>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              R$ {getPrice(prices.combo)} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/mês</span>
            </div>
            <ul style={{ color: '#f1f5f9', fontSize: '0.85rem', lineHeight: '2', paddingLeft: '18px', flex: 1, marginBottom: '25px' }}>
              <li><strong>TUDO</strong> do Módulo Secretaria</li>
              <li><strong>TUDO</strong> do Módulo Financeiro</li>
              <li><strong>TUDO</strong> do Módulo Kids</li>
              <li>Suporte Prioritário VIP</li>
            </ul>
            <a href={getWhatsAppLink('Combo Completo', getPrice(prices.combo))} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
              Quero o Combo Completo
            </a>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '30px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Projeto Church — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
