import { describe, it, expect } from 'vitest';
import { parseDuration, parsePred, formatPred } from '../../src/parse.js';

describe('parse', () => {
  it('parses duration strings', () => {
    expect(parseDuration('2w')).toEqual({ v: 2, u: 'w' });
    expect(parseDuration('5')).toEqual({ v: 5, u: 'd' });
  });

  it('round-trips predecessor strings', () => {
    const s = '7fs+2d, 12ss-4h';
    const preds = parsePred(s);
    expect(formatPred(preds)).toBe('7fs+2d,12ss-4h');
  });

  it('rejects invalid input', () => {
    expect(() => parseDuration('abc')).toThrow();
    expect(() => parsePred('x1')).toThrow();
  });
});
