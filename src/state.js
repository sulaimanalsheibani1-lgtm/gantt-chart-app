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
