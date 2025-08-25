// Parsers for durations and predecessor strings.
// Duration format: number optionally followed by h, d, or w (default d).
// Predecessor format: id{fs|ss|ff|sf}{+/-lag}. Multiple predecessors may
// be comma separated.

import { MS_PER_DAY } from './state.js';

const DUR_RE = /^(\d+)\s*([hdw])?$/i;

/**
 * Parse a duration expression like "10d", "4h" or "2w" into a number of days.
 * If no unit is provided, days are assumed.
 * @param {string} text
 * @returns {number} duration in days
 */
export function parseDuration(text) {
  if (!text) return 0;
  const match = String(text).trim().match(DUR_RE);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'd').toLowerCase();
  switch (unit) {
    case 'h':
      return value / 24;
    case 'w':
      return value * 7;
    default:
      return value;
  }
}

const PRED_RE = /(\d+)\s*(fs|ss|ff|sf)?\s*([+-]\s*\d+\s*[hdw])?/gi;

/**
 * Parse a predecessor string into an array of link objects.
 * Each link has the form { id, type, lag } where lag is in days.
 * @param {string} text
 * @returns {Array<{id:number,type:string,lag:number}>}
 */
export function parsePredecessors(text) {
  if (!text) return [];
  const result = [];
  const src = text.replace(/;/g, ',');
  let match;
  while ((match = PRED_RE.exec(src)) !== null) {
    const id = parseInt(match[1], 10);
    const type = (match[2] || 'fs').toUpperCase();
    let lag = 0;
    if (match[3]) {
      const raw = match[3].replace(/\s+/g, '');
      const sign = raw.startsWith('-') ? -1 : 1;
      const dur = parseDuration(raw.replace(/^[-+]/, ''));
      lag = sign * dur;
    }
    result.push({ id, type, lag });
  }
  return result;
}

/**
 * Convert a duration in days to milliseconds. Helper exported for schedule
 * calculations that rely on these parsers.
 */
export function daysToMs(days) {
  return days * MS_PER_DAY;
}

