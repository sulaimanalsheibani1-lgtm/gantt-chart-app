// Application state management and default project schema.
// The shape mirrors Microsoft Project's basic fields for parity.

export const project = {
  name: 'Untitled project',
  startDate: new Date(),
  statusDate: null,
  tasks: [],
  nextId: 1,
  settings: {
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    dateFormat: 'dd/MM/yyyy',
    showToday: true,
    holidays: []
  },
  baseline0: null
};

const STORAGE_KEY = 'gantt-project';

export function saveProject() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (e) {
    // Ignore write errors (e.g., storage unavailable)
  }
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.assign(project, data);
    project.startDate = data.startDate ? new Date(data.startDate) : new Date();
    project.tasks = (data.tasks || []).map(t => ({
      ...t,
      start: t.start ? new Date(t.start) : null,
      finish: t.finish ? new Date(t.finish) : null
    }));
  } catch (e) {
    // Ignore parse errors and keep defaults
  }
}
