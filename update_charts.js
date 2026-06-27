const fs = require('fs');
const file = 'e:/Projeto Church/app/financeiro/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add selectedMonthIdx
content = content.replace(
  `  const [evolucaoChartType, setEvolucaoChartType] = useState<'barra' | 'linha'>('linha');\n  const [evolucaoHoveredMonthIdx, setEvolucaoHoveredMonthIdx] = useState<number | null>(null);`,
  `  const [evolucaoChartType, setEvolucaoChartType] = useState<'barra' | 'linha'>('linha');\n  const [evolucaoHoveredMonthIdx, setEvolucaoHoveredMonthIdx] = useState<number | null>(null);\n\n  const selectedMonthIdx = useMemo(() => {\n    if (!startDate || !endDate) return null;\n    const [sy, sm, sd] = startDate.split('-');\n    const [ey, em, ed] = endDate.split('-');\n    if (sy === chartYear && sy === ey && sm === em && sd === '01') {\n      const lastDay = new Date(parseInt(sy), parseInt(sm), 0).getDate();\n      if (parseInt(ed) === lastDay) return parseInt(sm) - 1;\n    }\n    return null;\n  }, [startDate, endDate, chartYear]);\n\n  const pathOpacity = (evolucaoHoveredMonthIdx !== null || selectedMonthIdx !== null) ? 0.3 : 1;`
);

// 2. Chart 1 Paths
content = content.replace(
  `                  <path d={buildEvolucaoLinePath('domingo')} fill="none" stroke="#3498db" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />\n                  <path d={buildEvolucaoLinePath('quarta')} fill="none" stroke="#9b59b6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />\n                  <path d={buildEvolucaoLinePath('sabado')} fill="none" stroke="#f1c40f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />`,
  `                  <path d={buildEvolucaoLinePath('domingo')} fill="none" stroke="#3498db" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={pathOpacity} style={{ transition: 'opacity 0.3s' }} />\n                  <path d={buildEvolucaoLinePath('quarta')} fill="none" stroke="#9b59b6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={pathOpacity} style={{ transition: 'opacity 0.3s' }} />\n                  <path d={buildEvolucaoLinePath('sabado')} fill="none" stroke="#f1c40f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={pathOpacity} style={{ transition: 'opacity 0.3s' }} />`
);

// 3. Chart 2 Paths
content = content.replace(
  `                  <path d={buildHistoricoLinePath('entradas')} fill="none" stroke="#2ecc71" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />\n                  <path d={buildHistoricoLinePath('saidas')} fill="none" stroke="#e74c3c" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />`,
  `                  <path d={buildHistoricoLinePath('entradas')} fill="none" stroke="#2ecc71" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={pathOpacity} style={{ transition: 'opacity 0.3s' }} />\n                  <path d={buildHistoricoLinePath('saidas')} fill="none" stroke="#e74c3c" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={pathOpacity} style={{ transition: 'opacity 0.3s' }} />`
);

// 4. Chart 3 Paths
content = content.replace(
  `                  <path d={buildHistoricoLinePath('saldo')} fill="none" stroke="#f1c40f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />`,
  `                  <path d={buildHistoricoLinePath('saldo')} fill="none" stroke="#f1c40f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={pathOpacity} style={{ transition: 'opacity 0.3s' }} />`
);

// 5. Replace Hover Areas (All 3 Charts have similar structure, we can regex it)
content = content.replace(
  /const isHovered = evolucaoHoveredMonthIdx === i;\s*return \(\s*<div\s*key=\{i\}\s*style=\{\{ flex: 1, position: 'relative', cursor: 'crosshair' \}\}\s*onMouseEnter=\{\(\) => setEvolucaoHoveredMonthIdx\(i\)\}\s*onMouseLeave=\{\(\) => setEvolucaoHoveredMonthIdx\(null\)\}\s*>\s*\{isHovered && <div style=\{\{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba\(255,255,255,0\.1\)', transform: 'translateX\(-50%\)', pointerEvents: 'none' \}\} \/>\}\s*<\/div>\s*\);/g,
  `const isHovered = evolucaoHoveredMonthIdx === i;\n                    const isSelected = selectedMonthIdx === i;\n                    return (\n                      <div \n                        key={i} \n                        style={{ flex: 1, position: 'relative', cursor: 'pointer' }}\n                        onMouseEnter={() => setEvolucaoHoveredMonthIdx(i)}\n                        onMouseLeave={() => setEvolucaoHoveredMonthIdx(null)}\n                        onClick={() => {\n                          const yyyy = chartYear;\n                          const mm = String(i + 1).padStart(2, '0');\n                          const lastDay = new Date(parseInt(yyyy), i + 1, 0).getDate();\n                          setStartDate(\`\${yyyy}-\${mm}-01\`);\n                          setEndDate(\`\${yyyy}-\${mm}-\${lastDay}\`);\n                        }}\n                      >\n                        {(isHovered || isSelected) && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: isSelected ? '24px' : '1px', background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none', borderRadius: '4px' }} />}\n                      </div>\n                    );`
);

// 6. Dots and Tooltip wrapper (replace the starting line)
content = content.replace(
  /const isHovered = evolucaoHoveredMonthIdx === i;\s*return \(\s*<div key=\{`dots-([^`]+)`\} style=\{\{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' \}\}>/g,
  `const isHovered = evolucaoHoveredMonthIdx === i || selectedMonthIdx === i;
                  const isDimmed = (evolucaoHoveredMonthIdx !== null && evolucaoHoveredMonthIdx !== i) || (evolucaoHoveredMonthIdx === null && selectedMonthIdx !== null && selectedMonthIdx !== i);
                  return (
                    <div key={\`dots-$1\`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none', opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.3s' }}>`
);


// 7. X-Axis labels fading
content = content.replace(
  /<div key=\{i\} style=\{\{ fontSize: '0\.65rem', color: 'var\(--text-secondary\)', flex: 1, textAlign: 'center' \}\}>\{d\.monthStr\}<\/div>/g,
  `<div key={i} style={{ fontSize: '0.65rem', color: (selectedMonthIdx === i || evolucaoHoveredMonthIdx === i) ? '#fff' : 'var(--text-secondary)', fontWeight: (selectedMonthIdx === i || evolucaoHoveredMonthIdx === i) ? 700 : 400, flex: 1, textAlign: 'center', opacity: ((evolucaoHoveredMonthIdx !== null && evolucaoHoveredMonthIdx !== i) || (evolucaoHoveredMonthIdx === null && selectedMonthIdx !== null && selectedMonthIdx !== i)) ? 0.3 : 1, transition: 'all 0.3s' }}>{d.monthStr}</div>`
);

fs.writeFileSync(file, content);
console.log('Modified charts successfully');
