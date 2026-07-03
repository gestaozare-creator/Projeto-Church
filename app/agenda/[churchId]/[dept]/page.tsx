"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEK_DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const DEPT_CONFIG: Record<string, { label: string; emoji: string; color: string; roles: Record<string, string> }> = {
  louvor: {
    label: "Ministério de Louvor",
    emoji: "🎵",
    color: "#3498db",
    roles: { Ministro: "🎤", Vocal: "🎵", Violão: "🎸", Guitarra: "🎸", Baixo: "🎻", Teclado: "🎹", Bateria: "🥁" },
  },
  midia: {
    label: "Mídia & Produção",
    emoji: "📡",
    color: "#e74c3c",
    roles: { "Câmera 1": "📷", "Câmera 2": "📷", Transmissão: "📡", Projeção: "🖥️", Som: "🎚️" },
  },
  obreiros: {
    label: "Obreiros",
    emoji: "🤝",
    color: "#f39c12",
    roles: { Portaria: "🚪", Recepção: "🤝", Coleta: "💝", Coordenação: "📋" },
  },
  kids: {
    label: "Kids (Ministério Infantil)",
    emoji: "🧸",
    color: "#fd79a8",
    roles: { "Berçário (0-2)": "🍼", "Maternal (3-5)": "🧸", "Juniores (6-9)": "👦", "Teens (10-12)": "📱", "Apoio": "🤲" },
  },
};

// Map URL param -> DB key used in escalas
const DEPT_DB_KEY: Record<string, string> = {
  louvor: "Louvor",
  midia: "Mídia",
  obreiros: "Obreiros",
  kids: "Kids",
};

export default function AgendaDeptPage() {
  const params = useParams();
  const churchId = params.churchId as string;
  const deptParam = (params.dept as string)?.toLowerCase();

  const deptConfig = DEPT_CONFIG[deptParam] || DEPT_CONFIG.louvor;
  const dbKey = DEPT_DB_KEY[deptParam] || "Louvor";

  const [churchName, setChurchName] = useState("");
  const [escalas, setEscalas] = useState<Record<string, Record<string, string[]>>>({});
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
        let config: any = {};
        if (church.config) {
          if (typeof church.config === "string") {
            try { config = JSON.parse(church.config); } catch { config = {}; }
          } else {
            config = church.config;
          }
        }
        setEscalas(config.escalas?.[dbKey] || {});
      }

      const { data: mems } = await supabase
        .from("members")
        .select("id, name, function")
        .eq("church_id", churchId);
      if (mems) setMembers(mems);

      setLoading(false);
    }
    loadData();
  }, [churchId, dbKey]);

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name || "Membro";
  const getMemberInitial = (id: string) => getMemberName(id).charAt(0).toUpperCase();

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const hasScaleOnDate = (dateStr: string) =>
    Object.values(escalas[dateStr] || {}).some((a: any) => a?.length > 0);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "3rem" }}>⏳</div>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Carregando agenda...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a1628; font-family: 'Segoe UI', system-ui, sans-serif; color: #fff; }
        .day-cell { transition: all 0.15s ease; cursor: default; background: none; outline: none; }
        .day-cell.has-scale { cursor: pointer; }
        .day-cell.has-scale:hover { transform: scale(1.1); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #0a1628 0%, #0d1f3c 60%, #0a1628 100%)`, padding: "0 0 48px", animation: "fadeUp 0.4s ease" }}>

        {/* HEADER */}
        <div style={{ background: `linear-gradient(90deg, ${deptConfig.color}22, transparent)`, borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", padding: "8px 20px", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.2rem" }}>⛪</span>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: deptConfig.color }}>{churchName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.8rem" }}>{deptConfig.emoji}</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{deptConfig.label}</h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem" }}>Clique em um dia destacado para ver a escala</p>
        </div>

        {/* CALENDAR */}
        <div style={{ maxWidth: "480px", margin: "32px auto 0", padding: "0 20px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>

            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <button onClick={() => setCurrentDate(new Date(y, m - 1, 1))} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem" }}>‹</button>
              <h2 style={{ fontWeight: 700, fontSize: "1.05rem", textTransform: "capitalize" }}>{MONTH_NAMES[m]} {y}</h2>
              <button onClick={() => setCurrentDate(new Date(y, m + 1, 1))} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem" }}>›</button>
            </div>

            {/* Weekdays */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", marginBottom: "10px" }}>
              {WEEK_DAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
              {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasScale = hasScaleOnDate(dateStr);
                const isToday = dateStr === today;
                return (
                  <button key={dateStr} className={`day-cell${hasScale ? " has-scale" : ""}`} onClick={() => hasScale && setSelectedDate(dateStr)} style={{ aspectRatio: "1", borderRadius: "10px", border: isToday ? `2px solid ${deptConfig.color}` : hasScale ? `1px solid ${deptConfig.color}55` : "1px solid transparent", background: hasScale ? `linear-gradient(135deg, ${deptConfig.color}33, ${deptConfig.color}0a)` : isToday ? `${deptConfig.color}15` : "rgba(255,255,255,0.03)", color: hasScale ? "#fff" : isToday ? deptConfig.color : "rgba(255,255,255,0.25)", fontSize: "0.85rem", fontWeight: hasScale ? 700 : 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", padding: "2px" }}>
                    {day}
                    {hasScale && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: deptConfig.color, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "20px", justifyContent: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: deptConfig.color, display: "inline-block" }} /> Dia com escala
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "3px", border: `2px solid ${deptConfig.color}`, display: "inline-block" }} /> Hoje
              </span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "0.75rem", marginTop: "32px" }}>Projeto Church • {deptConfig.label}</p>
      </div>

      {/* MODAL */}
      {selectedDate && (() => {
        const dayData = escalas[selectedDate] || {};
        const [dd, mm2, yyyy] = selectedDate.split("-").reverse();
        const entries = Object.entries(dayData).flatMap(([role, ids]: any) =>
          (ids || []).map((id: string) => ({ role, id }))
        );

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(6px)" }} onClick={() => setSelectedDate(null)}>
            <div style={{ background: "linear-gradient(145deg, #0f1b30, #162240)", borderRadius: "20px", padding: "28px", maxWidth: "520px", width: "100%", maxHeight: "88vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)", animation: "scaleIn 0.25s ease" }} onClick={(e) => e.stopPropagation()}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "4px" }}>{deptConfig.emoji} {deptConfig.label}</p>
                  <h2 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 800 }}>{`${dd}/${mm2}/${yyyy}`}</h2>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${deptConfig.color}22`, padding: "4px 12px", borderRadius: "20px", marginTop: "8px", border: `1px solid ${deptConfig.color}44` }}>
                    <span style={{ fontSize: "0.8rem", color: deptConfig.color, fontWeight: 600 }}>👥 {entries.length} {entries.length === 1 ? "pessoa escalada" : "pessoas escaladas"}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedDate(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
              </div>

              {entries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>Nenhuma escala encontrada para este dia.</div>
              ) : (
                <div style={{ background: `${deptConfig.color}15`, borderRadius: "14px", padding: "18px", border: `1px solid ${deptConfig.color}30` }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                    {entries.map(({ role, id }: any) => (
                      <div key={`${role}-${id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "75px" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: `linear-gradient(135deg, ${deptConfig.color}, ${deptConfig.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: "#fff", boxShadow: `0 4px 16px ${deptConfig.color}50` }}>
                          {getMemberInitial(id)}
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{getMemberName(id)}</div>
                          <div style={{ fontSize: "0.7rem", color: deptConfig.color }}>{deptConfig.roles[role] || "•"} {role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
