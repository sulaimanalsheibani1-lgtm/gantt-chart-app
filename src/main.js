import { project } from './state.js';
import { renderGrid } from './renderGrid.js';
import { renderGantt } from './renderGantt.js';
import { schedule } from './schedule.js';
import { initInteractions } from './interactions.js';

// Entry point for the application. Render the grid and gantt once the DOM is ready.

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('grid');
  const gantt = document.getElementById('gantt');
  schedule(project.tasks);
  if (grid) renderGrid(grid, project.tasks);
  if (gantt) renderGantt(gantt, project.tasks);
  initInteractions();
});
