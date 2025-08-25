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

export function filterTasks(tasks, query) {
  if (!query) return tasks;
  const q = query.toLowerCase();
  return tasks.filter(t => `${t.id}`.includes(q) || t.name.toLowerCase().includes(q));
}

export function renderGrid(container, tasks) {
  container.innerHTML = '';
  updateWBS(tasks);
  tasks.forEach(t => {
    const row = document.createElement('div');
    row.setAttribute('role', 'row');
    row.textContent = `${t.id} ${t.wbs} ${t.name}`;
    container.appendChild(row);
  });
}
