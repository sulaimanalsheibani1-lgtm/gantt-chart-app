import { project, saveProject } from './state.js';
import { renderGrid, getSelectedTaskIndex, setSelectedTask } from './renderGrid.js';
import { renderGantt } from './renderGantt.js';
import { schedule } from './schedule.js';

function refresh() {
  schedule(project.tasks);
  const grid = document.getElementById('grid');
  const gantt = document.getElementById('gantt');
  if (grid) renderGrid(grid, project.tasks);
  if (gantt) renderGantt(gantt, project.tasks);
  saveProject();
}

function refreshHierarchy() {
  project.tasks.forEach((t, i) => {
    const next = project.tasks[i + 1];
    t.isSummary = next ? next.level > t.level : false;
  });
}

function addTask() {
  const idx = getSelectedTaskIndex(project.tasks);
  const level = idx >= 0 ? project.tasks[idx].level : 0;
  const task = {
    id: project.nextId++,
    level,
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
  };
  if (idx >= 0) {
    project.tasks.splice(idx + 1, 0, task);
  } else {
    project.tasks.push(task);
  }
  setSelectedTask(task.id);
  refreshHierarchy();
  refresh();
}

function deleteTask() {
  const idx = getSelectedTaskIndex(project.tasks);
  if (idx >= 0) {
    project.tasks.splice(idx, 1);
    setSelectedTask(null);
    refreshHierarchy();
    refresh();
  }
}

function indentTask() {
  const idx = getSelectedTaskIndex(project.tasks);
  if (idx > 0) {
    const task = project.tasks[idx];
    const prev = project.tasks[idx - 1];
    task.level = Math.min(task.level + 1, prev.level + 1);
    refreshHierarchy();
    refresh();
  }
}

function outdentTask() {
  const idx = getSelectedTaskIndex(project.tasks);
  if (idx >= 0) {
    const task = project.tasks[idx];
    task.level = Math.max(0, task.level - 1);
    refreshHierarchy();
    refresh();
  }
}

function moveUp() {
  const idx = getSelectedTaskIndex(project.tasks);
  if (idx > 0) {
    const [task] = project.tasks.splice(idx, 1);
    project.tasks.splice(idx - 1, 0, task);
    refreshHierarchy();
    refresh();
  }
}

function moveDown() {
  const idx = getSelectedTaskIndex(project.tasks);
  if (idx >= 0 && idx < project.tasks.length - 1) {
    const [task] = project.tasks.splice(idx, 1);
    project.tasks.splice(idx + 1, 0, task);
    refreshHierarchy();
    refresh();
  }
}

const stub = label => () => console.log(label + ' clicked');

export function renderToolbar(container) {
  container.className = 'toolbar';
  const right = document.createElement('div');
  right.className = 'toolbar-right';

  const groups = [
    {
      buttons: [
        { label: 'New Project', onClick: stub('New Project') },
        { label: 'Open', onClick: stub('Open') },
        { label: 'Save', onClick: saveProject },
        { label: 'Export', onClick: stub('Export') }
      ]
    },
    {
      buttons: [
        { label: 'Add Task', onClick: addTask },
        { label: 'Delete Task', onClick: deleteTask },
        { label: 'Indent', onClick: indentTask },
        { label: 'Outdent', onClick: outdentTask },
        { label: 'Move Up', onClick: moveUp },
        { label: 'Move Down', onClick: moveDown }
      ]
    },
    {
      buttons: [
        { label: 'Link Tasks', onClick: stub('Link Tasks') },
        { label: 'Unlink Tasks', onClick: stub('Unlink Tasks') },
        { label: 'Auto Schedule', onClick: stub('Auto Schedule') },
        { label: 'Set Milestone', onClick: stub('Set Milestone') },
        { label: 'Toggle Critical Path', onClick: stub('Toggle Critical Path') }
      ]
    },
    {
      buttons: [
        { label: 'Zoom In', onClick: stub('Zoom In') },
        { label: 'Zoom Out', onClick: stub('Zoom Out') },
        { label: 'Settings', onClick: stub('Settings') }
      ]
    }
  ];

  groups.forEach(g => {
    const groupEl = document.createElement('div');
    groupEl.className = 'group';
    g.buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.type = 'button';
      btn.textContent = b.label;
      btn.addEventListener('click', b.onClick);
      groupEl.appendChild(btn);
    });
    right.appendChild(groupEl);
  });

  container.appendChild(right);
}
