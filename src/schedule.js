import { project } from './state.js';
import { addWork, diffWork } from './calendar.js';
import { parseDuration } from './parse.js';

function durationToMinutes(dur, settings) {
  const { v, u } = dur;
  return diffWork(new Date(0), addWork(new Date(0), v, u, settings), 'h', settings) * 60;
}

function topoSort(tasks) {
  const visited = new Set();
  const order = [];
  const map = new Map(tasks.map(t => [t.id, t]));

  function visit(t) {
    if (visited.has(t.id)) return;
    visited.add(t.id);
    (t.predecessors || []).forEach(p => {
      const pt = map.get(p.id);
      if (pt) visit(pt);
    });
    order.push(t);
  }

  tasks.forEach(visit);
  return order;
}

export function schedule(tasks = project.tasks, settings = project.settings) {
  const map = new Map(tasks.map(t => [t.id, t]));
  const order = topoSort(tasks);

  // Forward pass
  for (const t of order) {
    if (t.isSummary) continue;
    if (t.mode === 'manual' && t.start && t.finish) {
      t.ES = t.start;
      t.EF = t.finish;
      continue;
    }
    let es = project.startDate;
    for (const pred of t.predecessors || []) {
      const p = map.get(pred.id);
      if (!p) continue;
      const lag = pred.lag ? addWork(new Date(0), pred.lag.v, pred.lag.u, settings) - new Date(0) : 0;
      switch (pred.type) {
        case 'ss':
          es = new Date(Math.max(es, addWork(p.ES || project.startDate, pred.lag.v, pred.lag.u, settings)));
          break;
        case 'ff':
          const ef = addWork(p.EF || p.finish, pred.lag.v, pred.lag.u, settings);
          es = new Date(Math.max(es, addWork(ef, -t.duration.v, t.duration.u, settings)));
          break;
        case 'sf':
          const ef2 = addWork(p.ES || project.startDate, pred.lag.v, pred.lag.u, settings);
          es = new Date(Math.max(es, addWork(ef2, -t.duration.v, t.duration.u, settings)));
          break;
        case 'fs':
        default:
          const efp = addWork(p.EF || p.finish, pred.lag.v, pred.lag.u, settings);
          es = new Date(Math.max(es, efp));
      }
    }
    if (t.constraint && t.constraint.type === 'SNET' && t.constraint.date)
      es = new Date(Math.max(es, t.constraint.date));
    if (t.constraint && t.constraint.type === 'MSO' && t.constraint.date)
      es = new Date(t.constraint.date);
    let ef = addWork(es, t.duration.v, t.duration.u, settings);
    if (t.constraint && t.constraint.type === 'FNLT' && t.constraint.date)
      ef = new Date(Math.min(ef, t.constraint.date));
    if (t.constraint && t.constraint.type === 'MFO' && t.constraint.date)
      ef = new Date(t.constraint.date);
    t.ES = es;
    t.EF = ef;
    if (t.mode === 'manual') {
      if (t.start) t.ES = t.start;
      if (t.finish) t.EF = t.finish;
    }
  }

  // Summary roll-up
  for (const t of tasks) {
    if (t.isSummary) {
      const children = tasks.filter(ch => ch.level === t.level + 1 && ch.wbs.startsWith(t.wbs + '.'));
      if (children.length) {
        t.start = new Date(Math.min(...children.map(c => c.ES)));
        t.finish = new Date(Math.max(...children.map(c => c.EF)));
        t.duration = parseDuration(diffWork(t.start, t.finish, 'd', settings) + 'd');
      }
    }
  }

  const projectFinish = new Date(Math.max(...tasks.filter(t => !t.isSummary).map(t => t.EF)));

  // Backward pass
  const successors = new Map();
  for (const t of tasks) {
    for (const p of t.predecessors || []) {
      if (!successors.has(p.id)) successors.set(p.id, []);
      successors.get(p.id).push({ task: t, type: p.type, lag: p.lag });
    }
  }

  const rev = [...order].reverse();
  for (const t of rev) {
    if (t.isSummary) continue;
    let lf = projectFinish;
    const succs = successors.get(t.id) || [];
    for (const s of succs) {
      const lagDate = addWork(s.task.ES, -s.lag.v, s.lag.u, settings);
      switch (s.type) {
        case 'ss':
          lf = new Date(Math.min(lf, addWork(lagDate, t.duration.v, t.duration.u, settings)));
          break;
        case 'ff':
          lf = new Date(Math.min(lf, addWork(s.task.LF || projectFinish, -s.lag.v, s.lag.u, settings)));
          break;
        case 'sf':
          lf = new Date(Math.min(lf, s.task.LF));
          break;
        case 'fs':
        default:
          lf = new Date(Math.min(lf, lagDate));
      }
    }
    if (t.constraint && t.constraint.type === 'ALAP' && t.constraint.date)
      lf = new Date(Math.min(lf, t.constraint.date));
    if (t.constraint && t.constraint.type === 'MFO' && t.constraint.date)
      lf = new Date(t.constraint.date);
    t.LF = lf;
    t.LS = addWork(lf, -t.duration.v, t.duration.u, settings);
    if (t.constraint && t.constraint.type === 'MSO' && t.constraint.date)
      t.LS = new Date(t.constraint.date);
    t.TF = diffWork(t.ES, t.LS, 'd', settings);
    t.critical = t.TF === 0;
  }

  return tasks;
}

export function captureBaseline(tasks = project.tasks) {
  project.baseline0 = tasks.map(t => ({ id: t.id, start: t.ES, finish: t.EF }));
}

export function progressLine(date = new Date(), tasks = project.tasks) {
  project.statusDate = date;
  return tasks.map(t => ({ id: t.id, progress: t.percentComplete, start: t.ES, finish: t.EF }));
}
