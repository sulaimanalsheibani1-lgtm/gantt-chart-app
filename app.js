// Application state and scheduling logic for the Gantt chart manager.
//
// This script defines a lightweight project management tool that enables
// users to build a simple work breakdown structure, link tasks, schedule
// automatically and visualise the result in a Gantt chart. It emphasises
// clear labelling, accessibility and performance for large data sets.

/* global document */

// Constants
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Project state. Tasks are stored as plain objects with the following
// properties:
// id: unique integer identifier
// wbs: work breakdown structure label (computed from hierarchy)
// name: task name
// duration: number of days (0 for milestone)
// start: Date object representing earliest start
// finish: Date object representing earliest finish
// predecessors: comma separated string of predecessor IDs (finish‑to‑start)
// progress: percentage complete
// level: integer indent level (0 = top level)
// isSummary: boolean indicating summary row
// expanded: boolean controlling whether children are visible
let project = {
  name: 'New Project',
  startDate: new Date(),
  tasks: [],
  nextId: 1
};

// UI state
let selectedTaskId = null;
let zoomLevel = 30; // pixels per day
let showCriticalPath = true;
let linkSourceId = null;

// Undo/redo stacks
const undoStack = [];
const redoStack = [];

/**
 * Save the current project state for undo/redo. A deep copy is pushed on
 * the undo stack and the redo stack is cleared. Limit history to 50
 * entries to avoid unbounded memory usage.
 */
function saveState() {
  undoStack.push(JSON.stringify(project));
  if (undoStack.length > 50) undoStack.shift();
  redoStack.length = 0;
}

/** Restore the last state from the undo stack. */
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(project));
  const last = undoStack.pop();
  project = JSON.parse(last, dateReviver);
  calculateSchedule();
  renderAll();
}

/** Restore the next state from the redo stack. */
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(project));
  const next = redoStack.pop();
  project = JSON.parse(next, dateReviver);
  calculateSchedule();
  renderAll();
}

/** Date reviver for JSON.parse to convert ISO strings back into Date objects. */
function dateReviver(key, value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value);
  }
  return value;
}

/**
 * Add a new task below the currently selected task or at the end if
 * nothing is selected. The new task inherits the level of its parent.
 */
function addTask() {
  const idx = selectedTaskId ? project.tasks.findIndex(t => t.id === selectedTaskId) + 1 : project.tasks.length;
  const level = selectedTaskId ? project.tasks.find(t => t.id === selectedTaskId).level : 0;
  const task = {
    id: project.nextId++,
    wbs: '',
    name: 'New Task',
    duration: 1,
    start: null,
    finish: null,
    predecessors: '',
    progress: 0,
    level,
    isSummary: false,
    expanded: true
  };
  project.tasks.splice(idx, 0, task);
  renumberWbs();
  saveState();
  calculateSchedule();
  renderAll();
}

/** Delete the currently selected task (and any child tasks). */
function deleteTask() {
  if (!selectedTaskId) return;
  const idx = project.tasks.findIndex(t => t.id === selectedTaskId);
  if (idx < 0) return;
  const level = project.tasks[idx].level;
  // Determine how many rows to remove (children)
  let count = 1;
  for (let i = idx + 1; i < project.tasks.length; i++) {
    if (project.tasks[i].level > level) count++;
    else break;
  }
  project.tasks.splice(idx, count);
  selectedTaskId = null;
  renumberWbs();
  saveState();
  calculateSchedule();
  renderAll();
}

/** Increase the indentation (nesting) of the selected task. */
function indentTask() {
  if (!selectedTaskId) return;
  const idx = project.tasks.findIndex(t => t.id === selectedTaskId);
  if (idx <= 0) return;
  const prev = project.tasks[idx - 1];
  project.tasks[idx].level = Math.min(prev.level + 1, project.tasks[idx].level + 1);
  renumberWbs();
  saveState();
  calculateSchedule();
  renderAll();
}

/** Decrease the indentation (nesting) of the selected task. */
function outdentTask() {
  if (!selectedTaskId) return;
  const task = project.tasks.find(t => t.id === selectedTaskId);
  if (!task || task.level === 0) return;
  task.level -= 1;
  renumberWbs();
  saveState();
  calculateSchedule();
  renderAll();
}

/** Move the selected task up one position (keeping children). */
function moveTaskUp() {
  if (!selectedTaskId) return;
  const idx = project.tasks.findIndex(t => t.id === selectedTaskId);
  if (idx <= 0) return;
  // Identify block to move (task + children)
  const level = project.tasks[idx].level;
  let count = 1;
  for (let i = idx + 1; i < project.tasks.length; i++) {
    if (project.tasks[i].level > level) count++;
    else break;
  }
  // Identify insertion point above
  let insertAt = idx - 1;
  while (insertAt > 0 && project.tasks[insertAt].level > project.tasks[idx - 1].level) insertAt--;
  const block = project.tasks.splice(idx, count);
  project.tasks.splice(insertAt, 0, ...block);
  saveState();
  calculateSchedule();
  renderAll();
}

/** Move the selected task down one position (keeping children). */
function moveTaskDown() {
  if (!selectedTaskId) return;
  const idx = project.tasks.findIndex(t => t.id === selectedTaskId);
  if (idx < 0 || idx >= project.tasks.length - 1) return;
  const level = project.tasks[idx].level;
  let count = 1;
  for (let i = idx + 1; i < project.tasks.length; i++) {
    if (project.tasks[i].level > level) count++;
    else break;
  }
  // Determine insertion index: skip over next block if deeper than current level
  let insertAt = idx + count;
  let nextLevel = project.tasks[insertAt] ? project.tasks[insertAt].level : 0;
  while (insertAt < project.tasks.length && nextLevel > level) {
    insertAt++;
    nextLevel = project.tasks[insertAt] ? project.tasks[insertAt].level : 0;
  }
  const block = project.tasks.splice(idx, count);
  project.tasks.splice(insertAt, 0, ...block);
  saveState();
  calculateSchedule();
  renderAll();
}

/** Begin linking tasks: on first click set the source task, on second click create FS link. */
function linkTasks() {
  if (!selectedTaskId) return;
  if (!linkSourceId) {
    linkSourceId = selectedTaskId;
    alert('Select the successor task to complete the link.');
  } else {
    if (selectedTaskId === linkSourceId) {
      linkSourceId = null;
      return;
    }
    const successor = project.tasks.find(t => t.id === selectedTaskId);
    const preds = successor.predecessors ? successor.predecessors.split(',').map(x => x.trim()).filter(Boolean) : [];
    if (!preds.includes(String(linkSourceId))) preds.push(String(linkSourceId));
    successor.predecessors = preds.join(',');
    linkSourceId = null;
    saveState();
    calculateSchedule();
    renderAll();
  }
}

/** Unlink all predecessors from the selected task. */
function unlinkTasks() {
  if (!selectedTaskId) return;
  const task = project.tasks.find(t => t.id === selectedTaskId);
  if (!task) return;
  task.predecessors = '';
  saveState();
  calculateSchedule();
  renderAll();
}

/** Set the selected task as a milestone (duration = 0). */
function setMilestone() {
  if (!selectedTaskId) return;
  const task = project.tasks.find(t => t.id === selectedTaskId);
  if (!task) return;
  task.duration = 0;
  saveState();
  calculateSchedule();
  renderAll();
}

/** Toggle critical path highlighting. */
function toggleCriticalPath() {
  showCriticalPath = !showCriticalPath;
  renderGantt();
}

/** Zoom functions adjust the pixels per day and refresh the chart. */
function zoomOut() {
  zoomLevel = Math.max(5, zoomLevel - 10);
  renderGantt();
}

function zoomIn() {
  zoomLevel = Math.min(100, zoomLevel + 10);
  renderGantt();
}

function zoomReset() {
  zoomLevel = 30;
  renderGantt();
}

/** Generate comma separated WBS codes based on position and level. */
function renumberWbs() {
  function computeWbs(idx, prefix, level, result) {
    let counter = 1;
    while (idx < project.tasks.length) {
      const t = project.tasks[idx];
      if (t.level === level) {
        const wbs = prefix ? `${prefix}.${counter}` : `${counter}`;
        t.wbs = wbs;
        idx++;
        // process children
        idx = computeWbs(idx, wbs, level + 1, result);
        counter++;
        continue;
      }
      if (t.level < level) break;
      idx++;
    }
    return idx;
  }
  computeWbs(0, '', 0);
}

/**
 * Schedule all tasks based on predecessors. Uses a simple forward pass
 * to compute earliest start (t.start) and earliest finish (t.finish). A
 * backward pass computes latest start/finish and slack; tasks with zero
 * slack are flagged as critical. Summary rows simply encompass the
 * earliest start and latest finish of their children.
 */
function calculateSchedule() {
  const tasks = project.tasks;
  const tasksById = new Map(tasks.map(t => [t.id, t]));
  // Reset summary flags
  tasks.forEach(t => { t.isSummary = false; });
  // Identify summary rows: a task is a summary if the next task has a higher level
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const next = tasks[i + 1];
    t.isSummary = next && next.level > t.level;
  }
  // Forward pass: compute earliest start/finish for non-summary tasks
  tasks.forEach(t => {
    if (t.isSummary) {
      t.start = null;
      t.finish = null;
      return;
    }
    const preds = t.predecessors ? t.predecessors.split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean) : [];
    let startDate = new Date(project.startDate);
    for (const pid of preds) {
      const p = tasksById.get(pid);
      if (p && p.finish) {
        if (p.finish > startDate) startDate = new Date(p.finish);
      }
    }
    t.start = new Date(startDate);
    t.finish = new Date(startDate);
    t.finish.setDate(t.finish.getDate() + (t.duration || 0));
    t.predecessorIds = preds;
  });
  // Propagate start/finish for summary rows
  for (let i = tasks.length - 1; i >= 0; i--) {
    const t = tasks[i];
    if (!t.isSummary) continue;
    // summary's children are contiguous until a task of same or lower level
    let minStart = null;
    let maxFinish = null;
    for (let j = i + 1; j < tasks.length; j++) {
      const child = tasks[j];
      if (child.level <= t.level) break;
      if (child.start) {
        if (!minStart || child.start < minStart) minStart = new Date(child.start);
      }
      if (child.finish) {
        if (!maxFinish || child.finish > maxFinish) maxFinish = new Date(child.finish);
      }
    }
    t.start = minStart;
    t.finish = maxFinish;
  }
  // Backward pass for slack calculation on non-summary tasks
  // Build successor lists
  tasks.forEach(t => { t.successors = []; });
  tasks.forEach(t => {
    if (!t.isSummary && t.predecessorIds) {
      t.predecessorIds.forEach(pid => {
        const p = tasksById.get(pid);
        if (p) p.successors.push(t.id);
      });
    }
  });
  // Determine project finish as latest finish among all leaf tasks
  let projectFinish = null;
  tasks.forEach(t => {
    if (!t.isSummary && t.finish) {
      if (!projectFinish || t.finish > projectFinish) projectFinish = new Date(t.finish);
    }
  });
  tasks.forEach(t => {
    t.latestFinish = projectFinish ? new Date(projectFinish) : null;
  });
  // Backwards adjust latest finish based on successors
  let updated = true;
  while (updated) {
    updated = false;
    for (const t of tasks) {
      if (t.isSummary) continue;
      if (!t.successors || !t.successors.length) continue;
      let minStart = projectFinish;
      for (const sid of t.successors) {
        const s = tasksById.get(sid);
        if (s && s.start && s.start < minStart) {
          minStart = new Date(s.start);
        }
      }
      if (minStart && t.latestFinish && minStart < t.latestFinish) {
        t.latestFinish = new Date(minStart);
        updated = true;
      }
    }
  }
  // Compute slack and critical flag
  tasks.forEach(t => {
    if (t.isSummary || !t.start || !t.latestFinish) {
      t.slack = null;
      t.isCritical = false;
      return;
    }
    t.latestStart = new Date(t.latestFinish);
    t.latestStart.setDate(t.latestStart.getDate() - (t.duration || 0));
    t.slack = (t.latestStart - t.start) / MS_PER_DAY;
    t.isCritical = Math.abs(t.slack) < 0.0001;
  });
}

/**
 * Render all parts of the UI: title, task list and Gantt chart.
 */
function renderAll() {
  document.getElementById('projectTitle').textContent = project.name;
  renderTaskList();
  renderGantt();
}

/**
 * Render the task table based on the current project.tasks array. Each
 * row is focusable and can be selected. Inline editing is provided for
 * task name and duration. Changing duration triggers a reschedule.
 */
function renderTaskList() {
  const container = document.getElementById('taskList');
  container.innerHTML = '';
  project.tasks.forEach(task => {
    if (!isTaskVisible(task)) return;
    const row = document.createElement('div');
    row.className = 'task-row' + (task.id === selectedTaskId ? ' selected' : '') + (task.isSummary ? ' summary' : '');
    row.setAttribute('role', 'row');
    row.dataset.id = task.id;
    // Column 1: ID
    const idCell = document.createElement('div');
    idCell.className = 'task-id';
    idCell.textContent = task.id;
    row.appendChild(idCell);
    // Column 2: WBS
    const wbsCell = document.createElement('div');
    wbsCell.className = 'task-wbs';
    wbsCell.textContent = task.wbs;
    row.appendChild(wbsCell);
    // Column 3: Name
    const nameCell = document.createElement('div');
    nameCell.className = 'task-name';
    // Indentation spacers and toggle arrow for summary rows
    for (let i = 0; i < task.level; i++) {
      const spacer = document.createElement('div');
      spacer.className = 'indent-spacer';
      nameCell.appendChild(spacer);
    }
    if (task.isSummary) {
      const arrow = document.createElement('span');
      arrow.className = 'expand-icon' + (task.expanded ? '' : ' collapsed');
      arrow.textContent = task.expanded ? '▼' : '▶';
      arrow.addEventListener('click', e => {
        e.stopPropagation();
        task.expanded = !task.expanded;
        renderAll();
      });
      nameCell.appendChild(arrow);
    }
    const nameInput = document.createElement('input');
    nameInput.value = task.name;
    nameInput.disabled = task.isSummary;
    nameInput.addEventListener('change', () => {
      task.name = nameInput.value;
      saveState();
      renderAll();
    });
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);
    // Column 4: Duration
    const durCell = document.createElement('div');
    durCell.className = 'task-duration';
    if (task.isSummary) {
      durCell.textContent = '';
    } else {
      const durInput = document.createElement('input');
      durInput.type = 'number';
      durInput.min = 0;
      durInput.value = task.duration;
      durInput.addEventListener('change', () => {
        const val = parseInt(durInput.value, 10);
        task.duration = isNaN(val) ? 0 : val;
        saveState();
        calculateSchedule();
        renderAll();
      });
      durCell.appendChild(durInput);
    }
    row.appendChild(durCell);
    // Column 5: Start
    const startCell = document.createElement('div');
    startCell.className = 'task-start';
    startCell.textContent = task.start ? formatDate(task.start) : '';
    row.appendChild(startCell);
    // Column 6: Finish
    const finishCell = document.createElement('div');
    finishCell.className = 'task-finish';
    finishCell.textContent = task.finish ? formatDate(task.finish) : '';
    row.appendChild(finishCell);
    // Column 7: Predecessors
    const predCell = document.createElement('div');
    predCell.className = 'task-predecessors';
    const predInput = document.createElement('input');
    predInput.value = task.predecessors;
    predInput.disabled = task.isSummary;
    predInput.addEventListener('change', () => {
      task.predecessors = predInput.value;
      saveState();
      calculateSchedule();
      renderAll();
    });
    predCell.appendChild(predInput);
    row.appendChild(predCell);
    // Column 8: Progress
    const progCell = document.createElement('div');
    progCell.className = 'task-progress';
    const progInput = document.createElement('input');
    progInput.type = 'number';
    progInput.min = 0;
    progInput.max = 100;
    progInput.value = task.progress;
    progInput.disabled = task.isSummary;
    progInput.addEventListener('change', () => {
      const val = parseInt(progInput.value, 10);
      task.progress = Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
      saveState();
      renderAll();
    });
    progCell.appendChild(progInput);
    row.appendChild(progCell);
    // Click handler to select row
    row.addEventListener('click', () => {
      selectedTaskId = task.id;
      renderTaskList();
      renderGantt();
    });
    container.appendChild(row);
  });
}

/** Determine whether a task row should be visible based on expanded state. */
function isTaskVisible(task) {
  // A task is visible if all its ancestors are expanded
  const index = project.tasks.indexOf(task);
  let level = task.level;
  let i = index - 1;
  while (i >= 0 && level > 0) {
    const parent = project.tasks[i];
    if (parent.level < level) {
      if (!parent.expanded) return false;
      level = parent.level;
    }
    i--;
  }
  return true;
}

/** Format a Date object as YYYY‑MM‑DD for display. */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Render the Gantt chart: header, bars and dependency lines. */
function renderGantt() {
  const header = document.getElementById('ganttHeader');
  const body = document.getElementById('ganttBody');
  const barsContainer = document.getElementById('barsContainer');
  const depsSvg = document.getElementById('depsSvg');
  header.innerHTML = '';
  barsContainer.innerHTML = '';
  depsSvg.innerHTML = '';
  // Determine visible tasks and compute earliest and latest dates for timeline
  const visibleTasks = project.tasks.filter(isTaskVisible);
  if (!visibleTasks.length) return;
  let firstDate = null;
  let lastDate = null;
  visibleTasks.forEach(t => {
    if (!t.start || !t.finish) return;
    if (!firstDate || t.start < firstDate) firstDate = new Date(t.start);
    if (!lastDate || t.finish > lastDate) lastDate = new Date(t.finish);
  });
  if (!firstDate) return;
  // Add margin of one week on either side
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(lastDate);
  endDate.setDate(endDate.getDate() + 14);
  const totalDays = Math.ceil((endDate - startDate) / MS_PER_DAY);
  // Build month and day rows
  const monthRow = document.createElement('div');
  monthRow.className = 'month-row';
  const dayRow = document.createElement('div');
  dayRow.className = 'day-row';
  let current = new Date(startDate);
  let monthStartIndex = 0;
  let daysInCurrentMonth = 0;
  for (let i = 0; i < totalDays; i++) {
    const month = current.getMonth();
    const year = current.getFullYear();
    daysInCurrentMonth++;
    // If next day is a new month or end of loop, append month cell
    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    if (next.getMonth() !== month || i === totalDays - 1) {
      const monthCell = document.createElement('div');
      monthCell.style.width = `${daysInCurrentMonth * zoomLevel}px`;
      monthCell.textContent = `${year}-${String(month + 1).padStart(2, '0')}`;
      monthRow.appendChild(monthCell);
      daysInCurrentMonth = 0;
    }
    // Create day cell
    const dayCell = document.createElement('div');
    dayCell.style.width = `${zoomLevel}px`;
    dayCell.textContent = String(current.getDate());
    // Shade weekends
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayCell.style.background = 'var(--muted)';
    }
    dayRow.appendChild(dayCell);
    current.setDate(current.getDate() + 1);
  }
  header.appendChild(monthRow);
  header.appendChild(dayRow);
  // Set the height of bars container based on number of visible tasks
  barsContainer.style.height = `${visibleTasks.length * parseInt(getComputedStyle(document.documentElement).getPropertyValue('--row-height'))}px`;
  // Draw bars
  visibleTasks.forEach((t, index) => {
    if (!t.start || !t.finish) return;
    const bar = document.createElement('div');
    bar.className = 'bar';
    if (t.duration === 0) bar.classList.add('milestone');
    if (showCriticalPath && t.isCritical && t.duration > 0) bar.classList.add('critical');
    bar.dataset.id = t.id;
    // Positioning
    const offsetDays = (t.start - startDate) / MS_PER_DAY;
    const widthDays = t.duration === 0 ? 1 : t.duration;
    bar.style.left = `${offsetDays * zoomLevel}px`;
    bar.style.width = t.duration === 0 ? '14px' : `${widthDays * zoomLevel}px`;
    bar.style.top = `${index * parseInt(getComputedStyle(document.documentElement).getPropertyValue('--row-height')) + 4}px`;
    bar.textContent = t.name;
    // Click selects the task
    bar.addEventListener('click', () => {
      selectedTaskId = t.id;
      renderTaskList();
      renderGantt();
    });
    barsContainer.appendChild(bar);
  });
  // Draw dependency lines after bars are in DOM
  drawDependencies(startDate);
}

/** Draw dependency arrows in the SVG layer. */
function drawDependencies(startDate) {
  const depsSvg = document.getElementById('depsSvg');
  depsSvg.innerHTML = '';
  // Define arrowhead marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('refX', '5');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M0 0 L6 3 L0 6 Z');
  path.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-sub'));
  marker.appendChild(path);
  defs.appendChild(marker);
  depsSvg.appendChild(defs);
  // For each task, draw lines from predecessors to it
  const bars = document.querySelectorAll('.bar');
  const barById = {};
  bars.forEach(bar => {
    barById[bar.dataset.id] = bar;
  });
  project.tasks.forEach(t => {
    if (!isTaskVisible(t) || !t.predecessors) return;
    const succBar = barById[t.id];
    const preds = t.predecessors.split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean);
    preds.forEach(pid => {
      const predBar = barById[pid];
      if (!predBar || !succBar) return;
      const x1 = predBar.offsetLeft + predBar.offsetWidth;
      const y1 = predBar.offsetTop + predBar.offsetHeight / 2;
      const x2 = succBar.offsetLeft;
      const y2 = succBar.offsetTop + succBar.offsetHeight / 2;
      const linkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX1 = x1 + 20;
      const midX2 = x2 - 20;
      linkPath.setAttribute('d', `M ${x1} ${y1} L ${midX1} ${y1} L ${midX2} ${y2} L ${x2} ${y2}`);
      linkPath.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--text-sub'));
      linkPath.setAttribute('stroke-width', '2');
      linkPath.setAttribute('fill', 'none');
      linkPath.setAttribute('marker-end', 'url(#arrowhead)');
      depsSvg.appendChild(linkPath);
    });
  });
}

/** Export the project as a JSON file for download. */
function exportProject() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${project.name || 'project'}.json`);
  link.click();
}

/** Import a project from a JSON file selected by the user. */
function importProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const obj = JSON.parse(e.target.result, dateReviver);
        if (obj && obj.tasks) {
          project = obj;
          calculateSchedule();
          renumberWbs();
          saveState();
          renderAll();
        }
      } catch (err) {
        alert('Failed to import project: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

/** Export the task list as CSV for external analysis. */
function exportCsv() {
  const lines = [];
  lines.push('id,wbs,name,duration,start,finish,predecessors,progress');
  project.tasks.forEach(t => {
    const row = [t.id, t.wbs, escapeCsv(t.name), t.duration, t.start ? formatDate(t.start) : '', t.finish ? formatDate(t.finish) : '', t.predecessors, t.progress];
    lines.push(row.join(','));
  });
  const csvStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvStr);
  link.setAttribute('download', `${project.name || 'project'}.csv`);
  link.click();
}

function escapeCsv(str) {
  if (str.includes(',') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** Reset project to a clean state. */
function newProject() {
  if (!confirm('Discard current project and start a new one?')) return;
  project = { name: 'New Project', startDate: new Date(), tasks: [], nextId: 1 };
  selectedTaskId = null;
  saveState();
  renderAll();
}

/** Persist project to local storage. */
function saveProject() {
  localStorage.setItem('ganttProject', JSON.stringify(project));
  alert('Project saved locally.');
}

/** Load project from local storage if it exists. */
function loadProject() {
  const data = localStorage.getItem('ganttProject');
  if (!data) {
    alert('No saved project found.');
    return;
  }
  try {
    const obj = JSON.parse(data, dateReviver);
    if (obj && obj.tasks) {
      project = obj;
      renumberWbs();
      calculateSchedule();
      saveState();
      renderAll();
    }
  } catch (err) {
    alert('Failed to load project: ' + err.message);
  }
}

/**
 * Set up event listeners on toolbar buttons, keyboard shortcuts and
 * resizable panels. This function is called once on page load.
 */
function setupEventListeners() {
  // Toolbar commands
  document.getElementById('newProjectBtn').addEventListener('click', newProject);
  document.getElementById('saveBtn').addEventListener('click', saveProject);
  document.getElementById('openBtn').addEventListener('click', loadProject);
  document.getElementById('exportBtn').addEventListener('click', exportCsv);
  document.getElementById('addTaskBtn').addEventListener('click', addTask);
  document.getElementById('deleteTaskBtn').addEventListener('click', deleteTask);
  document.getElementById('indentBtn').addEventListener('click', indentTask);
  document.getElementById('outdentBtn').addEventListener('click', outdentTask);
  document.getElementById('moveUpBtn').addEventListener('click', moveTaskUp);
  document.getElementById('moveDownBtn').addEventListener('click', moveTaskDown);
  document.getElementById('linkBtn').addEventListener('click', linkTasks);
  document.getElementById('unlinkBtn').addEventListener('click', unlinkTasks);
  document.getElementById('autoScheduleBtn').addEventListener('click', () => {
    calculateSchedule();
    renderAll();
  });
  document.getElementById('milestoneBtn').addEventListener('click', setMilestone);
  document.getElementById('criticalPathBtn').addEventListener('click', toggleCriticalPath);
  document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
  document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
  document.getElementById('zoomResetBtn').addEventListener('click', zoomReset);
  document.getElementById('settingsBtn').addEventListener('click', () => alert('Settings are not implemented yet.'));
  // Bottom bar (mobile)
  document.getElementById('mobileAddTask').addEventListener('click', addTask);
  document.getElementById('mobileLinkTasks').addEventListener('click', linkTasks);
  document.getElementById('mobileAutoSchedule').addEventListener('click', () => {
    calculateSchedule();
    renderAll();
  });
  document.getElementById('mobileZoom').addEventListener('click', zoomIn);
  // Panel resizer drag handling
  const resizer = document.getElementById('panelResizer');
  const container = document.querySelector('.main-container');
  let isDragging = false;
  resizer.addEventListener('mousedown', e => {
    isDragging = true;
    document.body.style.cursor = 'col-resize';
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    const newWidth = Math.min(Math.max(e.clientX - rect.left, 200), rect.width - 200);
    document.querySelector('.task-panel').style.width = `${newWidth}px`;
  });
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = 'default';
    }
  });
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      linkSourceId = null;
    }
    if (e.key === 'Delete' && selectedTaskId) {
      deleteTask();
      e.preventDefault();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) redo(); else undo();
      e.preventDefault();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      saveProject();
      e.preventDefault();
    }
  });
}

/** Initialise the application on page load. */
function init() {
  setupEventListeners();
  // Load saved project if available
  const saved = localStorage.getItem('ganttProject');
  if (saved) {
    try {
      project = JSON.parse(saved, dateReviver);
    } catch (e) {
      // ignore corrupted storage
    }
  }
  // If no tasks, create a small sample so the chart is not empty
  if (!project.tasks.length) {
    project.tasks.push(
      { id: project.nextId++, wbs: '', name: 'Phase 1', duration: 5, start: null, finish: null, predecessors: '', progress: 0, level: 0, isSummary: false, expanded: true },
      { id: project.nextId++, wbs: '', name: 'Task 1.1', duration: 3, start: null, finish: null, predecessors: '', progress: 0, level: 1, isSummary: false, expanded: true },
      { id: project.nextId++, wbs: '', name: 'Task 1.2', duration: 2, start: null, finish: null, predecessors: '2', progress: 0, level: 1, isSummary: false, expanded: true }
    );
    renumberWbs();
  }
  calculateSchedule();
  saveState();
  renderAll();
}

// Kick off once DOM is ready if running in a browser context.  In a
// Node environment (e.g. during unit tests) `window` is undefined, so
// attach the listener conditionally to avoid a ReferenceError.
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', init);
}

// Export functions for unit tests. These named exports are ignored by the
// browser but allow Vitest to import scheduling logic without pulling in
// DOM‑specific code. Only pure functions and state are exposed.
export { project, calculateSchedule, renumberWbs, formatDate, MS_PER_DAY };