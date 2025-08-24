const fs = require('fs');
const assert = require('assert');

// Ensure the demo page includes Frappe Gantt initialization
const html = fs.readFileSync('frappe-demo.html', 'utf8');
assert(html.includes('new Gantt'), 'Frappe Gantt initialization not found');

// Extract tasks array from the demo page
const match = html.match(/const tasks = \[(.*?)\];/s);
assert(match, 'tasks array not found in demo page');
const tasks = eval('[' + match[1] + ']');

// Basic assertions about task structure
assert(Array.isArray(tasks) && tasks.length >= 2, 'expected at least two tasks');
assert(tasks.every(t => t.id && t.name), 'each task should have id and name');

console.log('Frappe demo page contains task data and Gantt initialization.');
