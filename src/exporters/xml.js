import { addWork, diffWork } from '../calendar.js';

const TYPE_MAP = { fs: 1, ss: 2, ff: 3, sf: 4 };

export function exportXML(tasks) {
  const taskXml = tasks
    .map(t => {
      const preds = (t.predecessors || [])
        .map(p => {
          const lagMins = diffWork(new Date(0), addWork(new Date(0), p.lag.v, p.lag.u), 'h') * 60;
          return `<PredecessorLink><PredecessorUID>${p.id}</PredecessorUID><Type>${TYPE_MAP[p.type]}</Type><LinkLag>${lagMins}</LinkLag></PredecessorLink>`;
        })
        .join('');
      const durMins = diffWork(t.ES, t.EF, 'h') * 60;
      return `<Task><Id>${t.id}</Id><Name>${t.name}</Name><Duration>PT${durMins}M</Duration><Start>${t.ES.toISOString()}</Start><Finish>${t.EF.toISOString()}</Finish>${preds}</Task>`;
    })
    .join('');
  return `<Project><Tasks>${taskXml}</Tasks></Project>`;
}
