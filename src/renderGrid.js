// Basic task grid rendering and helpers. The full implementation would
// provide virtualised rows, inline editing and filtering. For now we expose
// minimal stubs so that other modules can hook into the API.

export function updateWBS(tasks) {
  const stack = [];
  tasks.forEach(t => {
    stack.length = t.level;
    stack.push((stack.pop() || 0) + 1);
    t.wbs = stack.join('.');
  });
}

export let selectedTaskId = null;

export function getSelectedTaskIndex(tasks) {
  return tasks.findIndex(t => t.id === selectedTaskId);
}

export function setSelectedTask(id) {
  selectedTaskId = id;
}

export function filterTasks(tasks, query) {
  if (!query) return tasks;
  const q = query.toLowerCase();
  return tasks.filter(t => `${t.id}`.includes(q) || t.name.toLowerCase().includes(q));
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-AU') : '';
}

export function renderGrid(container, tasks) {
  container.innerHTML = '';
  updateWBS(tasks);

  const header = document.createElement('div');
  header.className = 'task-header';
  const cols = [
    'Mode',
    'ID',
    'WBS',
    'Name',
    'Duration',
    'Start',
    'Finish',
    'Predecessors',
    '% complete',
    'Constraint',
    'Notes'
  ];
  cols.forEach(text => {
    const cell = document.createElement('div');
    cell.textContent = text;
    header.appendChild(cell);
  });
  container.appendChild(header);

  const list = document.createElement('div');
  list.className = 'task-list';

  tasks.forEach(t => {
    const row = document.createElement('div');
    row.className = 'task-row';
    if (t.id === selectedTaskId) row.classList.add('selected');
    if (t.critical) row.classList.add('critical');
    if (t.isSummary) row.classList.add('summary');

    const cells = [
      { class: 'task-mode', text: t.mode === 'manual' ? 'M' : 'A' },
      { class: 'task-id', text: t.id },
      { class: 'task-wbs', text: t.wbs },
      { class: 'task-name', text: t.name, indent: t.level },
      { class: 'task-duration', text: `${t.duration?.v ?? ''}${t.duration?.u ?? ''}` },
      { class: 'task-start', text: formatDate(t.start || t.ES) },
      { class: 'task-finish', text: formatDate(t.finish || t.EF) },
      { class: 'task-predecessors', text: (t.predecessors || []).map(p => p.id).join(', ') },
      { class: 'task-progress', text: t.percentComplete },
      { class: 'task-constraint', text: t.constraint?.type || '' },
      { class: 'task-notes', text: t.notes }
    ];

    cells.forEach(c => {
      const cell = document.createElement('div');
      cell.className = c.class;
      if (c.indent) cell.style.paddingLeft = `${c.indent * 20}px`;
      cell.textContent = c.text ?? '';
      row.appendChild(cell);
    });

    row.addEventListener('click', () => {
      setSelectedTask(t.id);
      renderGrid(container, tasks);
    });

    list.appendChild(row);
  });

  container.appendChild(list);
}
