const fs = require('fs');
const lines = fs.readFileSync('e:/Projeto Church/app/financeiro/page.tsx', 'utf8').split('\n');
// Block A: Visão Anual (Lines 608-942) -> 0-indexed 607-941
// Block B: Detalhamento (Lines 943-1028) -> 0-indexed 942-1027

const before = lines.slice(0, 607);
const blockA = lines.slice(607, 942);
const blockB = lines.slice(942, 1028);
const after = lines.slice(1028);

// block B gets some top margin, block A gets a top margin. Wait, Block A already has marginTop.
// Let's modify block B's first line (which is lines[942]) to have a margin.
blockB[0] = blockB[0].replace(`minHeight: '220px'`, `minHeight: '220px', marginTop: '14px'`);

const newLines = [...before, ...blockB, ...blockA, ...after];
fs.writeFileSync('e:/Projeto Church/app/financeiro/page.tsx', newLines.join('\n'));
console.log('Done!');
