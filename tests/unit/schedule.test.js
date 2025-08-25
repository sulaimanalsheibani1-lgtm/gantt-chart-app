import { describe, it, expect } from 'vitest';
import { project } from '../../src/state.js';
import { schedule } from '../../src/schedule.js';
import { diffWork, addWork } from '../../src/calendar.js';

function makeTask(id, props = {}) {
  return Object.assign(
    {
      id,
      level: 0,
      wbs: String(id),
      name: `T${id}`,
      mode: 'auto',
      duration: { v: 1, u: 'd' },
      start: null,
      finish: null,
      predecessors: [],
      percentComplete: 0,
      constraint: { type: 'ASAP', date: null },
      notes: '',
      isSummary: false,
      expanded: true
    },
    props
  );
}

describe('schedule', () => {
  it('handles dependencies, constraints and manual mode', () => {
    project.startDate = new Date('2024-03-04'); // Monday
    project.tasks = [];
    const t1 = makeTask(1, { duration: { v: 2, u: 'd' } });
    const t2 = makeTask(2, {
      predecessors: [{ id: 1, type: 'fs', lag: { v: 1, u: 'd' } }]
    });
    const t3 = makeTask(3, {
      predecessors: [{ id: 1, type: 'ss', lag: { v: 1, u: 'd' } }]
    });
    const t4 = makeTask(4, {
      predecessors: [{ id: 1, type: 'ff', lag: { v: 1, u: 'd' } }]
    });
    const t5 = makeTask(5, {
      predecessors: [{ id: 1, type: 'sf', lag: { v: 1, u: 'd' } }]
    });
    const manualStart = new Date('2024-03-04');
    const manualFinish = addWork(manualStart, 1, 'd');
    const t6 = makeTask(6, {
      mode: 'manual',
      start: manualStart,
      finish: manualFinish,
      predecessors: [{ id: 1, type: 'fs', lag: { v: 0, u: 'd' } }]
    });
    const snetDate = addWork(project.startDate, 3, 'd');
    const t7 = makeTask(7, {
      constraint: { type: 'SNET', date: snetDate }
    });
    project.tasks.push(t1, t2, t3, t4, t5, t6, t7);
    schedule(project.tasks);

    expect(diffWork(t1.EF, t2.ES, 'd')).toBe(1);
    expect(diffWork(t1.ES, t3.ES, 'd')).toBe(1);
    expect(diffWork(t1.EF, t4.EF, 'd')).toBe(1);
    expect(diffWork(t1.ES, t5.EF, 'd')).toBe(1);
    expect(t6.ES.getTime()).toBe(manualStart.getTime());
    expect(t7.ES.getTime()).toBe(snetDate.getTime());
    expect(t2.critical).toBe(true);
    expect(t3.critical).toBe(false);
  });
});
