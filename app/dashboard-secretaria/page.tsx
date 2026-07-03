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
    const data = months.map((m) => ({
      month: m,
      year1: null as number | null,
      year2: null as number | null,
      members: null as number | null,
      visitors: null as number | null,
    }));
    const countData = (yearTarget: string, yearKey: "year1" | "year2") => {
      filteredMembers.forEach((m) => {
        const d = m.integrationDate || "2026-01-01";
        if (d.startsWith(yearTarget)) {
          const mIdx = parseInt(d.split("-")[1]) - 1;
          if (data[mIdx]) {
            if (data[mIdx][yearKey] === null) data[mIdx][yearKey] = 0;
            data[mIdx][yearKey]!++;
            if (yearKey === "year1") {
              if (data[mIdx].members === null) data[mIdx].members = 0;
              data[mIdx].members!++;
            }
          }
        }
      });
      filteredVisitors.forEach((v) => {
        if (v.date.startsWith(yearTarget)) {
          const mIdx = parseInt(v.date.split("-")[1]) - 1;
          if (data[mIdx]) {
            if (data[mIdx][yearKey] === null) data[mIdx][yearKey] = 0;
            data[mIdx][yearKey]!++;
            if (yearKey === "year1") {
              if (data[mIdx].visitors === null) data[mIdx].visitors = 0;
              data[mIdx].visitors!++;
            }
          }
        }
      });
    };
    countData(cmpYear1, "year1");
    countData(cmpYear2, "year2");
    return data;
  }, [filteredMembers, filteredVisitors, cmpYear1, cmpYear2]);

  const maxCmpValue = Math.max(
    ...comparativeData.map((d) => Math.max(d.year1 || 0, d.year2 || 0)),
    1,
  );
  const maxTypeValues = Math.max(
    ...comparativeData.map((d) => Math.max(d.members || 0, d.visitors || 0)),
    1,
  );

  const buildSmoothLinePath = (
    yearKey: "year1" | "year2" | "members" | "visitors",
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
      for (let i = 0; i < seg.length - 1; i++) {
        const p0 = i > 0 ? seg[i - 1] : seg[0];
        const p1 = seg[i];
        const p2 = seg[i + 1];
        const p3 = i !== seg.length - 2 ? seg[i + 2] : p2;
        path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
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
    <div className="page-wrapper" style={{ paddingBottom: "30px" }}>
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
          marginBottom: "20px",
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
          marginBottom: "25px",
        }}
      >
        <div
          className="glass"
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "20px",
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
            padding: "20px",
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
            padding: "20px",
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
            padding: "20px",
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

        {/* Funil de Visitantes */}
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
            🎯 Funil de Conversão (Visitantes)
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  marginBottom: "4px",
                }}
              >
                <span>Visitantes</span>
                <strong>{funnelData.visitantes} (100%)</strong>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  height: "10px",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#3b82f6",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  marginBottom: "4px",
                }}
              >
                <span>Em Conversão</span>
                <strong>
                  {funnelData.emConversao} (
                  {funnelData.visitantes > 0
                    ? (
                        (funnelData.emConversao / funnelData.visitantes) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </strong>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  height: "10px",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#e67e22",
                    width:
                      funnelData.visitantes > 0
                        ? `${(funnelData.emConversao / funnelData.visitantes) * 100}%`
                        : "0%",
                    height: "100%",
                  }}
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  marginBottom: "4px",
                }}
              >
                <span>Membros (Consolidados)</span>
                <strong>
                  {funnelData.membros} (
                  {funnelData.visitantes > 0
                    ? (
                        (funnelData.membros / funnelData.visitantes) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </strong>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  height: "10px",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#2ecc71",
                    width:
                      funnelData.visitantes > 0
                        ? `${(funnelData.membros / funnelData.visitantes) * 100}%`
                        : "0%",
                    height: "100%",
                  }}
                />
              </div>
            </div>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--text-secondary)",
                textAlign: "center",
                margin: "10px 0 0 0",
                fontStyle: "italic",
              }}
            >
              A taxa de conversão obedece o período filtrado acima.
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: COMPARATIVO GERAL */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="glass"
          style={{
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
                📈 Crescimento Comparativo
              </h4>
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
              >
                Almas Novas
              </span>
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
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "var(--primary-light)",
                      borderRadius: "3px",
                    }}
                  />
                  <select
                    value={cmpYear1}
                    onChange={(e) => setCmpYear1(e.target.value)}
                    className="filter-select"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#fff",
                      fontSize: "0.8rem",
                      padding: "0 4px",
                    }}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
                >
                  vs
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#95a5a6",
                      borderRadius: "3px",
                    }}
                  />
                  <select
                    value={cmpYear2}
                    onChange={(e) => setCmpYear2(e.target.value)}
                    className="filter-select"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#fff",
                      fontSize: "0.8rem",
                      padding: "0 4px",
                    }}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              position: "relative",
              height: "150px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{ position: "relative", height: "150px", flexShrink: 0 }}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                  display: "block",
                }}
              >
                <path
                  d={buildSmoothLinePath("year1", maxCmpValue)}
                  fill="none"
                  stroke="var(--primary-light)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
                <path
                  d={buildSmoothLinePath("year2", maxCmpValue)}
                  fill="none"
                  stroke="#95a5a6"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeDasharray="5,5"
                />
              </svg>
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
              {comparativeData.map((d, i) => {
                const left = `${(i / 11) * 100}%`;
                const top1 =
                  d.year1 !== null
                    ? `${90 - (d.year1 / maxCmpValue) * 80}%`
                    : null;
                const top2 =
                  d.year2 !== null
                    ? `${90 - (d.year2 / maxCmpValue) * 80}%`
                    : null;
                const isHovered = hoveredMonthIdx === i;
                return (
                  <div
                    key={`dots1-${i}`}
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      width: 0,
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  >
                    {top1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: top1,
                          width: isHovered ? "14px" : "10px",
                          height: isHovered ? "14px" : "10px",
                          background: "var(--primary-light)",
                          borderRadius: "50%",
                          transform: "translate(-50%, -50%)",
                          border: "2px solid #1a1a2e",
                          boxShadow: isHovered
                            ? "0 0 10px var(--primary-light)"
                            : "none",
                          zIndex: 3,
                          transition: "all 0.2s",
                        }}
                      />
                    )}
                    {top2 && (
                      <div
                        style={{
                          position: "absolute",
                          top: top2,
                          width: isHovered ? "14px" : "10px",
                          height: isHovered ? "14px" : "10px",
                          background: "#95a5a6",
                          borderRadius: "50%",
                          transform: "translate(-50%, -50%)",
                          border: "2px solid #1a1a2e",
                          boxShadow: isHovered ? "0 0 10px #95a5a6" : "none",
                          zIndex: 2,
                          transition: "all 0.2s",
                        }}
                      />
                    )}
                    {isHovered && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-40px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "rgba(20,20,30,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "8px 12px",
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
                        {d.year1 !== null && (
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
                                background: "var(--primary-light)",
                                borderRadius: "2px",
                              }}
                            />
                            <span style={{ color: "#fff" }}>{cmpYear1}:</span>{" "}
                            <strong>{d.year1}</strong>
                          </div>
                        )}
                        {d.year2 !== null && (
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
                                background: "#95a5a6",
                                borderRadius: "2px",
                              }}
                            />
                            <span style={{ color: "#fff" }}>{cmpYear2}:</span>{" "}
                            <strong>{d.year2}</strong>
                          </div>
                        )}
                        {d.year1 === null && d.year2 === null && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Sem dados
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", marginTop: "10px" }}>
              {comparativeData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "0.65rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {d.month}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* GRÁFICO 2: MEMBROS VS VISITANTES MÊS A MÊS */}
        <div
          className="glass"
          style={{
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
                👥 Membros vs Visitantes
              </h4>
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
              >
                Comparativo do ano {cmpYear1}
              </span>
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
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#2ecc71",
                      borderRadius: "3px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Membros
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: "#f39c12",
                      borderRadius: "3px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Visitantes
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              position: "relative",
              height: "150px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{ position: "relative", height: "150px", flexShrink: 0 }}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                  display: "block",
                }}
              >
                <path
                  d={buildSmoothLinePath("members", maxTypeValues)}
                  fill="none"
                  stroke="#2ecc71"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
                <path
                  d={buildSmoothLinePath("visitors", maxTypeValues)}
                  fill="none"
                  stroke="#f39c12"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              </svg>
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
              {comparativeData.map((d, i) => {
                const left = `${(i / 11) * 100}%`;
                const top1 =
                  d.members !== null
                    ? `${90 - (d.members / maxTypeValues) * 80}%`
                    : null;
                const top2 =
                  d.visitors !== null
                    ? `${90 - (d.visitors / maxTypeValues) * 80}%`
                    : null;
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
                    {top1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: top1,
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
                    {top2 && (
                      <div
                        style={{
                          position: "absolute",
                          top: top2,
                          width: isHovered ? "14px" : "10px",
                          height: isHovered ? "14px" : "10px",
                          background: "#f39c12",
                          borderRadius: "50%",
                          transform: "translate(-50%, -50%)",
                          border: "2px solid #1a1a2e",
                          boxShadow: isHovered ? "0 0 10px #f39c12" : "none",
                          zIndex: 2,
                          transition: "all 0.2s",
                        }}
                      />
                    )}
                    {isHovered && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-40px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "rgba(20,20,30,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "8px 12px",
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
                        {d.members !== null && (
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
                        {d.visitors !== null && (
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
                                background: "#f39c12",
                                borderRadius: "2px",
                              }}
                            />
                            <span style={{ color: "#fff" }}>Visitantes:</span>{" "}
                            <strong>{d.visitors}</strong>
                          </div>
                        )}
                        {d.members === null && d.visitors === null && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Sem dados
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", marginTop: "10px" }}>
              {comparativeData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "0.65rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {d.month}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
