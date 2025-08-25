// Parsing helpers for user-entered duration and predecessor strings.

const DURATION_RE = /^(\d+)([hdw])?$/i;
const PRED_RE = /^(\d+)\s*(fs|ss|ff|sf)?\s*([+-]\s*\d+\s*[hdw])?$/i;

export function parseDuration(str) {
  const match = str.trim().match(DURATION_RE);
  if (!match) throw new Error('Invalid duration');
  return { v: Number(match[1]), u: (match[2] || 'd').toLowerCase() };
}

export function parsePred(str) {
  if (!str) return [];
  return str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(part => {
      const m = part.match(PRED_RE);
      if (!m) throw new Error('Invalid predecessor');
      const lagStr = m[3] ? m[3].replace(/\s+/g, '') : '';
      const lag = lagStr ? parseDuration(lagStr.replace(/^[+-]/, '')) : { v: 0, u: 'd' };
      if (lagStr.startsWith('-')) lag.v = -lag.v;
      return { id: Number(m[1]), type: (m[2] || 'fs').toLowerCase(), lag };
    });
}

export function formatPred(preds) {
  return preds
    .map(p => {
      const lag = p.lag && p.lag.v ? `${p.lag.v >= 0 ? '+' : ''}${p.lag.v}${p.lag.u}` : '';
      return `${p.id}${p.type}${lag}`;
    })
    .join(',');
}
