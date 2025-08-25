// Export visible grid columns to CSV. For now we implement a simple
// serialiser that outputs a header row followed by task fields.

export function exportCSV(tasks) {
  const header = ['id', 'wbs', 'name', 'duration', 'start', 'finish'].join(',');
  const rows = tasks.map(t => [
    t.id,
    t.wbs || '',
    t.name,
    `${t.duration.v}${t.duration.u}`,
    t.ES?.toISOString() || '',
    t.EF?.toISOString() || ''
  ].join(','));
  return [header, ...rows].join('\n');
}
