// Centralised application state and defaults for the Gantt chart app.
// This module exposes helpers used across the codebase so that other
// modules can construct new project objects and access common constants.

// Number of milliseconds in a day. Exported for scheduling calculations.
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Provide default project settings. These mirror Microsoft Project's
// defaults and are reused whenever a new project is created.
export function defaultSettings() {
  return {
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    dateFormat: 'yyyy-MM-dd',
    showToday: true
  };
}

// Create a fresh project object with initial values. This helper is used
// by the application to initialise state and when starting a new project.
export function createProject() {
  return {
    name: 'New Project',
    startDate: new Date(),
    tasks: [],
    nextId: 1,
    settings: defaultSettings()
  };
}
