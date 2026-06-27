const fs = require('fs');
const file = 'e:/Projeto Church/app/financeiro/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove selectedMonthIdx
content = content.replace(
  `  const [evolucaoChartType, setEvolucaoChartType] = useState<'barra' | 'linha'>('linha');\n  const [evolucaoHoveredMonthIdx, setEvolucaoHoveredMonthIdx] = useState<number | null>(null);\n\n  const selectedMonthIdx = useMemo(() => {\n    if (!startDate || !endDate) return null;\n    const [sy, sm, sd] = startDate.split('-');\n    const [ey, em, ed] = endDate.split('-');\n    if (sy === chartYear && sy === ey && sm === em && sd === '01') {\n      const lastDay = new Date(parseInt(sy), parseInt(sm), 0).getDate();\n      if (parseInt(ed) === lastDay) return parseInt(sm) - 1;\n    }\n    return null;\n  }, [startDate, endDate, chartYear]);\n\n  const pathOpacity = (evolucaoHoveredMonthIdx !== null || selectedMonthIdx !== null) ? 0.3 : 1;`,
  `  const [evolucaoChartType, setEvolucaoChartType] = useState<'barra' | 'linha'>('linha');\n  const [evolucaoHoveredMonthIdx, setEvolucaoHoveredMonthIdx] = useState<number | null>(null);`
);

// 2. Remove opacity and style from Paths
content = content.replace(/ opacity=\{pathOpacity\} style=\{\{ transition: 'opacity 0\.3s' \}\}/g, '');

// 3. Revert Hover Areas
content = content.replace(
  /const isHovered = evolucaoHoveredMonthIdx === i;\s*const isSelected = selectedMonthIdx === i;\s*return \(\s*<div \s*key=\{i\} \s*style=\{\{ flex: 1, position: 'relative', cursor: 'pointer' \}\}\s*onMouseEnter=\{\(\) => setEvolucaoHoveredMonthIdx\(i\)\}\s*onMouseLeave=\{\(\) => setEvolucaoHoveredMonthIdx\(null\)\}\s*onClick=\{[^}]+\}\s*>\s*\{\(isHovered \|\| isSelected\) && <div style=\{\{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: isSelected \? '24px' : '1px', background: isSelected \? 'rgba\(255,255,255,0\.05\)' : 'rgba\(255,255,255,0\.1\)', transform: 'translateX\(-50%\)', pointerEvents: 'none', borderRadius: '4px' \}\} \/>\}\s*<\/div>\s*\);/g,
  `const isHovered = evolucaoHoveredMonthIdx === i;
                    return (
                      <div key={i} style={{ flex: 1, position: 'relative', cursor: 'crosshair' }} onMouseEnter={() => setEvolucaoHoveredMonthIdx(i)} onMouseLeave={() => setEvolucaoHoveredMonthIdx(null)}>
                        {isHovered && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
                      </div>
                    );`
);

// 4. Revert Dots and Tooltip wrapper
content = content.replace(
  /const isHovered = evolucaoHoveredMonthIdx === i \|\| selectedMonthIdx === i;\s*const isDimmed = \(evolucaoHoveredMonthIdx !== null && evolucaoHoveredMonthIdx !== i\) \|\| \(evolucaoHoveredMonthIdx === null && selectedMonthIdx !== null && selectedMonthIdx !== i\);\s*return \(\s*<div key=\{`dots-([^`]+)`\} style=\{\{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none', opacity: isDimmed \? 0\.2 : 1, transition: 'opacity 0\.3s' \}\}>/g,
  `const isHovered = evolucaoHoveredMonthIdx === i;
                  return (
                    <div key={\`dots-$1\`} style={{ position: 'absolute', left, top: 0, width: 0, height: '100%', pointerEvents: 'none' }}>`
);

// 5. Revert X-Axis labels
content = content.replace(
  /<div key=\{i\} style=\{\{ fontSize: '0\.65rem', color: \(selectedMonthIdx === i \|\| evolucaoHoveredMonthIdx === i\) \? '#fff' : 'var\(--text-secondary\)', fontWeight: \(selectedMonthIdx === i \|\| evolucaoHoveredMonthIdx === i\) \? 700 : 400, flex: 1, textAlign: 'center', opacity: \(\(evolucaoHoveredMonthIdx !== null && evolucaoHoveredMonthIdx !== i\) \|\| \(evolucaoHoveredMonthIdx === null && selectedMonthIdx !== null && selectedMonthIdx !== i\)\) \? 0\.3 : 1, transition: 'all 0\.3s' \}\}>\{d\.monthStr\}<\/div>/g,
  `<div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>{d.monthStr}</div>`
);

fs.writeFileSync(file, content);
console.log('Reverted charts successfully');
