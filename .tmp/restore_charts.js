const fs = require('fs');
const path = require('path');

const curPath = path.join(__dirname, '..', 'app', 'dashboard-secretaria', 'page.tsx');
let curContent = fs.readFileSync(curPath, 'utf8');

const logicReplacement = `  // --- Gráficos de Linha Restabelecidos ---
  const comparativeData = useMemo(() => {
    const data = months.map(m => ({ 
      month: m, 
      year1: null as number | null, 
      year2: null as number | null,
      members: null as number | null,
      visitors: null as number | null
    }));
    
    const countData = (yearTarget: string, yearKey: 'year1' | 'year2') => {
      filteredMembers.forEach(m => {
        const d = m.integrationDate || '2026-01-01';
        if (d.startsWith(yearTarget)) {
          const mIdx = parseInt(d.split('-')[1]) - 1;
          if (data[mIdx]) {
            if (data[mIdx][yearKey] === null) data[mIdx][yearKey] = 0;
            data[mIdx][yearKey]!++;
            if (yearKey === 'year1') {
              if (data[mIdx].members === null) data[mIdx].members = 0;
              data[mIdx].members!++;
            }
          }
        }
      });
      filteredVisitors.forEach(v => {
        if (v.date.startsWith(yearTarget)) {
          const mIdx = parseInt(v.date.split('-')[1]) - 1;
          if (data[mIdx]) {
            if (data[mIdx][yearKey] === null) data[mIdx][yearKey] = 0;
            data[mIdx][yearKey]!++;
            if (yearKey === 'year1') {
              if (data[mIdx].visitors === null) data[mIdx].visitors = 0;
              data[mIdx].visitors!++;
            }
          }
        }
      });
    };

    countData(cmpYear1, 'year1');
    countData(cmpYear2, 'year2');

    return data;
  }, [filteredMembers, filteredVisitors, cmpYear1, cmpYear2]);

  const maxCmpValue = Math.max(...comparativeData.map(d => Math.max(d.year1 || 0, d.year2 || 0)), 1);
  const maxTypeValues = Math.max(...comparativeData.map(d => Math.max(d.members || 0, d.visitors || 0)), 1);

  const buildSmoothLinePath = (yearKey: 'year1' | 'year2' | 'members' | 'visitors', maxVal: number) => {
    if (comparativeData.length === 0) return '';
    const points = comparativeData.map((d, i) => {
      const val = d[yearKey];
      if (val === null) return null;
      const x = (i / 11) * 100;
      const y = 90 - (val / maxVal) * 80;
      return { x, y };
    });
    const segments: {x:number, y:number}[][] = [];
    let currentSegment: {x:number, y:number}[] = [];
    for (const pt of points) {
      if (pt) { currentSegment.push(pt); } 
      else if (currentSegment.length > 0) { segments.push(currentSegment); currentSegment = []; }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    let path = '';
    for (const seg of segments) {
      if (seg.length === 1) {
        path += \` M \${seg[0].x} \${seg[0].y} L \${seg[0].x} \${seg[0].y}\`;
        continue;
      }
      path += \` M \${seg[0].x} \${seg[0].y}\`;
      for (let i = 0; i < seg.length - 1; i++) {
        const p0 = i > 0 ? seg[i - 1] : seg[0];
        const p1 = seg[i];
        const p2 = seg[i + 1];
        const p3 = i !== seg.length - 2 ? seg[i + 2] : p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
        path += \` C \${cp1x} \${cp1y}, \${cp2x} \${cp2y}, \${p2.x} \${p2.y}\`;
      }
    }
    return path;
  };
`;

const jsxReplacement = `
      {/* GRÁFICO 1: COMPARATIVO GERAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0, color: '#fff' }}>📈 Crescimento Comparativo</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Almas Novas</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: 'var(--primary-light)', borderRadius: '3px' }} />
                  <select value={cmpYear1} onChange={e => setCmpYear1(e.target.value)} className="filter-select" style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '0.8rem', padding: '0 4px' }}>
                    <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
                  </select>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#95a5a6', borderRadius: '3px' }} />
                  <select value={cmpYear2} onChange={e => setCmpYear2(e.target.value)} className="filter-select" style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '0.8rem', padding: '0 4px' }}>
                    <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', height: '150px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '150px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                <path d={buildSmoothLinePath('year1', maxCmpValue)} fill="none" stroke="var(--primary-light)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path d={buildSmoothLinePath('year2', maxCmpValue)} fill="none" stroke="#95a5a6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray="5,5" />
              </svg>
              
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {comparativeData.map((d, i) => {
                  const isHovered = hoveredMonthIdx === i;
                  return (
                    <div key={i} style={{ flex: 1, position: 'relative', cursor: 'crosshair' }} onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)}>
                      {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                    </div>
                  );
                })}
              </div>

              {comparativeData.map((d, i) => {
                const left = \`\${(i / 11) * 100}%\`;
                const top1 = d.year1 !== null ? \`\${90 - (d.year1 / maxCmpValue) * 80}%\` : null;
                const top2 = d.year2 !== null ? \`\${90 - (d.year2 / maxCmpValue) * 80}%\` : null;
                const isHovered = hoveredMonthIdx === i;

                return (
                  <div key={\`dots1-\${i}\`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                    {top1 && <div style={{ position: 'absolute', top: top1, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: 'var(--primary-light)', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px var(--primary-light)' : 'none', zIndex: 3, transition: 'all 0.2s' }} />}
                    {top2 && <div style={{ position: 'absolute', top: top2, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: '#95a5a6', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px #95a5a6' : 'none', zIndex: 2, transition: 'all 0.2s' }} />}
                    
                    {isHovered && (
                      <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>{d.month}</div>
                        {d.year1 !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--primary-light)', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>{cmpYear1}:</span> <strong>{d.year1}</strong>
                          </div>
                        )}
                        {d.year2 !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#95a5a6', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>{cmpYear2}:</span> <strong>{d.year2}</strong>
                          </div>
                        )}
                        {d.year1 === null && d.year2 === null && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', marginTop: '10px' }}>
              {comparativeData.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{d.month}</div>
              ))}
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: MEMBROS VS VISITANTES MÊS A MÊS */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0, color: '#fff' }}>👥 Membros vs Visitantes</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comparativo do ano {cmpYear1}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#2ecc71', borderRadius: '3px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Membros</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#f39c12', borderRadius: '3px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Visitantes</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', height: '150px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '150px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
                <path d={buildSmoothLinePath('members', maxTypeValues)} fill="none" stroke="#2ecc71" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path d={buildSmoothLinePath('visitors', maxTypeValues)} fill="none" stroke="#f39c12" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </svg>
              
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {comparativeData.map((d, i) => {
                  const isHovered = hoveredMonthIdx === i;
                  return (
                    <div key={i} style={{ flex: 1, position: 'relative', cursor: 'crosshair' }} onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)}>
                      {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                    </div>
                  );
                })}
              </div>

              {comparativeData.map((d, i) => {
                const left = \`\${(i / 11) * 100}%\`;
                const top1 = d.members !== null ? \`\${90 - (d.members / maxTypeValues) * 80}%\` : null;
                const top2 = d.visitors !== null ? \`\${90 - (d.visitors / maxTypeValues) * 80}%\` : null;
                const isHovered = hoveredMonthIdx === i;

                return (
                  <div key={\`dots2-\${i}\`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>
                    {top1 && <div style={{ position: 'absolute', top: top1, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: '#2ecc71', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px #2ecc71' : 'none', zIndex: 3, transition: 'all 0.2s' }} />}
                    {top2 && <div style={{ position: 'absolute', top: top2, width: isHovered ? '14px' : '10px', height: isHovered ? '14px' : '10px', background: '#f39c12', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid #1a1a2e', boxShadow: isHovered ? '0 0 10px #f39c12' : 'none', zIndex: 2, transition: 'all 0.2s' }} />}
                    
                    {isHovered && (
                      <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginBottom: '2px' }}>{d.month}</div>
                        {d.members !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#2ecc71', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>Membros:</span> <strong>{d.members}</strong>
                          </div>
                        )}
                        {d.visitors !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#f39c12', borderRadius: '2px' }} />
                            <span style={{ color: '#fff' }}>Visitantes:</span> <strong>{d.visitors}</strong>
                          </div>
                        )}
                        {d.members === null && d.visitors === null && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sem dados</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', marginTop: '10px' }}>
              {comparativeData.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{d.month}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const logicStartStr = "// --- Gráfico Comparativo ---";
const jsxStartStr = "{/* COMPARAÇÃO DE CRESCIMENTO & ROSCA DE VISITANTES */}";

// Find indices
const logicStartIndex = curContent.indexOf(logicStartStr);
const jsxStartIndex = curContent.indexOf(jsxStartStr);

if (logicStartIndex === -1 || jsxStartIndex === -1) {
  console.log("Could not find markers to replace");
} else {
  // We need to keep what's between logic and jsx? No, everything from logic to jsx is logic that we want to replace.
  // Actually, wait, the JSX block replaces EVERYTHING from jsxStartIndex to the end.
  const beforeLogic = curContent.substring(0, logicStartIndex);
  // Wait, there might be DonutChart import or usage? We removed DonutChart.
  
  const finalContent = beforeLogic + logicReplacement + '\n' + jsxReplacement;
  
  // also make sure `months` is declared, it's missing in `logicReplacement` if we don't define it.
  fs.writeFileSync(curPath, finalContent.replace("const maxTypeValues = Math.max", "const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];\n  const maxTypeValues = Math.max"), 'utf8');
  console.log("Replacement successful");
}
