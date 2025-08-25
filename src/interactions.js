// Keyboard shortcut and context menu stubs. These provide basic hooks for
// accessibility testing. Full implementations would manipulate the project
// state and update the UI accordingly.

export function initInteractions() {
  document.addEventListener('keydown', e => {
    if (e.key === 'n') console.log('Add task');
    if (e.key === 'Delete') console.log('Delete task');
  });

  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    console.log('Context menu at', e.clientX, e.clientY);
  });
}
