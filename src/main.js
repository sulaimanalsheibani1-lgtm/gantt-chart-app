import { project, loadProject, saveProject } from './state.js';
import { renderGrid } from './renderGrid.js';
import { renderGantt } from './renderGantt.js';
import { schedule } from './schedule.js';
import { initInteractions } from './interactions.js';
import { renderToolbar } from './renderToolbar.js';

// Entry point for the application. Render the grid and gantt once the DOM is ready.

document.addEventListener('DOMContentLoaded', () => {
  loadProject();
  if (project.tasks.length === 0) {
    project.tasks.push({
      id: project.nextId++,
      level: 0,
      name: 'New Task',
      mode: 'auto',
      duration: { v: 1, u: 'd' },
      start: project.startDate,
      finish: null,
      predecessors: [],
      percentComplete: 0,
      constraint: null,
      notes: '',
      isSummary: false
    });
    saveProject();
  }
  const toolbar = document.getElementById('toolbar');
  const grid = document.getElementById('grid');
  const gantt = document.getElementById('gantt');
  if (toolbar) renderToolbar(toolbar);
  schedule(project.tasks);
  if (grid) renderGrid(grid, project.tasks);
  if (gantt) renderGantt(gantt, project.tasks);
  initInteractions();
});
