// Minimal Gantt chart renderer. The full application would draw a
// multi-tier timescale with non-working shading and connectors. This stub
// renders simple progress bars to exercise the scheduling engine.

export function renderGantt(container, tasks) {
  container.innerHTML = '';
  const start = Math.min(...tasks.map(t => t.ES?.getTime() || Date.now()));
  const end = Math.max(...tasks.map(t => t.EF?.getTime() || Date.now()));
  const total = end - start || 1;
  tasks.forEach(t => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const left = ((t.ES?.getTime() || 0) - start) / total * 100;
    const width = ((t.EF?.getTime() || 0) - (t.ES?.getTime() || 0)) / total * 100;
    bar.style.left = left + '%';
    bar.style.width = width + '%';
    if (t.critical) bar.style.background = 'red';
    container.appendChild(bar);
  });
}
