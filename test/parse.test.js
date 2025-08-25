import { test, expect } from 'vitest';
import { parseDuration, parsePredecessors } from '../src/parse.js';
import { calculateSchedule } from '../src/schedule.js';

// Duration parser tests

test('parseDuration supports hours, days and weeks', () => {
  expect(parseDuration('8h')).toBeCloseTo(8 / 24);
  expect(parseDuration('5d')).toBe(5);
  expect(parseDuration('2w')).toBe(14);
  expect(parseDuration('10')).toBe(10); // default days
});

// Predecessor parser

test('parsePredecessors parses id, type and lag', () => {
  const links = parsePredecessors('1fs+2d,2SS-3d');
  expect(links).toEqual([
    { id: 1, type: 'FS', lag: 2 },
    { id: 2, type: 'SS', lag: -3 }
  ]);
});

// Simple schedule calculation

test('calculateSchedule computes critical path', () => {
  const project = {
    startDate: new Date('2023-01-01'),
    tasks: [
      { id: 1, duration: 2, predecessors: '', level: 0, isSummary: false, manual: false },
      { id: 2, duration: 3, predecessors: '1', level: 0, isSummary: false, manual: false }
    ]
  };
  project.tasks.forEach(t => { t.dependencies = parsePredecessors(t.predecessors); });
  calculateSchedule(project);
  expect(project.tasks[0].isCritical).toBe(true);
  expect(project.tasks[1].start >= project.tasks[0].finish).toBe(true);
});

