# Changelog

All notable changes to this project will be documented in this file.  The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] – 2025‑08‑25

### Added

- Brand new user interface inspired by Microsoft Project with groups for primary, task, schedule and view commands.
- Responsive layout with a two‑pane grid on desktop and a stacked view with bottom action bar on mobile.
- Design tokens for consistent spacing, typography, colours and row height.  Colours satisfy a 4.5:1 contrast ratio.
- Work breakdown structure labels generated automatically based on hierarchy.  Tasks can be indented/outdented, moved and organised into summary rows.
- Finish‑to‑start dependencies with automatic scheduling.  Critical path highlighting based on zero slack.
- Undo/redo functionality with up to 50 history entries.
- Import/export support: save to local storage, load from local storage, export CSV, import/export JSON.
- Basic keyboard shortcuts: undo/redo, save, delete and move tasks.
- Baseline tests (unit tests with Vitest) and a continuous integration pipeline that lints, tests, builds and deploys to GitHub Pages.

### Changed

- The initial demo application has been replaced with a fully featured production‑ready Gantt chart manager.

### Deprecated

- Nothing.

### Removed

- The previous Frappe Gantt demo and test page have been removed.

### Fixed

- Not applicable for initial release.