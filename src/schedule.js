// Scheduling engine implementing forward and backward pass calculations.
// Tasks are expected to contain duration (days), start/finish dates and
// an array of parsed predecessor links { id, type, lag }.

import { MS_PER_DAY } from './state.js';
import { daysToMs } from './parse.js';

/** Perform a forward pass computing earliest start/finish dates. */
function forwardPass(tasks, projectStart) {
  const byId = new Map(tasks.map(t => [t.id, t]));
  for (const t of tasks) {
    if (t.isSummary || t.manual) continue;
    let es = new Date(projectStart);
    for (const link of t.dependencies || []) {
      const pred = byId.get(link.id);
      if (!pred) continue;
      let candidate = new Date(pred.finish || projectStart);
      switch (link.type) {
        case 'SS':
          candidate = new Date(pred.start || projectStart);
          break;
        case 'FF':
          candidate = new Date((pred.finish || projectStart) - daysToMs(t.duration || 0));
          break;
        case 'SF':
          candidate = new Date((pred.start || projectStart) - daysToMs(t.duration || 0));
          break;
        default:
          break; // FS is default using pred.finish
      }
      candidate = new Date(candidate.getTime() + daysToMs(link.lag));
      if (candidate > es) es = candidate;
    }
    t.start = es;
    t.finish = new Date(es.getTime() + daysToMs(t.duration || 0));
  }
}

/** Perform a backward pass computing latest start/finish and float. */
function backwardPass(tasks) {
  // Determine project finish as latest finish among tasks
  let projectFinish = null;
  for (const t of tasks) {
    if (!t.isSummary && t.finish) {
      if (!projectFinish || t.finish > projectFinish) projectFinish = new Date(t.finish);
    }
  }
  for (const t of tasks) {
    if (t.isSummary) continue;
    t.latestFinish = new Date(projectFinish);
  }
  let updated = true;
  while (updated) {
    updated = false;
    for (const t of tasks) {
      if (t.isSummary) continue;
      const succs = tasks.filter(s => (s.dependencies || []).some(d => d.id === t.id));
      if (!succs.length) continue;
      let min = new Date(projectFinish);
      for (const s of succs) {
        if (s.start < min) min = new Date(s.start);
      }
      if (min < t.latestFinish) {
        t.latestFinish = min;
        updated = true;
      }
    }
  }
  for (const t of tasks) {
    if (t.isSummary || !t.start || !t.latestFinish) continue;
    t.latestStart = new Date(t.latestFinish.getTime() - daysToMs(t.duration || 0));
    t.totalFloat = (t.latestStart - t.start) / MS_PER_DAY;
    t.isCritical = Math.abs(t.totalFloat) < 1e-9;
  }
}

/** Calculate schedule for the given project object. */
export function calculateSchedule(project) {
  const tasks = project.tasks;
  forwardPass(tasks, project.startDate);
  backwardPass(tasks);
}

