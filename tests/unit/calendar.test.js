import { describe, it, expect } from 'vitest';
import { addWork, diffWork } from '../../src/calendar.js';
import { project } from '../../src/state.js';

describe('calendar', () => {
  it('skips weekends and holidays', () => {
    const start = new Date('2024-03-08'); // Friday
    project.settings.holidays = ['2024-03-11'];
    const end = addWork(start, 1, 'd');
    expect(end.getDay()).toBe(2); // Tuesday
    project.settings.holidays = [];
  });

  it('computes negative work differences', () => {
    const start = new Date('2024-03-08'); // Friday
    const end = new Date('2024-03-05'); // Tuesday
    expect(diffWork(start, end, 'd')).toBe(-3);
  });
});
