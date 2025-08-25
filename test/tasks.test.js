import fs from 'fs';
import { test, expect } from 'vitest';

const html = fs.readFileSync('frappe-demo.html', 'utf8');

test('Frappe demo page contains task data and Gantt initialisation', () => {
  // Ensure the demo page includes Frappe Gantt initialisation
  expect(html).toContain('new Gantt');

  // Extract tasks array from the demo page
  const match = html.match(/const tasks = \[(.*?)\];/s);
  expect(match).toBeTruthy();
  const tasks = eval('[' + match[1] + ']');

  // Basic assertions about task structure
  expect(Array.isArray(tasks)).toBe(true);
  expect(tasks.length).toBeGreaterThanOrEqual(2);
  expect(tasks.every(t => t.id && t.name)).toBe(true);
});

