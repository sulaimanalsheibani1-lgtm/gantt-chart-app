// PDF export stub. A real implementation would use a small PDF library
// such as pdf-lib or jsPDF. Here we simply return a Blob containing plain
// text to keep the dependency surface minimal.

export async function exportPDF(tasks) {
  const content = tasks.map(t => `${t.id} ${t.name}`).join('\n');
  return new Blob([content], { type: 'application/pdf' });
}
