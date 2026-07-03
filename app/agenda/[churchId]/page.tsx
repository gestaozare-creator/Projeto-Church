"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

// Initialize standard Supabase client for public read
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AgendaPublicaPage() {
  const params = useParams();
  const churchId = params.churchId as string;

  const [churchName, setChurchName] = useState("");
  const [escalas, setEscalas] = useState<{
    Louvor?: any;
    Mídia?: any;
    Obreiros?: any;
  }>({});
  const [members, setMembers] = useState<any[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!churchId) return;

      // Load Church Info & Config
      const { data: church } = await supabase
        .from("churches")
        .select("name, config")
        .eq("id", churchId)
        .single();

      if (church) {
        setChurchName(church.name);
        setEscalas(church.config?.escalas || {});
      }

      // Load Members
      const { data: mems } = await supabase
        .from("members")
        .select("id, name")
        .eq("church_id", churchId);
      if (mems) {
        setMembers(mems);
      }
    }
    loadData();
  }, [churchId]);

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name || id;

  const hasScaleOnDate = (dateStr: string) => {
    return (
      (escalas.Louvor &&
        escalas.Louvor[dateStr] &&
        Object.values(escalas.Louvor[dateStr]).some(
          (arr: any) => arr.length > 0,
        )) ||
      (escalas.Mídia &&
        escalas.Mídia[dateStr] &&
        Object.values(escalas.Mídia[dateStr]).some(
          (arr: any) => arr.length > 0,
        )) ||
      (escalas.Obreiros &&
        escalas.Obreiros[dateStr] &&
        Object.values(escalas.Obreiros[dateStr]).some(
          (arr: any) => arr.length > 0,
        ))
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          padding: "20px",
          background: "linear-gradient(90deg, #1e293b, #0f172a)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.2rem", color: "#38bdf8" }}>
          {churchName || "Carregando..."}
        </h1>
        <p
          style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}
        >
          Agenda Pública de Escalas
        </p>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        {/* CALENDAR */}
        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => setCurrentDate(new Date(y, m - 1, 1))}
              style={{
                background: "transparent",
                border: "none",
                color: "#38bdf8",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "10px",
              }}
            >
              {"<"}
            </button>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                textTransform: "capitalize",
              }}
            >
              {currentDate.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(y, m + 1, 1))}
              style={{
                background: "transparent",
                border: "none",
                color: "#38bdf8",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "10px",
              }}
            >
              {">"}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "5px",
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div
                key={i}
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  fontWeight: 600,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "5px",
            }}
          >
            {days.map((d, i) => {
              if (d === null) return <div key={i} />;
              const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const hasScale = hasScaleOnDate(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    aspectRatio: "1/1",
                    background: isSelected
                      ? "#38bdf8"
                      : hasScale
                        ? "rgba(56,189,248,0.15)"
                        : "transparent",
                    color: isSelected
                      ? "#0f172a"
                      : hasScale
                        ? "#38bdf8"
                        : "#fff",
                    border: isSelected
                      ? "none"
                      : hasScale
                        ? "1px solid rgba(56,189,248,0.3)"
                        : "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: isSelected || hasScale ? 700 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* SCALE DETAILS */}
        {selectedDate && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                marginBottom: "15px",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#38bdf8",
                  borderRadius: "50%",
                }}
              />
              Escalas do dia {selectedDate.split("-").reverse().join("/")}
            </h3>

            {!hasScaleOnDate(selectedDate) ? (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  padding: "30px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "12px",
                }}
              >
                Nenhuma escala para este dia.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {/* LOUVOR */}
                {escalas.Louvor &&
                  escalas.Louvor[selectedDate] &&
                  Object.values(escalas.Louvor[selectedDate]).some(
                    (a: any) => a.length > 0,
                  ) && (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #2c3e50, #1a252f)",
                        borderRadius: "12px",
                        padding: "20px",
                        borderLeft: "4px solid #3498db",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 15px 0",
                          color: "#3498db",
                          fontSize: "0.9rem",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        🎵 Ministério de Louvor
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {Object.entries(escalas.Louvor[selectedDate]).map(
                          ([role, mems]: any) => {
                            if (mems.length === 0) return null;
                            return (
                              <div
                                key={role}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "0.8rem",
                                    width: "70px",
                                    paddingTop: "2px",
                                  }}
                                >
                                  {role}:
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "5px",
                                    flex: 1,
                                  }}
                                >
                                  {mems.map((id: string) => (
                                    <span
                                      key={id}
                                      style={{
                                        background: "rgba(0,0,0,0.3)",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.85rem",
                                        color: "#e2e8f0",
                                      }}
                                    >
                                      {getMemberName(id)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {/* MÍDIA */}
                {escalas.Mídia &&
                  escalas.Mídia[selectedDate] &&
                  Object.values(escalas.Mídia[selectedDate]).some(
                    (a: any) => a.length > 0,
                  ) && (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #1e3c2f, #14281f)",
                        borderRadius: "12px",
                        padding: "20px",
                        borderLeft: "4px solid #2ecc71",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 15px 0",
                          color: "#2ecc71",
                          fontSize: "0.9rem",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        📸 Ministério de Mídia
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {Object.entries(escalas.Mídia[selectedDate]).map(
                          ([role, mems]: any) => {
                            if (mems.length === 0) return null;
                            return (
                              <div
                                key={role}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "0.8rem",
                                    width: "70px",
                                    paddingTop: "2px",
                                  }}
                                >
                                  {role}:
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "5px",
                                    flex: 1,
                                  }}
                                >
                                  {mems.map((id: string) => (
                                    <span
                                      key={id}
                                      style={{
                                        background: "rgba(0,0,0,0.3)",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.85rem",
                                        color: "#e2e8f0",
                                      }}
                                    >
                                      {getMemberName(id)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {/* OBREIROS */}
                {escalas.Obreiros &&
                  escalas.Obreiros[selectedDate] &&
                  Object.values(escalas.Obreiros[selectedDate]).some(
                    (a: any) => a.length > 0,
                  ) && (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #4a3818, #30240f)",
                        borderRadius: "12px",
                        padding: "20px",
                        borderLeft: "4px solid #f1c40f",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 15px 0",
                          color: "#f1c40f",
                          fontSize: "0.9rem",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        🛡️ Obreiros / Recepção
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {Object.entries(escalas.Obreiros[selectedDate]).map(
                          ([role, mems]: any) => {
                            if (mems.length === 0) return null;
                            return (
                              <div
                                key={role}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "0.8rem",
                                    width: "70px",
                                    paddingTop: "2px",
                                  }}
                                >
                                  {role}:
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "5px",
                                    flex: 1,
                                  }}
                                >
                                  {mems.map((id: string) => (
                                    <span
                                      key={id}
                                      style={{
                                        background: "rgba(0,0,0,0.3)",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.85rem",
                                        color: "#e2e8f0",
                                      }}
                                    >
                                      {getMemberName(id)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </main>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `,
        }}
      />
    </div>
  );
}
