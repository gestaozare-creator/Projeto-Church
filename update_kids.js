const fs = require('fs');

const file = 'E:/Projeto Church/app/departamentos/kids/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert getCultosDoMes and timelineDates below selectedMonthStr
const stateTarget = `  const [selectedMonthStr, setSelectedMonthStr] = useState(new Date().toISOString().slice(0, 7)); 
  const [activeDate, setActiveDate] = useState<string>('2026-06-21'); // Domingo de base`;

const stateReplacement = `  const [selectedMonthStr, setSelectedMonthStr] = useState(new Date().toISOString().slice(0, 7)); 
  
  const getCultosDoMes = (monthStr: string) => {
    const [y, m] = monthStr.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    const dates = [];
    while (date.getMonth() === m - 1) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 3) { // 0=Dom, 3=Qua
        dates.push(date.toISOString().split("T")[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const [timelineDates, setTimelineDates] = useState<string[]>(getCultosDoMes(selectedMonthStr));
  const [activeDate, setActiveDate] = useState<string>(timelineDates[0] || new Date().toISOString().split("T")[0]);`;

content = content.replace(stateTarget, stateReplacement);

// 2. Insert useEffect for month change and calendarDays useMemo before addCustomDate
const effectTarget = `  // ==========================================
  // LÓGICA DA ESCALA (Mantida do painel anterior)
  // ==========================================
  const addCustomDate = () => {`;

const effectReplacement = `  // ==========================================
  // LÓGICA DA ESCALA (Mantida do painel anterior)
  // ==========================================
  
  useEffect(() => {
    const dates = getCultosDoMes(selectedMonthStr);
    setTimelineDates(dates);
    if (!dates.includes(activeDate)) {
      setActiveDate(dates[0] || new Date().toISOString().split("T")[0]);
    }
  }, [selectedMonthStr]);

  const calendarDays = useMemo(() => {
    const [y, m] = selectedMonthStr.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay(); // 0 a 6
    const daysInMonth = new Date(y, m, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = \`\${y}-\${String(m).padStart(2, "0")}-\${String(d).padStart(2, "0")}\`;
      days.push(dateStr);
    }
    return days;
  }, [selectedMonthStr]);

  const addCustomDate = () => {
    const input = prompt('Digite a data extra no formato AAAA-MM-DD');
    if (input && !timelineDates.includes(input)) {
      setTimelineDates(prev => [...prev, input].sort());
      setActiveDate(input);
    }
  };
  
  const oldAddCustomDate = () => {`;

content = content.replace(effectTarget, effectReplacement);

// 3. Replace the left-side UI with the calendar JSX
// First we isolate the block to replace.
// The block is:
/*
            {/* Lado Esquerdo: Datas *\/}
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', margin: 0, paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>📅 Selecionar Domingo/Culto</h3>
              <input 
                type="month" 
                value={selectedMonthStr}
                onChange={(e) => setSelectedMonthStr(e.target.value)}
                className="search-input glass-input"
                style={{ padding: '8px 12px', borderRadius: '8px', width: '100%' }}
              />
              <button 
                onClick={() => setActiveDate('2026-06-21')}
                style={{ background: activeDate === '2026-06-21' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                Culto - 21/06/2026 (Base)
              </button>
              <button onClick={addCustomDate} style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                + Adicionar Domingo Extra
              </button>
            </div>
*/

// I'll use regex to match everything from Lado Esquerdo up to Lado Direito
const regexUI = /\{\/\*\s*Lado Esquerdo: Datas\s*\*\/\}(.|\n)*?\{\/\*\s*Lado Direito: Grid de Professores/m;

const uiReplacement = `{/* Lado Esquerdo: Calendário */}
            <div
              className="glass"
              style={{
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  margin: 0,
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                📅 Seleção de Data
              </h3>
              <input
                type="month"
                value={selectedMonthStr}
                onChange={(e) => setSelectedMonthStr(e.target.value)}
                className="search-input glass-input"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  width: "100%",
                  marginBottom: "10px",
                  colorScheme: "dark",
                }}
              />

              {/* Calendário Mensal Flex/Grid */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {/* Weekdays */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr",
                    width: "100%",
                    gap: "4px",
                    marginBottom: "10px",
                  }}
                >
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
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
                    gap: "4px",
                  }}
                >
                  {calendarDays.map((dateStr, idx) => {
                    if (!dateStr)
                      return (
                        <div key={\`empty-\${idx}\`} style={{ minHeight: "30px" }} />
                      );

                    const dayNumber = parseInt(dateStr.split("-")[2], 10);
                    const isActive = dateStr === activeDate;

                    const now = new Date();
                    const todayStr = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(now.getDate()).padStart(2, '0')}\`;
                    const isToday = dateStr === todayStr;

                    const hasScale = Object.values(
                      escalasGlobais[dateStr] || {},
                    ).some((arr) => arr.length > 0);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => {
                          if (!timelineDates.includes(dateStr)) {
                            setTimelineDates((prev) => [...prev, dateStr].sort());
                          }
                          setActiveDate(dateStr);
                        }}
                        style={{
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          background: isActive
                            ? "var(--primary-light)"
                            : hasScale
                              ? "rgba(52, 152, 219, 0.15)"
                              : "rgba(255,255,255,0.02)",
                          border: isActive
                            ? "1px solid var(--primary-light)"
                            : isToday 
                              ? "1px solid rgba(255, 255, 255, 0.45)"
                              : "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: isActive || isToday ? "bold" : "normal",
                          color: isActive ? "#fff" : isToday ? "#fff" : "var(--sidebar-text)",
                          transition: "all 0.2s",
                        }}
                      >
                        {dayNumber}
                        {hasScale && (
                          <div
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              background: isActive ? "#fff" : "#3498db",
                              boxShadow: "0 0 4px rgba(52, 152, 219, 0.5)",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={addCustomDate}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    color: "var(--text-secondary)",
                    border: "1px dashed rgba(255,255,255,0.2)",
                    padding: "6px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    width: "100%",
                    marginTop: "10px",
                  }}
                >
                  + Dia Extra
                </button>
              </div>
            </div>

            {/* Lado Direito: Grid de Professores`;

content = content.replace(regexUI, uiReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Script ran successfully!');
