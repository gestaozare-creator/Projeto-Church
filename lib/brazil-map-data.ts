// Paths SVG simplificados dos estados do Brasil
// Cada path tem coordenadas aproximadas para um viewBox de 0 0 600 700

export const BRAZIL_STATES: Record<string, { name: string; path: string; labelX: number; labelY: number }> = {
  AC: { name: 'Acre', path: 'M48,340 L80,335 L85,360 L50,365 Z', labelX: 65, labelY: 350 },
  AM: { name: 'Amazonas', path: 'M80,240 L200,230 L210,270 L200,320 L140,330 L80,335 L60,310 L55,270 Z', labelX: 140, labelY: 280 },
  RR: { name: 'Roraima', path: 'M150,170 L200,160 L210,200 L200,230 L155,235 L140,210 Z', labelX: 175, labelY: 200 },
  AP: { name: 'Amapá', path: 'M280,170 L310,160 L320,190 L310,220 L280,215 L270,190 Z', labelX: 295, labelY: 192 },
  PA: { name: 'Pará', path: 'M200,230 L280,215 L310,220 L350,240 L370,280 L350,310 L280,320 L210,310 L200,320 L210,270 Z', labelX: 280, labelY: 272 },
  MA: { name: 'Maranhão', path: 'M350,240 L400,240 L420,270 L410,310 L370,315 L350,310 L370,280 Z', labelX: 385, labelY: 278 },
  TO: { name: 'Tocantins', path: 'M350,310 L370,315 L380,350 L375,400 L340,410 L330,370 L335,330 Z', labelX: 355, labelY: 362 },
  PI: { name: 'Piauí', path: 'M400,240 L440,250 L445,290 L440,330 L410,340 L380,350 L370,315 L410,310 L420,270 Z', labelX: 418, labelY: 295 },
  CE: { name: 'Ceará', path: 'M440,250 L480,240 L500,260 L490,290 L460,295 L445,290 Z', labelX: 468, labelY: 270 },
  RN: { name: 'Rio Grande do Norte', path: 'M490,260 L530,250 L540,265 L520,280 L490,290 Z', labelX: 515, labelY: 268 },
  PB: { name: 'Paraíba', path: 'M490,290 L540,280 L545,295 L500,305 L460,295 Z', labelX: 510, labelY: 293 },
  PE: { name: 'Pernambuco', path: 'M445,295 L460,295 L500,305 L545,300 L548,320 L460,330 L440,330 Z', labelX: 495, labelY: 315 },
  AL: { name: 'Alagoas', path: 'M530,325 L555,320 L558,340 L535,342 Z', labelX: 544, labelY: 333 },
  SE: { name: 'Sergipe', path: 'M525,342 L550,345 L548,360 L525,356 Z', labelX: 537, labelY: 352 },
  BA: { name: 'Bahia', path: 'M380,350 L410,340 L440,330 L460,330 L525,342 L525,356 L520,400 L490,440 L440,460 L400,445 L375,400 Z', labelX: 450, labelY: 395 },
  MT: { name: 'Mato Grosso', path: 'M200,320 L280,320 L335,330 L330,370 L340,410 L310,440 L250,430 L220,400 L190,380 L185,340 Z', labelX: 265, labelY: 375 },
  GO: { name: 'Goiás', path: 'M340,410 L375,400 L400,445 L395,480 L365,490 L340,480 L320,460 L310,440 Z', labelX: 355, labelY: 450 },
  DF: { name: 'Distrito Federal', path: 'M375,445 L390,445 L390,455 L375,455 Z', labelX: 383, labelY: 452 },
  MS: { name: 'Mato Grosso do Sul', path: 'M220,400 L250,430 L310,440 L320,460 L310,500 L280,520 L240,510 L210,480 L200,440 Z', labelX: 260, labelY: 475 },
  MG: { name: 'Minas Gerais', path: 'M365,490 L395,480 L400,445 L440,460 L490,440 L510,460 L500,500 L460,520 L420,530 L380,520 L360,510 Z', labelX: 440, labelY: 490 },
  ES: { name: 'Espírito Santo', path: 'M500,500 L530,490 L535,520 L510,530 L500,520 Z', labelX: 518, labelY: 510 },
  RJ: { name: 'Rio de Janeiro', path: 'M460,520 L500,520 L510,530 L500,550 L465,545 L450,535 Z', labelX: 480, labelY: 536 },
  SP: { name: 'São Paulo', path: 'M310,500 L360,510 L380,520 L420,530 L450,535 L440,560 L400,570 L350,560 L310,540 L280,520 Z', labelX: 370, labelY: 538 },
  PR: { name: 'Paraná', path: 'M280,520 L310,540 L350,560 L370,575 L340,590 L290,590 L260,570 L250,545 Z', labelX: 310, labelY: 565 },
  SC: { name: 'Santa Catarina', path: 'M290,590 L340,590 L350,610 L330,625 L290,620 L275,605 Z', labelX: 315, labelY: 607 },
  RS: { name: 'Rio Grande do Sul', path: 'M275,605 L290,620 L330,625 L340,645 L320,670 L280,680 L250,660 L240,630 L255,615 Z', labelX: 290, labelY: 645 },
  RO: { name: 'Rondônia', path: 'M140,330 L200,320 L185,340 L190,380 L160,390 L130,370 Z', labelX: 165, labelY: 358 },
};

export const STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(BRAZIL_STATES).map(([k, v]) => [k, v.name])
);
