"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface DBVisitor {
  id: string;
  churchId: string;
  date: string;
  status: string;
  culto?: string;
  horario?: string;
}

function DonutChart({
  title,
  data,
  total,
}: {
  title: string;
  data: { key: string; label: string; value: number; color: string }[];
  total: number;
}) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const slices = useMemo(() => {
    const safeTotal = total || 1;
    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    const result = [];
    for (const item of data) {
      if (item.value === 0) continue;

      const startPercent = cumulativePercent;
      const slicePercent = item.value / safeTotal;
      cumulativePercent += slicePercent;
      const endPercent = cumulativePercent;

      const [startX, startY] = getCoordinatesForPercent(startPercent);
      const [endX, endY] = getCoordinatesForPercent(endPercent);
      const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

      let pathData = "";
      if (slicePercent === 1) {
        pathData = `M 1 0 A 1 1 0 1 1 1 -0.0001`;
      } else {
        pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`,
        ].join(" ");
      }

      result.push({ ...item, percent: slicePercent, pathData });
    }
    return result;
  }, [data, total]);

  const hoveredData = slices.find((s) => s.key === hoveredSlice);

  return (
    <div
      className="glass"
      style={{
        padding: "20px",
        borderRadius: "14px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h4
        style={{
          fontSize: "0.9rem",
          margin: "0 0 16px 0",
          color: "var(--text-secondary)",
        }}
      >
        {title}
      </h4>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "160px",
          gap: "20px",
        }}
      >
        {slices.length > 0 ? (
          <>
            <div
              style={{
                position: "relative",
                height: "100%",
                aspectRatio: "1/1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                viewBox="-1.1 -1.1 2.2 2.2"
                style={{
                  height: "100%",
                  width: "100%",
                  transform: "rotate(-90deg)",
                  overflow: "visible",
                }}
              >
                <defs>
                  <mask id={`donutMask-${title.replace(/[^a-z0-9]/gi, "")}`}>
                    <rect x="-1.5" y="-1.5" width="3" height="3" fill="white" />
                    <circle cx="0" cy="0" r="0.65" fill="black" />
                  </mask>
                </defs>
                <g mask={`url(#donutMask-${title.replace(/[^a-z0-9]/gi, "")})`}>
                  {slices.map((slice, i) => {
                    const isHovered = hoveredSlice === slice.key;
                    const scale = isHovered ? "scale(1.08)" : "scale(1)";
                    return (
                      <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        style={{
                          cursor: "pointer",
                          transform: scale,
                          transformOrigin: "center",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={() => setHoveredSlice(slice.key)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </g>
              </svg>
              {/* Texto Central */}
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  textAlign: "center",
                  width: "60%",
                }}
              >
                {hoveredData ? (
                  <>
                    <span
                      style={{
                        fontSize: "0.55rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        lineHeight: "1.2",
                      }}
                    >
                      {hoveredData.label}
                    </span>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: hoveredData.color,
                        lineHeight: "1.2",
                      }}
                    >
                      {(hoveredData.percent * 100).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        lineHeight: "1.2",
                      }}
                    >
                      Total
                    </span>
                    <span
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "#fff",
                        lineHeight: "1.2",
                      }}
                    >
                      {total}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legenda Lateral */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flex: 1,
                overflowY: "auto",
                maxHeight: "140px",
              }}
            >
              {data.map((item, i) => {
                if (item.value === 0) return null;
                const isHovered = hoveredSlice === item.key;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      opacity: hoveredSlice && !isHovered ? 0.3 : 1,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={() => setHoveredSlice(item.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            Sem dados
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardSecretariaPage() {
  const { currentUser, canSeeAllChurches } = useAuth();

  const [church, setChurch] = useState(
    canSeeAllChurches ? "ALL" : currentUser?.churchId || "",
  );
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), 0, 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), 11, 31).toISOString().split("T")[0];
  });
  const [cultoFilter, setCultoFilter] = useState("ALL");
  const [horarioFilter, setHorarioFilter] = useState("ALL");

  const [dbChurches, setDbChurches] = useState<any[]>([]);

  const availableHorarios = useMemo(() => {
    let svcs: any[] = [];
    if (church === "ALL") {
      svcs = dbChurches.flatMap((c) => c.services || []);
    } else {
      const c = dbChurches.find((c) => c.id === church);
      svcs = c?.services || [];
    }
    if (cultoFilter === "ALL") {
      const times = new Set(svcs.map((s) => s.time));
      return Array.from(times).sort();
    } else {
      const times = new Set(
        svcs.filter((s) => s.name === cultoFilter).map((s) => s.time),
      );
      return Array.from(times).sort();
    }
  }, [church, cultoFilter, dbChurches]);

  // Lista dinâmica de cultos baseada no banco para o filtro superior
  const availableCultos = useMemo(() => {
    let svcs: any[] = [];
    if (church === "ALL") {
      svcs = dbChurches.flatMap((c) => c.services || []);
    } else {
      const c = dbChurches.find((c) => c.id === church);
      svcs = c?.services || [];
    }
    const names = new Set(svcs.map((s) => s.name));
    return Array.from(names).sort();
  }, [church, dbChurches]);

  useEffect(() => {
    setHorarioFilter("ALL");
  }, [cultoFilter]);

  // Estados para o Gráfico Comparativo
  const [cmpYear1, setCmpYear1] = useState("2026");
  const [cmpYear2, setCmpYear2] = useState("2025");
  const [chartType, setChartType] = useState<"barra" | "linha">("linha");
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [activeLegends, setActiveLegends] = useState({
    members: true,
    visitors: true,
    converting: true,
    total: true,
  });

  useEffect(() => {
    if (!canSeeAllChurches && currentUser?.churchId) {
      setChurch(currentUser.churchId);
    }
  }, [canSeeAllChurches, currentUser]);

  const [members, setMembers] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<DBVisitor[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      // Carregar igrejas e os cultos do Supabase
      const { data: churchesDb } = await supabase.from("churches").select("*");
      const { data: servicesDb } = await supabase
        .from("church_services")
        .select("*");

      if (churchesDb) {
        setDbChurches(
          churchesDb.map((c) => {
            const svcs = (servicesDb || [])
              .filter((s) => s.church_id === c.id)
              .map((s) => ({
                id: s.id,
                name: s.name,
                dayOfWeek: s.day_of_week,
                time: s.time,
              }));
            return {
              id: c.id,
              name: c.name,
              isHeadquarters: c.is_headquarters,
              services: svcs,
            };
          }),
        );
      }

      // Carregar membros do Supabase
      const { data: membersDb } = await supabase.from("members").select("*");

      if (membersDb) {
        // Filtramos apenas membros e lideranças (excluindo os visitantes do funil)
        const membersOnly = membersDb.filter(
          (m) =>
            m.function !== "Visitante" && m.function !== "Visitante (Kids)",
        );
        setMembers(
          membersOnly.map((m) => ({
            id: m.id,
            churchId: m.church_id || "1",
            name: m.name,
            status: m.status,
            ministry: m.ministry,
            function: m.function,
            culto: m.culto || "",
            horario: m.horario || "",
            integrationDate:
              m.integration_date ||
              (m.created_at ? m.created_at.split("T")[0] : "2026-01-01"),
          })),
        );

        // Visitantes (tanto cadastrados na triagem local quanto no formulário público online)
        const visitorsOnly = membersDb.filter(
          (m) =>
            m.function === "Visitante" || m.function === "Visitante (Kids)",
        );
        setVisitors(
          visitorsOnly.map((v) => ({
            id: v.id,
            churchId: v.church_id || "1",
            date:
              v.integration_date ||
              (v.created_at ? v.created_at.split("T")[0] : "2026-01-01"),
            status:
              v.status === "ativo"
                ? "membro"
                : v.status === "pendente"
                  ? "em_conversao"
                  : "visitante",
            culto: v.culto || "",
            horario: v.horario || "",
          })),
        );
      }
    }

    fetchDashboardData();
  }, []);

  // 1. Filtrar Membros (Global e por período, incluindo Culto e Horário)
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (church !== "ALL" && m.churchId !== church) return false;

      // Filtros superiores de cultos e horários
      if (cultoFilter !== "ALL" && m.culto !== cultoFilter) return false;
      if (
        horarioFilter !== "ALL" &&
        m.horario &&
        !m.horario.includes(horarioFilter)
      )
        return false;

      const date = m.integrationDate || "2026-01-01";
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [members, church, startDate, endDate, cultoFilter, horarioFilter]);

  // 2. Filtrar Visitantes (Global e por período, incluindo Culto e Horário)
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      if (church !== "ALL" && v.churchId !== church) return false;

      // Filtros superiores de cultos e horários
      if (cultoFilter !== "ALL" && v.culto !== cultoFilter) return false;
      if (
        horarioFilter !== "ALL" &&
        v.horario &&
        !v.horario.includes(horarioFilter)
      )
        return false;

      if (startDate && v.date < startDate) return false;
      if (endDate && v.date > endDate) return false;
      return true;
    });
  }, [visitors, church, startDate, endDate, cultoFilter, horarioFilter]);

  // --- KPIs Principais ---
  const kpiMembrosAtivos = filteredMembers.filter(
    (m) => m.status === "ativo",
  ).length;
  const kpiMembrosInativos = filteredMembers.filter(
    (m) => m.status === "inativo",
  ).length;
  const kpiMembrosPendentes = filteredMembers.filter(
    (m) => m.status === "pendente",
  ).length;

  // --- Gráfico de Ministérios ---
  const ministriesData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers
      .filter((m) => m.status === "ativo")
      .forEach((m) => {
        const min = m.ministry || "Sem Ministério";
        map.set(min, (map.get(min) || 0) + 1);
      });

    const colors = [
      "#3498db",
      "#9b59b6",
      "#2ecc71",
      "#f1c40f",
      "#e67e22",
      "#e74c3c",
      "#1abc9c",
      "#34495e",
    ];
    return Array.from(map.entries())
      .map(([key, val], i) => ({
        key,
        label: key,
        value: val,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMembers]);

  const totalActiveMembers = filteredMembers.filter(
    (m) => m.status === "ativo",
  ).length;

  // --- Gráfico de Situação Profissional ---
  const employmentStatusData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.forEach((m) => {
      const s = m.employment_status || "Não Informada";
      map.set(s, (map.get(s) || 0) + 1);
    });

    const colors = ["#2ecc71", "#3498db", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c", "#1abc9c", "#34495e"];
    return Array.from(map.entries())
      .map(([key, val], i) => ({
        key,
        label: key,
        value: val,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMembers]);

  // --- Gráfico de Profissões ---
  const professionsData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.forEach((m) => {
      const p = m.profession || "Não Informada";
      map.set(p, (map.get(p) || 0) + 1);
    });

    const colors = ["#9b59b6", "#f1c40f", "#1abc9c", "#e74c3c", "#3498db", "#2ecc71", "#e67e22", "#34495e"];
    return Array.from(map.entries())
      .map(([key, val], i) => ({
        key,
        label: key,
        value: val,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMembers]);

  // --- Gráfico de Funções ---
  const functionsData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMembers.forEach((m) => {
      const f = m.function || "Outros";
      map.set(f, (map.get(f) || 0) + 1);
    });

    const colors = [
      "#1abc9c",
      "#2ecc71",
      "#3498db",
      "#e67e22",
      "#e74c3c",
      "#9b59b6",
      "#f1c40f",
      "#34495e",
    ];
    return Array.from(map.entries())
      .map(([key, val], i) => ({
        key,
        label: key,
        value: val,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMembers]);

  const totalMembersCount = filteredMembers.length;

  // --- Funil de Conversão ---
  const funnelData = useMemo(() => {
    const totalVisits = filteredVisitors.length;
    const converting = filteredVisitors.filter(
      (v) => v.status === "em_conversao",
    ).length;
    const consolidated = filteredVisitors.filter(
      (v) => v.status === "membro",
    ).length;

    return {
      visitantes: totalVisits,
      emConversao: converting,
      membros: consolidated,
    };
  }, [filteredVisitors]);

  // --- Gráficos de Linha Restabelecidos ---
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const comparativeData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const isPastYear = parseInt(cmpYear1) < currentYear;
    const isCurrentYear = parseInt(cmpYear1) === currentYear;
    const maxMonthToFill = isPastYear ? 11 : (isCurrentYear ? currentMonth : -1);

    const data = months.map((m, index) => {
      const shouldFill = index <= maxMonthToFill;
      return {
        month: m,
        members: shouldFill ? 0 : null,
        visitors: shouldFill ? 0 : null,
        converting: shouldFill ? 0 : null,
        total: shouldFill ? 0 : null,
      };
    });
    
    // Membros are members integrated this year
    filteredMembers.forEach((m) => {
      const d = m.integrationDate || "2026-01-01";
      if (d.startsWith(cmpYear1)) {
        const mIdx = parseInt(d.split("-")[1]) - 1;
        if (data[mIdx] && mIdx <= maxMonthToFill) {
          data[mIdx].members!++;
        }
      }
    });

    // Visitors and Conversions this year
    filteredVisitors.forEach((v) => {
      if (v.date.startsWith(cmpYear1)) {
        const mIdx = parseInt(v.date.split("-")[1]) - 1;
        if (data[mIdx] && mIdx <= maxMonthToFill) {
          if (v.status === "visitante") {
            data[mIdx].visitors!++;
          } else if (v.status === "em_conversao") {
            data[mIdx].converting!++;
          } else if (v.status === "membro") {
            data[mIdx].members!++;
          }
        }
      }
    });

    // Calculate totals
    data.forEach((d) => {
      if (d.members !== null || d.visitors !== null || d.converting !== null) {
        d.total = (d.members || 0) + (d.visitors || 0) + (d.converting || 0);
      }
    });

    return data;
  }, [filteredMembers, filteredVisitors, cmpYear1, months]);

  const maxTypeValues = Math.max(
    ...comparativeData.map((d) => Math.max(
      activeLegends.members ? (d.members || 0) : 0,
      activeLegends.visitors ? (d.visitors || 0) : 0,
      activeLegends.converting ? (d.converting || 0) : 0,
      activeLegends.total ? (d.total || 0) : 0
    )),
    1,
  );

  const buildSmoothLinePath = (
    yearKey: "members" | "visitors" | "converting" | "total",
    maxVal: number,
  ) => {
    if (comparativeData.length === 0) return "";
    const points = comparativeData.map((d, i) => {
      const val = d[yearKey];
      if (val === null) return null;
      return { x: (i / 11) * 100, y: 90 - (val / maxVal) * 80 };
    });
    const segments: { x: number; y: number }[][] = [];
    let currentSegment: { x: number; y: number }[] = [];
    for (const pt of points) {
      if (pt) currentSegment.push(pt);
      else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    let path = "";
    for (const seg of segments) {
      if (seg.length === 1) {
        path += ` M ${seg[0].x} ${seg[0].y} L ${seg[0].x} ${seg[0].y}`;
        continue;
      }
      path += ` M ${seg[0].x} ${seg[0].y}`;
      for (let i = 1; i < seg.length; i++) {
        path += ` L ${seg[i].x} ${seg[i].y}`;
      }
    }
    return path;
  };

  // --- Gráfico Rosca Visitantes ---
  const visitorSummaryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredVisitors.forEach((v) => {
      map.set(v.status, (map.get(v.status) || 0) + 1);
    });

    return [
      {
        key: "visitante",
        label: "Apenas Visitante",
        value: map.get("visitante") || 0,
        color: "#f1c40f",
      },
      {
        key: "em_conversao",
        label: "Em Conversão",
        value: map.get("em_conversao") || 0,
        color: "#e67e22",
      },
      {
        key: "membro",
        label: "Consolidados (Membro)",
        value: map.get("membro") || 0,
        color: "#2ecc71",
      },
    ];
  }, [filteredVisitors]);

  const totalVisitorsCount = filteredVisitors.length;

  return (
    <div className="page-wrapper" style={{ paddingBottom: "10px" }}>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.6rem", marginBottom: "5px" }}>
            📊 Dashboard da Secretaria
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Métricas consolidadas de membros, departamentos e conversão de
            almas.
          </p>
        </div>
      </div>

      {/* FILTROS SUPERIORES */}
      <div
        className="glass"
        style={{
          padding: "16px 20px",
          borderRadius: "14px",
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        {canSeeAllChurches && (
          <div style={{ flex: 1.5, minWidth: "150px" }}>
            <label
              className="input-label"
              style={{ marginBottom: "5px", display: "block" }}
            >
              Igreja
            </label>
            <select
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              className="search-input glass-input"
              style={{ width: "100%", padding: "9px 12px" }}
            >
              <option value="ALL">Todas as Igrejas</option>
              {dbChurches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div style={{ flex: 1.2, minWidth: "130px" }}>
          <label
            className="input-label"
            style={{ marginBottom: "5px", display: "block" }}
          >
            Culto
          </label>
          <select
            value={cultoFilter}
            onChange={(e) => setCultoFilter(e.target.value)}
            className="search-input glass-input"
            style={{ width: "100%", padding: "9px 12px" }}
          >
            <option value="ALL">Todos os Cultos</option>
            {availableCultos.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1.2, minWidth: "130px" }}>
          <label
            className="input-label"
            style={{ marginBottom: "5px", display: "block" }}
          >
            Horário
          </label>
          <select
            value={horarioFilter}
            onChange={(e) => setHorarioFilter(e.target.value)}
            className="search-input glass-input"
            style={{ width: "100%", padding: "9px 12px" }}
          >
            <option value="ALL">Todos os Horários</option>
            {availableHorarios.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "110px" }}>
          <label
            className="input-label"
            style={{ marginBottom: "5px", display: "block" }}
          >
            De:
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="search-input glass-input"
            style={{ width: "100%", padding: "8px 12px" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: "110px" }}>
          <label
            className="input-label"
            style={{ marginBottom: "5px", display: "block" }}
          >
            Até:
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="search-input glass-input"
            style={{ width: "100%", padding: "8px 12px" }}
          />
        </div>
      </div>

      {/* KPIS PRINCIPAIS */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "15px",
        }}
      >
        <div
          className="glass"
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "12px 16px",
            borderRadius: "14px",
            borderLeft: "4px solid #3498db",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Total de Membros
            </span>
            <h3
              style={{
                fontSize: "2rem",
                margin: "5px 0 0 0",
                fontWeight: "800",
              }}
            >
              {totalMembersCount}
            </h3>
          </div>
          <span style={{ fontSize: "2rem" }}>📁</span>
        </div>
        <div
          className="glass"
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "12px 16px",
            borderRadius: "14px",
            borderLeft: "4px solid #2ecc71",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Ativos
            </span>
            <h3
              style={{
                fontSize: "2rem",
                margin: "5px 0 0 0",
                fontWeight: "800",
                color: "#2ecc71",
              }}
            >
              {kpiMembrosAtivos}
            </h3>
          </div>
          <span style={{ fontSize: "2rem" }}>✅</span>
        </div>
        <div
          className="glass"
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "12px 16px",
            borderRadius: "14px",
            borderLeft: "4px solid #f1c40f",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Aguardando Aprovação
            </span>
            <h3
              style={{
                fontSize: "2rem",
                margin: "5px 0 0 0",
                fontWeight: "800",
                color: "#f1c40f",
              }}
            >
              {kpiMembrosPendentes}
            </h3>
          </div>
          <span style={{ fontSize: "2rem" }}>⏳</span>
        </div>
        <div
          className="glass"
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "12px 16px",
            borderRadius: "14px",
            borderLeft: "4px solid #e74c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Inativos
            </span>
            <h3
              style={{
                fontSize: "2rem",
                margin: "5px 0 0 0",
                fontWeight: "800",
                color: "#e74c3c",
              }}
            >
              {kpiMembrosInativos}
            </h3>
          </div>
          <span style={{ fontSize: "2rem" }}>🚫</span>
        </div>
      </div>

      {/* DASHBOARDS SEÇÃO 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "25px",
        }}
      >
        <DonutChart
          title="🔊 Membros por Ministérios"
          data={ministriesData}
          total={totalActiveMembers}
        />
        <DonutChart
          title="🏢 Membros por Funções/Depart."
          data={functionsData}
          total={totalMembersCount}
        />

        <DonutChart
          title="💼 Situação Profissional"
          data={employmentStatusData}
          total={totalMembersCount}
        />
        <DonutChart
          title="👷 Profissões"
          data={professionsData}
          total={totalMembersCount}
        />

              </div>

      {/* GRÁFICO 1: EVOLUÇÃO MENSAL */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="glass"
          style={{
            flex: "2.3 1 500px",
            padding: "20px",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            minHeight: "300px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h4 style={{ fontSize: "1rem", margin: 0, color: "#fff" }}>
                👥 Evolução Mensal de Conversão Visitante e Membros
              </h4>
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}
              >
                <div
                  onClick={() => setActiveLegends(prev => ({...prev, members: !prev.members}))}
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", opacity: activeLegends.members ? 1 : 0.5 }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#2ecc71",
                      borderRadius: "3px",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Membros
                  </span>
                </div>
                <div
                  onClick={() => setActiveLegends(prev => ({...prev, visitors: !prev.visitors}))}
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", opacity: activeLegends.visitors ? 1 : 0.5 }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#f1c40f",
                      borderRadius: "3px",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Visitantes
                  </span>
                </div>
                <div
                  onClick={() => setActiveLegends(prev => ({...prev, converting: !prev.converting}))}
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", opacity: activeLegends.converting ? 1 : 0.5 }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#e67e22",
                      borderRadius: "3px",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Em Conversão
                  </span>
                </div>
                <div
                  onClick={() => setActiveLegends(prev => ({...prev, total: !prev.total}))}
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", opacity: activeLegends.total ? 1 : 0.5 }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#3498db",
                      borderRadius: "3px",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Total
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              position: "relative",
              minHeight: "220px",
              marginTop: "10px",
              paddingBottom: "20px",
            }}
          >
            {/* Linhas de Grade e Eixo X */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {[...Array(5)].map((_, i) => (
                <div
                  key={`grid-${i}`}
                  style={{
                    borderBottom: "1px dashed rgba(255,255,255,0.05)",
                    width: "100%",
                    height: "0",
                  }}
                />
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {months.map((m) => (
                  <div
                    key={m}
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico SVG */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "visible",
                display: "block",
              }}
            >
              {activeLegends.members && (
                <path
                  d={buildSmoothLinePath("members", maxTypeValues)}
                  fill="none"
                  stroke="#2ecc71"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              )}
              {activeLegends.visitors && (
                <path
                  d={buildSmoothLinePath("visitors", maxTypeValues)}
                  fill="none"
                  stroke="#f1c40f"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              )}
              {activeLegends.converting && (
                <path
                  d={buildSmoothLinePath("converting", maxTypeValues)}
                  fill="none"
                  stroke="#e67e22"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              )}
              {activeLegends.total && (
                <path
                  d={buildSmoothLinePath("total", maxTypeValues)}
                  fill="none"
                  stroke="#3498db"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeDasharray="5,5"
                />
              )}
            </svg>

            {/* Hover Areas */}
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
              {comparativeData.map((d, i) => {
                const isHovered = hoveredMonthIdx === i;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      position: "relative",
                      cursor: "crosshair",
                    }}
                    onMouseEnter={() => setHoveredMonthIdx(i)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                  >
                    {isHovered && (
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: 0,
                          bottom: 0,
                          width: "1px",
                          background: "rgba(255,255,255,0.1)",
                          transform: "translateX(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dots */}
            {comparativeData.map((d, i) => {
              const left = `${(i / 11) * 100}%`;
              const topMembers = d.members !== null ? `${90 - (d.members / maxTypeValues) * 80}%` : null;
              const topVisitors = d.visitors !== null ? `${90 - (d.visitors / maxTypeValues) * 80}%` : null;
              const topConverting = d.converting !== null ? `${90 - (d.converting / maxTypeValues) * 80}%` : null;
              const topTotal = d.total !== null ? `${90 - (d.total / maxTypeValues) * 80}%` : null;
              const isHovered = hoveredMonthIdx === i;
              
              return (
                <div
                  key={`dots2-${i}`}
                  style={{
                    position: "absolute",
                    left,
                    top: 0,
                    width: 0,
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  {activeLegends.members && topMembers && (
                    <div
                      style={{
                        position: "absolute",
                        top: topMembers,
                        width: isHovered ? "14px" : "10px",
                        height: isHovered ? "14px" : "10px",
                        background: "#2ecc71",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "2px solid #1a1a2e",
                        boxShadow: isHovered ? "0 0 10px #2ecc71" : "none",
                        zIndex: 3,
                        transition: "all 0.2s",
                      }}
                    />
                  )}
                  {activeLegends.visitors && topVisitors && (
                    <div
                      style={{
                        position: "absolute",
                        top: topVisitors,
                        width: isHovered ? "14px" : "10px",
                        height: isHovered ? "14px" : "10px",
                        background: "#f1c40f",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "2px solid #1a1a2e",
                        boxShadow: isHovered ? "0 0 10px #f1c40f" : "none",
                        zIndex: 3,
                        transition: "all 0.2s",
                      }}
                    />
                  )}
                  {activeLegends.converting && topConverting && (
                    <div
                      style={{
                        position: "absolute",
                        top: topConverting,
                        width: isHovered ? "14px" : "10px",
                        height: isHovered ? "14px" : "10px",
                        background: "#e67e22",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "2px solid #1a1a2e",
                        boxShadow: isHovered ? "0 0 10px #e67e22" : "none",
                        zIndex: 3,
                        transition: "all 0.2s",
                      }}
                    />
                  )}
                  {activeLegends.total && topTotal && (
                    <div
                      style={{
                        position: "absolute",
                        top: topTotal,
                        width: isHovered ? "14px" : "10px",
                        height: isHovered ? "14px" : "10px",
                        background: "#3498db",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "2px solid #1a1a2e",
                        boxShadow: isHovered ? "0 0 10px #3498db" : "none",
                        zIndex: 3,
                        transition: "all 0.2s",
                      }}
                    />
                  )}

                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        top: "0%",
                        left: i > 8 ? "auto" : "20px",
                        right: i > 8 ? "20px" : "auto",
                        transform: "translateY(-50%)",
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "10px",
                        borderRadius: "8px",
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                          textAlign: "center",
                          marginBottom: "2px",
                        }}
                      >
                        {d.month}
                      </div>
                      {activeLegends.members && d.members !== null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              background: "#2ecc71",
                              borderRadius: "2px",
                            }}
                          />
                          <span style={{ color: "#fff" }}>Membros:</span>{" "}
                          <strong>{d.members}</strong>
                        </div>
                      )}
                      {activeLegends.visitors && d.visitors !== null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              background: "#f1c40f",
                              borderRadius: "2px",
                            }}
                          />
                          <span style={{ color: "#fff" }}>Visitantes:</span>{" "}
                          <strong>{d.visitors}</strong>
                        </div>
                      )}
                      {activeLegends.converting && d.converting !== null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              background: "#e67e22",
                              borderRadius: "2px",
                            }}
                          />
                          <span style={{ color: "#fff" }}>Em Conversão:</span>{" "}
                          <strong>{d.converting}</strong>
                        </div>
                      )}
                      {activeLegends.total && d.total !== null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.75rem",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            paddingTop: "4px",
                            marginTop: "2px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              background: "#3498db",
                              borderRadius: "2px",
                            }}
                          />
                          <span style={{ color: "#fff" }}>Total:</span>{" "}
                          <strong>{d.total}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
