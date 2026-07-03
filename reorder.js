const fs = require('fs');

let content = fs.readFileSync('components/admin/ChurchFormModal.tsx', 'utf8');

// The file has these markers:
// {/* SESSÃO 1: ESTRUTURA E SEDE */}
// {/* SESSÃO 2: LIMITES DO PLANO */}
// {/* SESSÃO 3: WHITE LABEL */}
// {/* SESSÃO 4: FATURAMENTO */}
// {/* SESSÃO 5: DEPARTAMENTOS */}
// {/* SESSÃO 6: AGENDA DE CULTOS */}
// </form>

// Let's extract the exact string for each session.
function getSection(startMarker, endMarker) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker, startIdx);
  if (startIdx === -1 || endIdx === -1) throw new Error("Marker not found: " + startMarker);
  return content.substring(startIdx, endIdx);
}

const s1 = getSection('{/* SESSÃO 1: ESTRUTURA E SEDE */}', '{/* SESSÃO 2: LIMITES DO PLANO */}');
const s2 = getSection('{/* SESSÃO 2: LIMITES DO PLANO */}', '{/* SESSÃO 3: WHITE LABEL */}');
const s3 = getSection('{/* SESSÃO 3: WHITE LABEL */}', '{/* SESSÃO 4: FATURAMENTO */}');
const s4 = getSection('{/* SESSÃO 4: FATURAMENTO */}', '{/* SESSÃO 5: DEPARTAMENTOS */}');
const s5 = getSection('{/* SESSÃO 5: DEPARTAMENTOS */}', '{/* SESSÃO 6: AGENDA DE CULTOS */}');
const s6 = getSection('{/* SESSÃO 6: AGENDA DE CULTOS */}', '</form>');

// Now we replace the whole block between SESSÃO 1 and </form>
const startIdx = content.indexOf('{/* SESSÃO 1: ESTRUTURA E SEDE */}');
const endIdx = content.indexOf('</form>');

const prefix = content.substring(0, startIdx);
const suffix = content.substring(endIdx);

// The user wants Faturamento (S4) to be LAST.
// Let's do: S1 -> S5 (Dept) -> S6 (Cultos) -> S3 (White Label) -> S2 (Limites) -> S4 (Faturamento)
const newOrder = s1 + s5 + s6 + s3 + s2 + s4;

fs.writeFileSync('components/admin/ChurchFormModal.tsx', prefix + newOrder + suffix);
console.log('Reordered successfully!');
