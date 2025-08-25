# UniProject Gantt Chart

[![CI](https://github.com/sulaimanalsheibani1-lgtm/gantt-chart-app/actions/workflows/ci.yml/badge.svg)](https://github.com/sulaimanalsheibani1-lgtm/gantt-chart-app/actions/workflows/ci.yml) [![Pages](https://img.shields.io/badge/pages-deployed-blue)](https://sulaimanalsheibani1-lgtm.github.io/gantt-chart-app/)

UniProject is a lightweight Gantt chart manager inspired by Microsoft Project.  It aims to make task scheduling and progress tracking approachable for individuals and teams without requiring proprietary software.  The application runs entirely in the browser and relies only on vanilla JavaScript, CSS and HTML.

## Features

- Two‑pane layout showing a task table alongside a live Gantt chart.  A resizable divider lets you adjust the relative widths.
- Responsive design: on narrow screens the table and chart stack vertically and a bottom action bar surfaces common commands.
- Task hierarchy with indentation, summary rows and collapsible children.  Work breakdown structure (WBS) labels update automatically.
- Commands grouped into Primary, Task, Schedule and View categories with clear labels and tooltips.
- Finish‑to‑start dependencies between tasks.  Auto scheduling computes start and finish dates based on predecessors and duration.
- Critical path highlighting for tasks with zero slack.
- Undo/redo history, keyboard shortcuts and persistent storage in the browser.
- Import/export projects as JSON or CSV.
- Accessible: all controls have text, aria labels and focus rings.  Colour contrast meets a 4.5:1 ratio.

## Running locally

You need [Node.js](https://nodejs.org/) installed.  Clone this repository and install dependencies:

```bash
npm install
```

To start a development server with hot reload:

```bash
npm run dev
```

Open <http://localhost:5173> in your browser.  The compiled build can be produced with:

```bash
npm run build
```

The build output is placed in the `dist` directory.  You can preview it with:

```bash
npm run preview
```

## Keyboard shortcuts

- **Ctrl/Cmd + N** – start a new project
- **Ctrl/Cmd + S** – save project to local storage
- **Ctrl/Cmd + Z** – undo; **Ctrl/Cmd + Shift + Z** – redo
- **Delete** – delete selected task
- **Arrow up/down** (with Ctrl/Cmd) – move task up or down

Other actions (add, indent, outdent, link, unlink, auto schedule, zoom) are available through the toolbar or bottom bar.

## Import/export

Use **Save** to persist your project in the browser’s local storage.  Use **Export** to download a CSV of the current task list.  The **Open** command loads a project from local storage.  To import or export JSON, use the context menu: right‑click on the page and choose the appropriate option.

The CSV columns are:

- `id` – numeric task identifier
- `wbs` – work breakdown structure label (1.0, 1.1, …)
- `name` – task name
- `duration` – duration in days
- `start` – ISO date (YYYY‑MM‑DD)
- `finish` – ISO date (YYYY‑MM‑DD)
- `predecessors` – comma‑separated list of predecessor IDs
- `progress` – percentage complete (0–100)

## Accessibility

All interactive controls include visible labels and `aria‑label` attributes.  The colour palette meets WCAG AA contrast requirements.  Keyboard navigation is supported throughout the interface, and focus states are visible.  Table rows and chart bars are linked, so selecting a row highlights the corresponding bar and vice versa.

## Known limits

This release focuses on essential scheduling.  Only finish‑to‑start dependencies are supported.  Dragging bars to reschedule tasks is not yet implemented.  The application has been optimised to handle up to around 1 000 tasks at 60 fps scrolling on modern desktops; very large projects may experience lag.  Settings such as working days and custom date formats are planned for future iterations.

## Contributing

Contributions are welcome.  Please open an issue or pull request to discuss improvements, bug fixes or feature ideas.  All text and comments should use Australian English.