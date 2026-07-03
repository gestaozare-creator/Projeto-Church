"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const WEEK_DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const LOUVOR_EMOJIS: Record<string, string> = {
  Ministro: "🎤", Vocal: "🎵", Violão: "🎸", Guitarra: "🎸", Baixo: "🎻", Teclado: "🎹", Bateria: "🥁",
};
const MIDIA_EMOJIS: Record<string, string> = {
  "Câmera 1": "📷", "Câmera 2": "📷", Transmissão: "📡", Projeção: "🖥️", Som: "🎚️",
};
const OBREIROS_EMOJIS: Record<string, string> = {
  Portaria: "🚪", Recepção: "🤝", Coleta: "💝", Coordenação: "📋",
};

export default function AgendaPublicaPage() {
  const params = useParams();
  const churchId = params.churchId as string;

  const [churchName, setChurchName] = useState("");
  const [escalas, setEscalas] = useState<{ Louvor?: any; Mídia?: any; Obreiros?: any }>({});
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!churchId) return;

      const { data: church } = await supabase
        .from("churches")
        .select("name, config")
        .eq("id", churchId)
        .single();

      if (church) {
        setChurchName(church.name);
        // Parse config se vier como string
        let config: any = {};
        if (church.config) {
          if (typeof church.config === "string") {
            try { config = JSON.parse(church.config); } catch { config = {}; }
          } else {
            config = church.config;
          }
        }
        setEscalas(config.escalas || {});
      }

      const { data: mems } = await supabase
        .from("members")
        .select("id, name, function, ministry")
        .eq("church_id", churchId);
      if (mems) setMembers(mems);

      setLoading(false);
    }
    loadData();
  }, [churchId]);

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getMemberName = (id: string) => getMember(id)?.name || "Membro";
  const getMemberInitial = (id: string) => getMemberName(id).charAt(0).toUpperCase();

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const hasScaleOnDate = (dateStr: string) => {
    return (
      Object.values(escalas.Louvor?.[dateStr] || {}).some((a: any) => a?.length > 0) ||
      Object.values(escalas.Mídia?.[dateStr] || {}).some((a: any) => a?.length > 0) ||
      Object.values(escalas.Obreiros?.[dateStr] || {}).some((a: any) => a?.length > 0)
    );
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a1628",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
      }}>
        <div style={{ fontSize: "3rem", animation: "spin 1s linear infinite" }}>⏳</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}>Carregando agenda...</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a1628; font-family: 'Segoe UI', system-ui, sans-serif; color: #fff; }
        .day-cell { transition: all 0.15s ease; cursor: default; }
        .day-cell.has-scale { cursor: pointer; }
        .day-cell.has-scale:hover { transform: scale(1.1); box-shadow: 0 0 16px rgba(52,152,219,0.4); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 60%, #0a1628 100%)",
        padding: "0 0 48px",
        animation: "fadeUp 0.4s ease",
      }}>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(90deg, rgba(52,152,219,0.15), rgba(155,89,182,0.1))",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "28px 24px",
          textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "rgba(255,255,255,0.06)", padding: "8px 20px",
            borderRadius: "50px", border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "16px",
          }}>
            <span style={{ fontSize: "1.2rem" }}>⛪</span>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#38bdf8" }}>{churchName}</span>
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>
            Agenda de Escalas
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem" }}>
            Clique em um dia destacado para ver quem está escalado
          </p>
        </div>

        {/* CALENDAR */}
        <div style={{ maxWidth: "480px", margin: "32px auto 0", padding: "0 20px" }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "20px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}>
            {/* Month nav */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "24px",
            }}>
              <button
                onClick={() => setCurrentDate(new Date(y, m - 1, 1))}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
                  width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer",
                  fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >‹</button>
              <h2 style={{ fontWeight: 700, fontSize: "1.05rem", textTransform: "capitalize" }}>
                {MONTH_NAMES[m]} {y}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(y, m + 1, 1))}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
                  width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer",
                  fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >›</button>
            </div>

            {/* Weekday labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", marginBottom: "10px" }}>
              {WEEK_DAYS.map((d) => (
                <div key={d} style={{
                  textAlign: "center", fontSize: "0.7rem", fontWeight: 700,
                  color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px",
                }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
              {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasScale = hasScaleOnDate(dateStr);
                const isToday = dateStr === today;

                return (
                  <button
                    key={dateStr}
                    className={`day-cell${hasScale ? " has-scale" : ""}`}
                    onClick={() => hasScale && setSelectedDate(dateStr)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "10px",
                      border: isToday
                        ? "2px solid #38bdf8"
                        : hasScale
                        ? "1px solid rgba(52,152,219,0.35)"
                        : "1px solid transparent",
                      background: hasScale
                        ? "linear-gradient(135deg, rgba(52,152,219,0.22), rgba(52,152,219,0.06))"
                        : isToday
                        ? "rgba(56,189,248,0.08)"
                        : "rgba(255,255,255,0.03)",
                      color: hasScale ? "#fff" : isToday ? "#38bdf8" : "rgba(255,255,255,0.25)",
                      fontSize: "0.85rem",
                      fontWeight: hasScale ? 700 : 400,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                      padding: "2px",
                    }}
                  >
                    {day}
                    {hasScale && (
                      <div style={{
                        width: "4px", height: "4px", borderRadius: "50%",
                        background: "#38bdf8", flexShrink: 0,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{
              marginTop: "20px", paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: "20px", justifyContent: "center",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8", display: "inline-block" }} />
                Dia com escala
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "3px", border: "2px solid #38bdf8", display: "inline-block" }} />
                Hoje
              </span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "0.75rem", marginTop: "32px" }}>
          Projeto Church • Ministérios
        </p>
      </div>

      {/* MODAL DO DIA */}
      {selectedDate && (() => {
        const louvor = escalas.Louvor?.[selectedDate] || {};
        const midia = escalas.Mídia?.[selectedDate] || {};
        const obreiros = escalas.Obreiros?.[selectedDate] || {};

        const [dd, mm, yyyy] = selectedDate.split("-").reverse();

        const Section = ({ title, emoji, color, data, emojis }: any) => {
          const entries = Object.entries(data).flatMap(([role, ids]: any) =>
            (ids || []).map((id: string) => ({ role, id }))
          );
          if (!entries.length) return null;
          return (
            <div style={{
              background: "rgba(255,255,255,0.04)", borderRadius: "14px",
              padding: "18px", marginBottom: "14px",
              border: `1px solid ${color}30`,
              animation: "scaleIn 0.25s ease",
            }}>
              <h3 style={{
                color, fontSize: "0.95rem", fontWeight: 700, marginBottom: "14px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                {emoji} {title}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                {entries.map(({ role, id }: any) => (
                  <div key={`${role}-${id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "70px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      background: `linear-gradient(135deg, ${color}, ${color}66)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.3rem", fontWeight: 800, color: "#fff",
                      boxShadow: `0 4px 14px ${color}40`,
                    }}>
                      {getMemberInitial(id)}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>{getMemberName(id)}</div>
                      <div style={{ fontSize: "0.7rem", color, opacity: 0.8 }}>{emojis[role] || "•"} {role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        };

        const totalPessoas =
          Object.values(louvor).flat().length +
          Object.values(midia).flat().length +
          Object.values(obreiros).flat().length;

        return (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: "20px",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setSelectedDate(null)}
          >
            <div
              style={{
                background: "linear-gradient(145deg, #0f1b30, #162240)",
                borderRadius: "20px", padding: "28px",
                maxWidth: "560px", width: "100%",
                maxHeight: "88vh", overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                animation: "scaleIn 0.25s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "4px" }}>📅 Escala do culto</p>
                  <h2 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 800 }}>{`${dd}/${mm}/${yyyy}`}</h2>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "rgba(52,152,219,0.15)", padding: "4px 12px",
                    borderRadius: "20px", marginTop: "8px",
                    border: "1px solid rgba(52,152,219,0.3)",
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
                      👥 {totalPessoas} {totalPessoas === 1 ? "pessoa escalada" : "pessoas escaladas"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
                    width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer",
                    fontSize: "1.2rem", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>

              <Section title="Ministério de Louvor" emoji="🎵" color="#3498db" data={louvor} emojis={LOUVOR_EMOJIS} />
              <Section title="Mídia & Produção" emoji="📡" color="#e74c3c" data={midia} emojis={MIDIA_EMOJIS} />
              <Section title="Obreiros" emoji="🤝" color="#f39c12" data={obreiros} emojis={OBREIROS_EMOJIS} />

              {totalPessoas === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>
                  Nenhuma escala encontrada para este dia.
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
