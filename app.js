// Project data structure
let project = {
    name: 'New Project',
    startDate: new Date(),
    description: '',
    tasks: [],
    nextId: 1,
    settings: {
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        workingHours: 8,
        dateFormat: 'MM/dd/yyyy'
    }
};

let selectedTaskId = null;
let zoomLevel = 30; // pixels per day
let showCriticalPath = true;
let draggedTask = null;
let taskInfoTaskId = null;

// History stacks for undo/redo
let undoStack = [];
let redoStack = [];

function saveState() {
    undoStack.push(JSON.stringify(project));
    if (undoStack.length > 100) {
        undoStack.shift();
    }
    redoStack.length = 0;
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(project));
    project = JSON.parse(undoStack.pop());
    calculateSchedule();
    renderProject();
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(project));
    project = JSON.parse(redoStack.pop());
    calculateSchedule();
    renderProject();
}

// Initialize the application
function init() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('projectStartDate').value = today;
    setupEventListeners();
    createSampleProject();
    renderProject();
    saveState();
}

function setupEventListeners() {
    // Panel resizer
    const resizer = document.getElementById('panelResizer');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    });

    function handleResize(e) {
        if (!isResizing) return;
        const container = document.querySelector('.main-container');
        const rect = container.getBoundingClientRect();
        const newWidth = Math.max(300, Math.min(800, e.clientX - rect.left));
        document.querySelector('.task-panel').style.width = newWidth + 'px';
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    }

    // Context menu
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.task-row')) {
            e.preventDefault();
            showContextMenu(e.pageX, e.pageY);
        }
    });

    document.addEventListener('click', () => {
        hideContextMenu();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    saveProject();
                    break;
                case 'o':
                    e.preventDefault();
                    loadProject();
                    break;
                case 'n':
                    e.preventDefault();
                    showNewProjectModal();
                    break;
                case 'z':
                    e.preventDefault();
                    undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
            }
        }
        
        if (selectedTaskId) {
            switch (e.key) {
                case 'Delete':
                    deleteTask();
                    break;
                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) {
                        outdentTask();
                    } else {
                        indentTask();
                    }
                    break;
                case 'ArrowUp':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        moveTaskUp();
                    }
                    break;
                case 'ArrowDown':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        moveTaskDown();
                    }
                    break;
            }
        }
    });

    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        const toolbar = document.querySelector('.toolbar');
        const headerActions = document.querySelector('.header-actions');
        menuToggle.addEventListener('click', () => {
            toolbar.classList.toggle('open');
            if (headerActions) {
                headerActions.classList.toggle('open');
            }
        });
    }
}

function createSampleProject() {
    project = {
        name: 'Sample Software Development Project',
        startDate: new Date(),
        description: 'A comprehensive software development project with all phases',
        tasks: [
            { id: 1, wbs: '1.0', name: 'Project Planning', duration: 5, start: null, finish: null, predecessor: '', level: 0, isSummary: true, expanded: true, progress: 0 },
            { id: 2, wbs: '1.1', name: 'Requirements Gathering', duration: 3, start: null, finish: null, predecessor: '', level: 1, isSummary: false, expanded: true, progress: 100 },
            { id: 3, wbs: '1.2', name: 'System Design', duration: 2, start: null, finish: null, predecessor: '2', level: 1, isSummary: false, expanded: true, progress: 80 },
            
            { id: 4, wbs: '2.0', name: 'Development Phase', duration: 15, start: null, finish: null, predecessor: '', level: 0, isSummary: true, expanded: true, progress: 0 },
            { id: 5, wbs: '2.1', name: 'Frontend Development', duration: 8, start: null, finish: null, predecessor: '3', level: 1, isSummary: true, expanded: true, progress: 0 },
            { id: 6, wbs: '2.1.1', name: 'UI Components', duration: 4, start: null, finish: null, predecessor: '', level: 2, isSummary: false, expanded: true, progress: 60 },
            { id: 7, wbs: '2.1.2', name: 'User Interface Design', duration: 4, start: null, finish: null, predecessor: '6', level: 2, isSummary: false, expanded: true, progress: 30 },
            { id: 8, wbs: '2.2', name: 'Backend Development', duration: 7, start: null, finish: null, predecessor: '3', level: 1, isSummary: true, expanded: true, progress: 0 },
            { id: 9, wbs: '2.2.1', name: 'Database Setup', duration: 2, start: null, finish: null, predecessor: '', level: 2, isSummary: false, expanded: true, progress: 100 },
            { id: 10, wbs: '2.2.2', name: 'API Development', duration: 5, start: null, finish: null, predecessor: '9', level: 2, isSummary: false, expanded: true, progress: 40 },
            
            { id: 11, wbs: '3.0', name: 'Testing Phase', duration: 6, start: null, finish: null, predecessor: '5,8', level: 0, isSummary: true, expanded: true, progress: 0 },
            { id: 12, wbs: '3.1', name: 'Unit Testing', duration: 3, start: null, finish: null, predecessor: '', level: 1, isSummary: false, expanded: true, progress: 20 },
            { id: 13, wbs: '3.2', name: 'Integration Testing', duration: 2, start: null, finish: null, predecessor: '12', level: 1, isSummary: false, expanded: true, progress: 0 },
            { id: 14, wbs: '3.3', name: 'User Acceptance Testing', duration: 3, start: null, finish: null, predecessor: '13', level: 1, isSummary: false, expanded: true, progress: 0 },
            
            { id: 15, wbs: '4.0', name: 'Deployment', duration: 3, start: null, finish: null, predecessor: '11', level: 0, isSummary: false, expanded: true, progress: 0 },
            { id: 16, wbs: '5.0', name: 'Project Complete', duration: 0, start: null, finish: null, predecessor: '15', level: 0, isSummary: false, expanded: true, progress: 0 }
        ],
        nextId: 17,
        settings: {
            workingDays: [1, 2, 3, 4, 5], // Monday to Friday
            workingHours: 8,
            dateFormat: 'MM/dd/yyyy'
        }
    };
    project.tasks.forEach(t => t.notes = t.notes || '');
    updateWBS();
    calculateSchedule();
}

// Get visible tasks (respecting collapsed state)
function getVisibleTasks() {
    const visible = [];
    const expandedStack = [];
    
    for (const task of project.tasks) {
        let isVisible = true;
        
        // Check if any parent is collapsed
        for (let i = 0; i < task.level; i++) {
            if (expandedStack[i] && !expandedStack[i].expanded) {
                isVisible = false;
                break;
            }
        }
        
        if (isVisible) {
            visible.push(task);
        }
        
        // Update expanded stack
        if (task.isSummary) {
            expandedStack[task.level] = task;
            // Clear deeper levels
            for (let i = task.level + 1; i < expandedStack.length; i++) {
                expandedStack[i] = null;
            }
        }
    }
    
    return visible;
}

// Calculate project schedule using forward pass algorithm
function calculateSchedule() {
    // Reset all calculated dates
    project.tasks.forEach(task => {
        if (!task.isSummary) {
            task.start = null;
            task.finish = null;
        }
    });

    // Forward pass - calculate early start and finish dates
    let changed = true;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        for (const task of project.tasks) {
            if (!task.isSummary) {
                let duration = Math.max(0, parseInt(task.duration) || 0);
                task.duration = duration;

                if (!task.predecessor || task.predecessor.trim() === '') {
                    // No predecessors - start at project start date
                    if (!task.start) {
                        task.start = new Date(project.startDate);
                        task.finish = duration === 0 ? new Date(task.start) : addWorkDays(task.start, duration - 1);
                        changed = true;
                    }
                } else {
                    // Has predecessors - find latest finish date
                    const predIds = task.predecessor.split(',').map(p => p.trim()).filter(Boolean);
                    let maxFinish = null;
                    let allPredsScheduled = true;

                    for (const predId of predIds) {
                        const pred = project.tasks.find(t => t.id == predId);
                        if (pred && pred.finish) {
                            if (!maxFinish || pred.finish > maxFinish) {
                                maxFinish = new Date(pred.finish);
                            }
                        } else {
                            allPredsScheduled = false;
                            break;
                        }
                    }

                    if (allPredsScheduled && maxFinish && !task.start) {
                        task.start = addWorkDays(maxFinish, 1);
                        task.finish = duration === 0 ? new Date(task.start) : addWorkDays(task.start, duration - 1);
                        changed = true;
                    }
                }
            }
        }
    }

    updateSummaryTasks();
    calculateCriticalPath();
}

// Update summary task dates based on children
function updateSummaryTasks() {
    // Process from deepest level to top level
    for (let level = 3; level >= 0; level--) {
        for (const task of project.tasks) {
            if (task.isSummary && task.level === level) {
                const children = getChildTasks(task);
                if (children.length > 0) {
                    let minStart = null;
                    let maxFinish = null;
                    let totalProgress = 0;
                    let totalDuration = 0;

                    for (const child of children) {
                        if (child.start && (!minStart || child.start < minStart)) {
                            minStart = new Date(child.start);
                        }
                        if (child.finish && (!maxFinish || child.finish > maxFinish)) {
                            maxFinish = new Date(child.finish);
                        }
                        
                        // Calculate weighted progress
                        const childDuration = child.duration || 0;
                        totalProgress += (child.progress || 0) * childDuration;
                        totalDuration += childDuration;
                    }

                    task.start = minStart;
                    task.finish = maxFinish;
                    if (minStart && maxFinish) {
                        task.duration = getWorkDays(minStart, maxFinish) + 1;
                    }
                    
                    // Calculate weighted average progress
                    task.progress = totalDuration > 0 ? Math.round(totalProgress / totalDuration) : 0;
                }
            }
        }
    }
}

// Get direct children of a summary task
function getChildTasks(summaryTask) {
    const children = [];
    const summaryIndex = project.tasks.indexOf(summaryTask);
    
    for (let i = summaryIndex + 1; i < project.tasks.length; i++) {
        const task = project.tasks[i];
        if (task.level <= summaryTask.level) {
            break; // We've moved past this summary's children
        }
        if (task.level === summaryTask.level + 1) {
            children.push(task);
        }
    }
    
    return children;
}

// Calculate critical path using backward pass
function calculateCriticalPath() {
    // Reset critical path flags
    project.tasks.forEach(task => { 
        task.isCritical = false; 
        task.slack = 0;
    });

    // Find project end date
    let projectEnd = null;
    project.tasks.forEach(task => {
        if (task.finish && (!projectEnd || task.finish > projectEnd)) {
            projectEnd = new Date(task.finish);
        }
    });

    if (!projectEnd) return;

    // Initialize late finish dates
    project.tasks.forEach(task => {
        task.lateFinish = null;
        task.lateStart = null;
    });

    // Backward pass - calculate late start and finish dates
    const endTasks = project.tasks.filter(task => 
        !task.isSummary && task.finish && 
        Math.abs(task.finish.getTime() - projectEnd.getTime()) < 24 * 60 * 60 * 1000
    );

    // Set late finish for end tasks
    endTasks.forEach(task => {
        task.lateFinish = new Date(projectEnd);
        task.lateStart = task.duration === 0 ? 
            new Date(task.lateFinish) : 
            subtractWorkDays(task.lateFinish, task.duration - 1);
    });

    // Backward pass for remaining tasks
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 100) {
        changed = false;
        iterations++;

        for (const task of project.tasks) {
            if (!task.isSummary && !task.lateFinish) {
                // Find all successors
                const successors = project.tasks.filter(t => 
                    t.predecessor && t.predecessor.split(',').map(p => p.trim()).includes(String(task.id))
                );

                if (successors.length > 0) {
                    let minLateStart = null;
                    let allSuccessorsScheduled = true;

                    for (const successor of successors) {
                        if (successor.lateStart) {
                            if (!minLateStart || successor.lateStart < minLateStart) {
                                minLateStart = new Date(successor.lateStart);
                            }
                        } else {
                            allSuccessorsScheduled = false;
                            break;
                        }
                    }

                    if (allSuccessorsScheduled && minLateStart) {
                        task.lateFinish = subtractWorkDays(minLateStart, 1);
                        task.lateStart = task.duration === 0 ? 
                            new Date(task.lateFinish) : 
                            subtractWorkDays(task.lateFinish, task.duration - 1);
                        changed = true;
                    }
                }
            }
        }
    }

    // Calculate slack and identify critical path
    project.tasks.forEach(task => {
        if (!task.isSummary && task.start && task.lateStart) {
            task.slack = getWorkDays(task.start, task.lateStart);
            task.isCritical = task.slack === 0;
        }
    });
}

// Add work days to a date (excluding weekends and holidays)
function addWorkDays(startDate, days) {
    let date = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < days) {
        date.setDate(date.getDate() + 1);
        if (isWorkingDay(date)) {
            daysAdded++;
        }
    }
    
    return date;
}

// Subtract work days from a date
function subtractWorkDays(endDate, days) {
    let date = new Date(endDate);
    let daysSubtracted = 0;
    
    while (daysSubtracted < days) {
        date.setDate(date.getDate() - 1);
        if (isWorkingDay(date)) {
            daysSubtracted++;
        }
    }
    
    return date;
}

// Check if a date is a working day
function isWorkingDay(date) {
    const dayOfWeek = date.getDay();
    return project.settings.workingDays.includes(dayOfWeek);
}

// Get number of work days between two dates
function getWorkDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    let count = 0;
    let date = new Date(startDate);
    const end = new Date(endDate);
    
    while (date <= end) {
        if (isWorkingDay(date)) {
            count++;
        }
        date.setDate(date.getDate() + 1);
    }
    
    return count;
}

// Render the entire project
function renderProject() {
    renderTaskList();
    renderGanttChart();
    updateStatusBar();
}

// Render the task list panel
function renderTaskList() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    const visibleTasks = getVisibleTasks();
    
    visibleTasks.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'task-row';
        if (task.isSummary) row.className += ' summary';
        if (task.id === selectedTaskId) row.className += ' selected';
        if (task.isCritical && showCriticalPath) row.style.borderLeft = '3px solid var(--critical-path)';
        
        row.onclick = () => selectTask(task.id);
        row.ondblclick = () => editTask(task.id);

        // ID Cell
        const idCell = document.createElement('div');
        idCell.className = 'task-id';
        idCell.textContent = task.id;
        row.appendChild(idCell);

        // WBS Cell
        const wbsCell = document.createElement('div');
        wbsCell.className = 'task-wbs';
        wbsCell.textContent = task.wbs;
        row.appendChild(wbsCell);

        // Name Cell
        const nameCell = document.createElement('div');
        nameCell.className = 'task-name';
        
        // Add indentation
        for (let i = 0; i < task.level; i++) {
            const spacer = document.createElement('span');
            spacer.className = 'indent-spacer';
            nameCell.appendChild(spacer);
        }
        
        // Add expand/collapse icon for summary tasks
        if (task.isSummary) {
            const expandIcon = document.createElement('span');
            expandIcon.innerHTML = task.expanded ? '▼' : '▶';
            expandIcon.className = 'expand-icon';
            expandIcon.onclick = (e) => {
                e.stopPropagation();
                toggleTask(task.id);
            };
            nameCell.appendChild(expandIcon);
        }
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = task.name;
        nameInput.onchange = (e) => updateTaskField(task.id, 'name', e.target.value);
        nameInput.onclick = (e) => e.stopPropagation();
        nameCell.appendChild(nameInput);
        row.appendChild(nameCell);

        // Duration Cell
        const durationCell = document.createElement('div');
        durationCell.className = 'task-duration';
        if (!task.isSummary) {
            const durationInput = document.createElement('input');
            durationInput.type = 'number';
            durationInput.min = 0;
            durationInput.value = task.duration;
            durationInput.onchange = (e) => {
                let val = Math.max(0, parseInt(e.target.value) || 0);
                updateTaskField(task.id, 'duration', val);
            };
            durationInput.onclick = (e) => e.stopPropagation();
            durationCell.appendChild(durationInput);
        } else {
            const durationText = document.createElement('span');
            durationText.textContent = task.duration ? task.duration + 'd' : '';
            durationCell.appendChild(durationText);
        }
        row.appendChild(durationCell);

        // Start Date Cell
        const startCell = document.createElement('div');
        startCell.className = 'task-start';
        const startInput = document.createElement('input');
        startInput.type = 'text';
        startInput.value = task.start ? formatDate(task.start) : '';
        startInput.readOnly = true;
        startCell.appendChild(startInput);
        row.appendChild(startCell);

        // Finish Date Cell
        const finishCell = document.createElement('div');
        finishCell.className = 'task-finish';
        const finishInput = document.createElement('input');
        finishInput.type = 'text';
        finishInput.value = task.finish ? formatDate(task.finish) : '';
        finishInput.readOnly = true;
        finishCell.appendChild(finishInput);
        row.appendChild(finishCell);

        // Predecessor Cell
        const predCell = document.createElement('div');
        predCell.className = 'task-predecessor';
        if (!task.isSummary) {
            const predInput = document.createElement('input');
            predInput.type = 'text';
            predInput.value = task.predecessor || '';
            predInput.placeholder = 'e.g., 1,2';
            predInput.onchange = (e) => updateTaskField(task.id, 'predecessor', e.target.value);
            predInput.onclick = (e) => e.stopPropagation();
            predCell.appendChild(predInput);
        }
        row.appendChild(predCell);

        taskList.appendChild(row);
    });
}

// Render the Gantt chart
function renderGanttChart() {
    renderGanttHeader();
    renderGanttGrid();
    renderGanttBars();
    renderGanttLinks();
}

// Render Gantt chart header with months and days
function renderGanttHeader() {
    const header = document.getElementById('ganttHeader');
    header.innerHTML = '';

    // Calculate date range
    let minDate = new Date(project.startDate);
    let maxDate = new Date(project.startDate);
    
    project.tasks.forEach(task => {
        if (task.finish && task.finish > maxDate) {
            maxDate = new Date(task.finish);
        }
    });
    
    // Add buffer days
    maxDate = addWorkDays(maxDate, 14);

    // Create month header
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    
    // Create day header
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    let currentDate = new Date(minDate);
    let currentMonth = -1;
    let currentYear = -1;
    let monthWidth = 0;

    while (currentDate <= maxDate) {
        // Day cell
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        if (!isWorkingDay(currentDate)) {
            dayCell.className += ' weekend';
        }
        dayCell.textContent = currentDate.getDate();
        dayCell.style.width = zoomLevel + 'px';
        dayCell.title = formatDate(currentDate);
        dayHeader.appendChild(dayCell);

        // Month cell (when month changes)
        if (currentDate.getMonth() !== currentMonth || currentDate.getFullYear() !== currentYear) {
            if (currentMonth !== -1) {
                const monthCell = document.createElement('div');
                monthCell.className = 'month-cell';
                monthCell.textContent = getMonthName(currentMonth) + ' ' + currentYear;
                monthCell.style.width = monthWidth + 'px';
                monthHeader.appendChild(monthCell);
            }
            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();
            monthWidth = 0;
        }

        monthWidth += zoomLevel;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add final month cell
    if (monthWidth > 0) {
        const monthCell = document.createElement('div');
        monthCell.className = 'month-cell';
        monthCell.textContent = getMonthName(currentMonth) + ' ' + currentYear;
        monthCell.style.width = monthWidth + 'px';
        monthHeader.appendChild(monthCell);
    }

    header.appendChild(monthHeader);
    header.appendChild(dayHeader);
}

// Render Gantt grid background
function renderGanttGrid() {
    const grid = document.getElementById('ganttGrid');
    grid.innerHTML = '';

    let minDate = new Date(project.startDate);
    let maxDate = new Date(project.startDate);
    
    project.tasks.forEach(task => {
        if (task.finish && task.finish > maxDate) {
            maxDate = new Date(task.finish);
        }
    });
    
    maxDate = addWorkDays(maxDate, 14);

    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
        const column = document.createElement('div');
        column.className = 'grid-column';
        if (!isWorkingDay(currentDate)) {
            column.className += ' weekend';
        }
        column.style.width = zoomLevel + 'px';
        grid.appendChild(column);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// Render Gantt bars
function renderGanttBars() {
    const rows = document.getElementById('ganttRows');
    rows.innerHTML = '';
    
    const visibleTasks = getVisibleTasks();
    
    visibleTasks.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'gantt-row';
        if (task.isSummary) row.className += ' summary';

        if (task.start && task.finish) {
            const bar = document.createElement('div');
            bar.className = 'gantt-bar';
            
            // Determine bar type and styling
            if (task.isSummary) {
                bar.className += ' summary';
            } else if (task.duration === 0) {
                bar.className += ' milestone';
            } else if (task.isCritical && showCriticalPath) {
                bar.className += ' critical';
            } else {
                bar.className += ' normal';
            }

            // Calculate position and width
            const startOffset = getDaysDiff(project.startDate, task.start) * zoomLevel;
            const width = task.duration === 0 ? 16 : (getDaysDiff(task.start, task.finish) + 1) * zoomLevel;
            
            bar.style.left = startOffset + 'px';
            bar.style.width = width + 'px';
            
            // Add task name and progress
            if (task.duration > 0 && !task.isSummary) {
                const maxChars = Math.floor(width / 8);
                bar.textContent = task.name.substring(0, maxChars);
                
                // Add progress indicator
                if (task.progress > 0) {
                    const progressBar = document.createElement('div');
                    progressBar.className = 'progress-bar';
                    progressBar.style.position = 'absolute';
                    progressBar.style.bottom = '2px';
                    progressBar.style.left = '2px';
                    progressBar.style.right = '2px';
                    progressBar.style.height = '2px';
                    progressBar.style.background = 'rgba(255,255,255,0.3)';
                    
                    const progressFill = document.createElement('div');
                    progressFill.className = 'progress-fill';
                    progressFill.style.width = task.progress + '%';
                    progressFill.style.background = '#fff';
                    progressBar.appendChild(progressFill);
                    bar.appendChild(progressBar);
                }
            }
            
            // Add tooltip
            bar.title = `${task.name}\nDuration: ${task.duration} days\nStart: ${formatDate(task.start)}\nFinish: ${formatDate(task.finish)}\nProgress: ${task.progress || 0}%${task.slack !== undefined ? '\nSlack: ' + task.slack + ' days' : ''}`;
            
            // Add click handler
            bar.onclick = (e) => {
                e.stopPropagation();
                selectTask(task.id);
            };

            row.appendChild(bar);
        }

        rows.appendChild(row);
    });
}

// Render dependency links
function renderGanttLinks() {
    const svg = document.getElementById('ganttLinks');
    svg.innerHTML = '';
    
    const visibleTasks = getVisibleTasks();
    
    visibleTasks.forEach((task, taskIndex) => {
        if (task.predecessor && task.start) {
            const predIds = task.predecessor.split(',').map(p => p.trim()).filter(Boolean);
            
            predIds.forEach(predId => {
                const pred = project.tasks.find(t => t.id == predId);
                if (pred && pred.finish) {
                    const predIndex = visibleTasks.findIndex(t => t.id === pred.id);
                    if (predIndex === -1) return;

                    // Calculate positions
                    const x1 = getDaysDiff(project.startDate, pred.finish) * zoomLevel + zoomLevel;
                    const y1 = predIndex * 37 + 18;
                    const x2 = getDaysDiff(project.startDate, task.start) * zoomLevel;
                    const y2 = taskIndex * 37 + 18;

                    // Create link path
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const midX = x1 + (x2 - x1) / 2;
                    const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                    path.setAttribute('d', d);

                    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    g.className.baseVal = 'gantt-link';
                    if (task.isCritical && pred.isCritical && showCriticalPath) {
                        g.className.baseVal += ' critical';
                    }

                    g.appendChild(path);

                    // Add arrow
                    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    arrow.setAttribute('points', `${x2},${y2} ${x2-6},${y2-3} ${x2-6},${y2+3}`);
                    arrow.setAttribute('fill', (task.isCritical && pred.isCritical && showCriticalPath) ? 'var(--critical-path)' : 'var(--text-secondary)');
                    g.appendChild(arrow);

                    svg.appendChild(g);
                }
            });
        }
    });
}

// Update status bar information
function updateStatusBar() {
    const taskCount = project.tasks.length;
    const completedTasks = project.tasks.filter(t => !t.isSummary && (t.progress || 0) === 100).length;
    const workTasks = project.tasks.filter(t => !t.isSummary).length;
    
    document.getElementById('taskCount').textContent = taskCount;
    
    // Calculate project duration
    if (project.tasks.length > 0) {
        let projectStart = new Date(project.startDate);
        let projectEnd = null;
        
        project.tasks.forEach(task => {
            if (task.finish && (!projectEnd || task.finish > projectEnd)) {
                projectEnd = new Date(task.finish);
            }
        });
        
        if (projectEnd) {
            const duration = getWorkDays(projectStart, projectEnd) + 1;
            document.getElementById('projectDuration').textContent = duration + ' days';
            document.getElementById('projectDates').textContent = 
                `Start: ${formatDate(projectStart)} | End: ${formatDate(projectEnd)}`;
        } else {
            document.getElementById('projectDuration').textContent = '0 days';
            document.getElementById('projectDates').textContent = 'Start: -- | End: --';
        }
    }
    
    // Calculate overall progress
    const overallProgress = workTasks > 0 ? Math.round((completedTasks / workTasks) * 100) : 0;
    document.getElementById('projectProgress').textContent = overallProgress + '%';
}

// Task selection
function selectTask(taskId) {
    selectedTaskId = taskId;
    renderTaskList();
}

// Toggle task expansion
function toggleTask(taskId) {
    const task = project.tasks.find(t => t.id === taskId);
    if (task && task.isSummary) {
        task.expanded = !task.expanded;
        renderProject();
    }
}

// Update task field
function updateTaskField(taskId, field, value) {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Validation
    if (field === 'duration') {
        value = Math.max(0, parseInt(value) || 0);
    }
    
    if (field === 'predecessor') {
        const predIds = value.split(',').map(p => p.trim()).filter(Boolean);
        
        // Validate predecessor IDs
        for (const predId of predIds) {
            const predIdNum = parseInt(predId);
            if (isNaN(predIdNum)) {
                showError('Invalid predecessor ID: ' + predId);
                return;
            }
            if (predIdNum === task.id) {
                showError('Task cannot be predecessor of itself');
                return;
            }
            if (!project.tasks.find(t => t.id === predIdNum)) {
                showError('Predecessor task not found: ' + predId);
                return;
            }
            
            // Check for circular dependencies
            if (wouldCreateCircularDependency(task.id, predIdNum)) {
                showError('Circular dependency detected');
                return;
            }
        }
    }

    if (field === 'progress') {
        value = Math.max(0, Math.min(100, parseInt(value) || 0));
    }

    // Update field with history
    if (task[field] !== value) {
        saveState();
        task[field] = value;
    } else {
        return;
    }
    
    // Recalculate and re-render
    if (field === 'duration' || field === 'predecessor') {
        calculateSchedule();
    }
    renderProject();
}

// Check for circular dependencies
function wouldCreateCircularDependency(taskId, newPredId) {
    const visited = new Set();
    
    function checkPath(currentId) {
        if (currentId === newPredId) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);
        
        const successors = project.tasks.filter(t => 
            t.predecessor && t.predecessor.split(',').map(p => p.trim()).includes(String(currentId))
        );
        
        return successors.some(successor => checkPath(successor.id));
    }
    
    return checkPath(taskId);
}

// Add new task
function addTask() {
    let insertLevel = 0;
    let insertIndex = project.tasks.length;

    if (selectedTaskId) {
        const selectedTask = project.tasks.find(t => t.id === selectedTaskId);
        if (selectedTask) {
            insertLevel = selectedTask.level;
            insertIndex = project.tasks.findIndex(t => t.id === selectedTaskId) + 1;
        }
    }
    saveState();

    const newTask = {
        id: project.nextId++,
        wbs: '',
        name: 'New Task',
        duration: 1,
        start: null,
        finish: null,
        predecessor: '',
        level: insertLevel,
        isSummary: false,
        expanded: true,
        progress: 0,
        notes: ''
    };

    project.tasks.splice(insertIndex, 0, newTask);
    selectedTaskId = newTask.id;
    updateWBS();
    calculateSchedule();
    renderProject();
}

// Add subtask to selected task
function addSubtask() {
    if (!selectedTaskId) {
        addTask();
        return;
    }

    const selectedTask = project.tasks.find(t => t.id === selectedTaskId);
    if (!selectedTask) return;

    saveState();

    // Convert to summary task if not already
    if (!selectedTask.isSummary) {
        selectedTask.isSummary = true;
        selectedTask.expanded = true;
    }

    const insertIndex = project.tasks.findIndex(t => t.id === selectedTaskId) + 1;
    const newTask = {
        id: project.nextId++,
        wbs: '',
        name: 'New Subtask',
        duration: 1,
        start: null,
        finish: null,
        predecessor: '',
        level: selectedTask.level + 1,
        isSummary: false,
        expanded: true,
        progress: 0
    };

    project.tasks.splice(insertIndex, 0, newTask);
    selectedTaskId = newTask.id;
    updateWBS();
    calculateSchedule();
    renderProject();
}

// Delete selected task
function deleteTask() {
    if (!selectedTaskId) return;

    saveState();

    const taskIndex = project.tasks.findIndex(t => t.id === selectedTaskId);
    if (taskIndex === -1) return;

    const task = project.tasks[taskIndex];
    
    // If it's a summary task, delete all children
    if (task.isSummary) {
        const children = getAllChildTasks(task);
        const allToDelete = [task, ...children];
        project.tasks = project.tasks.filter(t => !allToDelete.includes(t));
    } else {
        project.tasks.splice(taskIndex, 1);
    }

    // Remove references to deleted task(s) from predecessors
    const deletedIds = task.isSummary ? 
        [task.id, ...getAllChildTasks(task).map(c => c.id)] : 
        [task.id];
    
    project.tasks.forEach(t => {
        if (t.predecessor) {
            const predIds = t.predecessor.split(',').map(p => p.trim()).filter(Boolean);
            const filteredPreds = predIds.filter(predId => !deletedIds.includes(parseInt(predId)));
            t.predecessor = filteredPreds.join(',');
        }
    });

    selectedTaskId = null;
    updateWBS();
    calculateSchedule();
    renderProject();
}

// Get all child tasks (recursive)
function getAllChildTasks(summaryTask) {
    const children = [];
    const summaryIndex = project.tasks.indexOf(summaryTask);
    
    for (let i = summaryIndex + 1; i < project.tasks.length; i++) {
        const task = project.tasks[i];
        if (task.level <= summaryTask.level) {
            break;
        }
        children.push(task);
    }
    
    return children;
}

// Duplicate task
function duplicateTask() {
    if (!selectedTaskId) return;

    const task = project.tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const taskIndex = project.tasks.findIndex(t => t.id === selectedTaskId);
    saveState();
    const newTask = {
        ...task,
        id: project.nextId++,
        name: task.name + ' (Copy)',
        start: null,
        finish: null,
        wbs: ''
    };

    project.tasks.splice(taskIndex + 1, 0, newTask);
    selectedTaskId = newTask.id;
    updateWBS();
    calculateSchedule();
    renderProject();
}

// Indent task (increase level)
function indentTask() {
    if (!selectedTaskId) return;

    const taskIndex = project.tasks.findIndex(t => t.id === selectedTaskId);
    if (taskIndex <= 0) return;

    const task = project.tasks[taskIndex];
    const prevTask = project.tasks[taskIndex - 1];

    saveState();

    if (task.level < 3 && task.level <= prevTask.level) {
        task.level++;
        
        // Convert previous task to summary if needed
        if (task.level > prevTask.level && !prevTask.isSummary) {
            prevTask.isSummary = true;
            prevTask.expanded = true;
        }
        
        updateWBS();
        calculateSchedule();
        renderProject();
    }
}

// Outdent task (decrease level)
function outdentTask() {
    if (!selectedTaskId) return;

    const task = project.tasks.find(t => t.id === selectedTaskId);
    if (!task || task.level <= 0) return;

    saveState();

    task.level--;
    updateWBS();
    calculateSchedule();
    renderProject();
}

// Move task up
function moveTaskUp() {
    if (!selectedTaskId) return;

    const taskIndex = project.tasks.findIndex(t => t.id === selectedTaskId);
    if (taskIndex <= 0) return;

    const task = project.tasks[taskIndex];
    const prevTask = project.tasks[taskIndex - 1];

    // Only allow moving within same level or to valid positions
    if (task.level === prevTask.level ||
        (task.level > prevTask.level && prevTask.isSummary)) {

        saveState();

        project.tasks[taskIndex] = prevTask;
        project.tasks[taskIndex - 1] = task;

        updateWBS();
        calculateSchedule();
        renderProject();
    }
}

// Move task down
function moveTaskDown() {
    if (!selectedTaskId) return;

    const taskIndex = project.tasks.findIndex(t => t.id === selectedTaskId);
    if (taskIndex >= project.tasks.length - 1) return;

    const task = project.tasks[taskIndex];
    const nextTask = project.tasks[taskIndex + 1];
    
    // Only allow moving within same level
    if (task.level === nextTask.level) {
        saveState();
        project.tasks[taskIndex] = nextTask;
        project.tasks[taskIndex + 1] = task;

        updateWBS();
        calculateSchedule();
        renderProject();
    }
}

// Add milestone
function addMilestone() {
    saveState();

    const milestone = {
        id: project.nextId++,
        wbs: '',
        name: 'Milestone',
        duration: 0,
        start: null,
        finish: null,
        predecessor: selectedTaskId ? String(selectedTaskId) : '',
        level: selectedTaskId ? (project.tasks.find(t => t.id === selectedTaskId)?.level || 0) : 0,
        isSummary: false,
        expanded: true,
        progress: 0
    };

    const insertIndex = selectedTaskId ? 
        project.tasks.findIndex(t => t.id === selectedTaskId) + 1 : 
        project.tasks.length;
    
    project.tasks.splice(insertIndex, 0, milestone);
    selectedTaskId = milestone.id;
    updateWBS();
    calculateSchedule();
    renderProject();
}

// Update Work Breakdown Structure
function updateWBS() {
    let counters = [0, 0, 0, 0];
    
    project.tasks.forEach((task, index) => {
        // Increment counter for current level
        counters[task.level]++;
        
        // Reset deeper level counters
        for (let i = task.level + 1; i < counters.length; i++) {
            counters[i] = 0;
        }
        
        // Generate WBS code
        const wbsParts = [];
        for (let i = 0; i <= task.level; i++) {
            wbsParts.push(counters[i]);
        }
        task.wbs = wbsParts.join('.');
        
        // Determine if task should be summary
        const nextTask = project.tasks[index + 1];
        const hasChildren = nextTask && nextTask.level > task.level;
        
        if (hasChildren && !task.isSummary) {
            task.isSummary = true;
            task.expanded = true;
        } else if (!hasChildren && task.isSummary) {
            task.isSummary = false;
        }
    });
}

// Zoom functions
function zoomIn() {
    if (zoomLevel < 60) {
        zoomLevel += 5;
        document.querySelector('.zoom-slider').value = zoomLevel;
        renderGanttChart();
    }
}

function zoomOut() {
    if (zoomLevel > 15) {
        zoomLevel -= 5;
        document.querySelector('.zoom-slider').value = zoomLevel;
        renderGanttChart();
    }
}

function setZoom(value) {
    zoomLevel = parseInt(value);
    renderGanttChart();
}

// Toggle critical path display
function toggleCriticalPath() {
    showCriticalPath = !showCriticalPath;
    renderProject();
}

// Auto schedule (optimize task scheduling)
function autoSchedule() {
    saveState();

    // Reset all start dates and recalculate
    project.tasks.forEach(task => {
        if (!task.isSummary) {
            task.start = null;
            task.finish = null;
        }
    });

    calculateSchedule();
    renderProject();
    showMessage('Schedule optimized successfully', 'success');
}

// Modal functions
function showNewProjectModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('projectStartDate').value = today;
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectTemplate').value = '';
    clearErrors();
    document.getElementById('newProjectModal').classList.add('active');
}

function showProjectSettings() {
    // Populate current settings
    const settings = project.settings;
    document.getElementById('workMon').checked = settings.workingDays.includes(1);
    document.getElementById('workTue').checked = settings.workingDays.includes(2);
    document.getElementById('workWed').checked = settings.workingDays.includes(3);
    document.getElementById('workThu').checked = settings.workingDays.includes(4);
    document.getElementById('workFri').checked = settings.workingDays.includes(5);
    document.getElementById('workSat').checked = settings.workingDays.includes(6);
    document.getElementById('workSun').checked = settings.workingDays.includes(0);
    document.getElementById('workingHours').value = settings.workingHours;
    document.getElementById('dateFormat').value = settings.dateFormat;
    
    document.getElementById('projectSettingsModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'taskInfoModal') taskInfoTaskId = null;
}

function switchTaskInfoTab(tab) {
    const modal = document.getElementById('taskInfoModal');
    modal.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    modal.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `taskInfoTab-${tab}`);
    });
}

function openTaskInfo(taskId) {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;
    taskInfoTaskId = taskId;
    document.getElementById('taskInfoName').value = task.name;
    document.getElementById('taskInfoStart').value = task.start ? formatInputDate(task.start) : '';
    document.getElementById('taskInfoFinish').value = task.finish ? formatInputDate(task.finish) : '';
    document.getElementById('taskInfoDuration').value = task.duration;
    document.getElementById('taskInfoProgress').value = task.progress || 0;
    document.getElementById('taskInfoPredecessors').value = task.predecessor || '';
    document.getElementById('taskInfoNotes').value = task.notes || '';
    switchTaskInfoTab('general');
    document.getElementById('taskInfoModal').classList.add('active');
}

function saveTaskInfo() {
    if (!taskInfoTaskId) return;
    const task = project.tasks.find(t => t.id === taskInfoTaskId);
    if (!task) return;

    task.name = document.getElementById('taskInfoName').value.trim() || 'Task';
    const startVal = document.getElementById('taskInfoStart').value;
    task.start = startVal ? new Date(startVal) : null;
    const finishVal = document.getElementById('taskInfoFinish').value;
    task.finish = finishVal ? new Date(finishVal) : null;
    task.duration = parseInt(document.getElementById('taskInfoDuration').value) || 0;
    task.progress = Math.min(100, Math.max(0, parseInt(document.getElementById('taskInfoProgress').value) || 0));
    task.predecessor = document.getElementById('taskInfoPredecessors').value.trim();
    task.notes = document.getElementById('taskInfoNotes').value.trim();

    calculateSchedule();
    renderProject();
    closeModal('taskInfoModal');
    showMessage('Task updated successfully', 'success');
}

// Create new project
function createProject() {
    const name = document.getElementById('projectName').value.trim();
    const startDate = document.getElementById('projectStartDate').value;
    const description = document.getElementById('projectDescription').value.trim();
    const template = document.getElementById('projectTemplate').value;
    
    clearErrors();
    
    // Validation
    if (!name) {
        showError('Project name is required', 'projectNameError');
        return;
    }
    
    if (!startDate) {
        showError('Start date is required');
        return;
    }

    // Create new project
    project = {
        name: name,
        startDate: new Date(startDate),
        description: description,
        tasks: [],
        nextId: 1,
        settings: {
            workingDays: [1, 2, 3, 4, 5],
            workingHours: 8,
            dateFormat: 'MM/dd/yyyy'
        }
    };

    // Apply template
    if (template) {
        applyTemplate(template);
    }

    selectedTaskId = null;
    document.getElementById('projectTitle').textContent = name;
    renderProject();
    closeModal('newProjectModal');
    showMessage('Project created successfully', 'success');
}

// Apply project template
function applyTemplate(templateType) {
    const templates = {
        software: [
            { name: 'Planning Phase', duration: 5, level: 0, isSummary: true },
            { name: 'Requirements Analysis', duration: 3, level: 1, predecessor: '' },
            { name: 'System Architecture', duration: 2, level: 1, predecessor: '2' },
            { name: 'Development Phase', duration: 20, level: 0, isSummary: true },
            { name: 'Frontend Development', duration: 10, level: 1, predecessor: '3' },
            { name: 'Backend Development', duration: 12, level: 1, predecessor: '3' },
            { name: 'Database Implementation', duration: 5, level: 1, predecessor: '3' },
            { name: 'Testing Phase', duration: 8, level: 0, isSummary: true },
            { name: 'Unit Testing', duration: 4, level: 1, predecessor: '5,6,7' },
            { name: 'Integration Testing', duration: 3, level: 1, predecessor: '9' },
            { name: 'User Acceptance Testing', duration: 3, level: 1, predecessor: '10' },
            { name: 'Deployment', duration: 2, level: 0, predecessor: '8' },
            { name: 'Go Live', duration: 0, level: 0, predecessor: '12' }
        ],
        construction: [
            { name: 'Pre-Construction', duration: 10, level: 0, isSummary: true },
            { name: 'Site Survey', duration: 2, level: 1, predecessor: '' },
            { name: 'Permits & Approvals', duration: 8, level: 1, predecessor: '2' },
            { name: 'Foundation Work', duration: 5, level: 0, predecessor: '1' },
            { name: 'Structural Work', duration: 15, level: 0, predecessor: '4' },
            { name: 'MEP Installation', duration: 10, level: 0, predecessor: '5' },
            { name: 'Finishing Work', duration: 8, level: 0, predecessor: '6' },
            { name: 'Final Inspection', duration: 1, level: 0, predecessor: '7' },
            { name: 'Project Handover', duration: 0, level: 0, predecessor: '8' }
        ],
        marketing: [
            { name: 'Campaign Planning', duration: 5, level: 0, isSummary: true },
            { name: 'Market Research', duration: 3, level: 1, predecessor: '' },
            { name: 'Strategy Development', duration: 2, level: 1, predecessor: '2' },
            { name: 'Content Creation', duration: 10, level: 0, isSummary: true },
            { name: 'Copywriting', duration: 5, level: 1, predecessor: '1' },
            { name: 'Design Assets', duration: 7, level: 1, predecessor: '1' },
            { name: 'Video Production', duration: 8, level: 1, predecessor: '1' },
            { name: 'Campaign Launch', duration: 3, level: 0, predecessor: '4' },
            { name: 'Performance Monitoring', duration: 30, level: 0, predecessor: '8' },
            { name: 'Campaign Complete', duration: 0, level: 0, predecessor: '9' }
        ],
        event: [
            { name: 'Event Planning', duration: 15, level: 0, isSummary: true },
            { name: 'Venue Selection', duration: 5, level: 1, predecessor: '' },
            { name: 'Vendor Coordination', duration: 8, level: 1, predecessor: '2' },
            { name: 'Marketing & Promotion', duration: 10, level: 1, predecessor: '2' },
            { name: 'Event Setup', duration: 2, level: 0, predecessor: '1' },
            { name: 'Event Execution', duration: 1, level: 0, predecessor: '5' },
            { name: 'Event Cleanup', duration: 1, level: 0, predecessor: '6' },
            { name: 'Post-Event Analysis', duration: 3, level: 0, predecessor: '7' },
            { name: 'Event Complete', duration: 0, level: 0, predecessor: '8' }
        ]
    };

    const template = templates[templateType];
    if (!template) return;

    project.tasks = template.map((taskTemplate, index) => ({
        id: index + 1,
        wbs: '',
        name: taskTemplate.name,
        duration: taskTemplate.duration,
        start: null,
        finish: null,
        predecessor: taskTemplate.predecessor || '',
        level: taskTemplate.level,
        isSummary: taskTemplate.isSummary || false,
        expanded: true,
        progress: 0,
        notes: ''
    }));

    project.nextId = template.length + 1;
}

// Save project settings
function saveProjectSettings() {
    const workingDays = [];
    if (document.getElementById('workMon').checked) workingDays.push(1);
    if (document.getElementById('workTue').checked) workingDays.push(2);
    if (document.getElementById('workWed').checked) workingDays.push(3);
    if (document.getElementById('workThu').checked) workingDays.push(4);
    if (document.getElementById('workFri').checked) workingDays.push(5);
    if (document.getElementById('workSat').checked) workingDays.push(6);
    if (document.getElementById('workSun').checked) workingDays.push(0);

    if (workingDays.length === 0) {
        showError('At least one working day must be selected');
        return;
    }

    project.settings = {
        workingDays: workingDays,
        workingHours: parseInt(document.getElementById('workingHours').value) || 8,
        dateFormat: document.getElementById('dateFormat').value
    };

    calculateSchedule();
    renderProject();
    closeModal('projectSettingsModal');
    showMessage('Settings saved successfully', 'success');
}

// Context menu functions
function showContextMenu(x, y) {
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

// Edit task (future enhancement)
function editTask(taskId) {
    openTaskInfo(taskId);
}

// File operations
function saveProject() {
    try {
        const projectData = {
            ...project,
            version: '1.0',
            savedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showMessage('Project saved successfully', 'success');
    } catch (error) {
        showError('Error saving project: ' + error.message);
    }
}

function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loadedProject = JSON.parse(event.target.result);
                
                // Validate project structure
                if (!loadedProject.name || !loadedProject.tasks || !Array.isArray(loadedProject.tasks)) {
                    throw new Error('Invalid project file format');
                }
                
                // Convert date strings back to Date objects
                loadedProject.startDate = new Date(loadedProject.startDate);
                loadedProject.tasks.forEach(task => {
                    if (task.start) task.start = new Date(task.start);
                    if (task.finish) task.finish = new Date(task.finish);
                    if (task.progress === undefined) task.progress = 0;
                    if (task.notes === undefined) task.notes = '';
                });
                
                // Merge settings with defaults
                loadedProject.settings = {
                    workingDays: [1, 2, 3, 4, 5],
                    workingHours: 8,
                    dateFormat: 'MM/dd/yyyy',
                    ...loadedProject.settings
                };
                
                project = loadedProject;
                selectedTaskId = null;
                
                document.getElementById('projectTitle').textContent = project.name;
                
                updateWBS();
                calculateSchedule();
                renderProject();
                
                showMessage('Project loaded successfully', 'success');
            } catch (error) {
                showError('Error loading project: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function exportProject() {
    try {
        // Generate CSV export
        let csv = 'Task ID,WBS,Task Name,Duration,Start Date,Finish Date,Predecessors,Progress,Level,Is Summary\n';
        
        project.tasks.forEach(task => {
            const row = [
                task.id,
                task.wbs,
                `"${task.name}"`,
                task.duration,
                task.start ? formatDate(task.start) : '',
                task.finish ? formatDate(task.finish) : '',
                `"${task.predecessor || ''}"`,
                task.progress || 0,
                task.level,
                task.isSummary ? 'Yes' : 'No'
            ];
            csv += row.join(',') + '\n';
        });
        
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        const exportFileName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_export.csv';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showMessage('Project exported successfully', 'success');
    } catch (error) {
        showError('Error exporting project: ' + error.message);
    }
}

// Utility functions
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const format = project.settings.dateFormat;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    switch (format) {
        case 'dd/MM/yyyy':
            return `${day}/${month}/${year}`;
        case 'yyyy-MM-dd':
            return `${year}-${month}-${day}`;
        default:
            return `${month}/${day}/${year}`;
    }
}

function formatInputDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

function getDaysDiff(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function getMonthName(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
}

// Error and message handling
function showError(message, elementId = null) {
    if (elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    } else {
        alert('Error: ' + message);
    }
}

function showMessage(message, type = 'info') {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 6px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

// Initialize when page loads
window.onload = init;

