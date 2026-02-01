# Arun's Task Board - Product Requirements Document

> **Version:** 1.0.0
> **Stage:** Requirements
> **Created:** 2026-01-18
> **Author:** Design Agent
> **Status:** Ready for Architecture

---

## 1. Overview

### 1.1 Problem Statement

Solo developers managing multiple projects waste significant time on context switching. Project state is scattered across READMEs, notes, and memory. AI agents require repeated context injection every session. No tool exists that is file-based, agent-native, and provides pipeline visibility.

### 1.2 Solution Summary

A lightweight desktop application (Command Center) that:
- Reads/writes JSON files as the single source of truth
- Displays projects in a pipeline kanban view
- Provides Quick Launch command palette for fast navigation
- Updates in real-time via file watching
- Works completely offline

### 1.3 Target Users

**Primary:** Solo developers with 3+ active projects who use AI coding assistants.

---

## 2. Features

### 2.1 MVP Features (P0) - Must Have

#### F1: Pipeline Kanban View
**Description:** Main dashboard showing all projects as cards organized by stage columns.

**Columns (5 stages):**
1. Design (conception, discovery, requirements)
2. Engineering (architecture, qa-planning, review)
3. Build (development, testing, staging)
4. Launch (ship, announce, walkthrough)
5. Closure (documentation, portfolio, retrospective)

**Card Display:**
- Project name
- Current phase within stage
- Progress bar (%)
- Priority badge (P0/P1/P2/P3)
- Task count (completed/total)
- Days since last update

**Interactions:**
- Click card → Open project detail modal
- Drag card → Move to different stage (updates projects.json)

---

#### F2: Quick Launch Command Palette
**Description:** Global command palette (⌘K / Ctrl+K) for fast navigation and actions.

**Features:**
- Fuzzy search across commands, projects, tasks
- Recent items at top
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)

**Commands:**
| Command | Action |
|---------|--------|
| `open <project>` | Open project in VS Code |
| `status <project>` | Show project status modal |
| `stage <project> next` | Move to next stage |
| `inbox` | Open inbox.md in editor |
| `tasks <project>` | Show task list |
| `where` | Show all project statuses |

---

#### F3: File Operations
**Description:** Read and write JSON/Markdown files.

**Files Managed:**
- `projects.json` - Read/write
- `tasks.json` - Read/write
- `inbox.md` - Read/display
- `config.json` - Read only

**Operations:**
- Load on startup
- Save on change (debounced 500ms)
- Validate JSON before write
- Backup before destructive operations

---

#### F4: File Watcher
**Description:** Watch for external file changes and update UI in real-time.

**Watched Files:**
- `~/arun-task-board/projects.json`
- `~/arun-task-board/tasks.json`
- `~/arun-task-board/inbox.md`

**Behavior:**
- Debounce rapid changes (500ms)
- Reload and re-render on change
- Show toast notification: "Files updated externally"

---

#### F5: Project Detail Modal
**Description:** Modal showing full project information.

**Sections:**
- Header: Name, stage, progress bar
- Metadata: Priority, complexity, dates, tech stack
- Stage history timeline
- Task summary (count by status)
- Quick actions (open in VS Code, move stage)

---

#### F6: Dark Theme
**Description:** Dark theme by default, matching developer preferences.

**Colors:**
- Background: `#0a0a0a` (near black)
- Surface: `#141414` (cards)
- Border: `#262626`
- Text primary: `#fafafa`
- Text secondary: `#a1a1aa`
- Accent: `#3b82f6` (blue)
- Success: `#22c55e`
- Warning: `#f59e0b`
- Error: `#ef4444`

---

### 2.2 Phase 2 Features (P1) - Important

#### F7: Task Management
- View tasks per project
- Create/edit/complete tasks
- Filter by status, priority
- Subtask support

#### F8: Agent Invocation
- Build context prompt from project state
- Copy to clipboard
- Open Claude (browser/desktop)

#### F9: Inbox Processing
- Parse inbox.md instructions
- Execute commands
- Mark as [DONE]/[SKIPPED]

---

### 2.3 Future Features (P2) - Nice to Have

#### F10: Drag-Drop Between Stages
- Reorder within column
- Move between columns

#### F11: README ORBIT Sync
- Update README on stage change
- Push to GitHub

#### F12: Light Theme
- Toggle dark/light
- System preference detection

---

## 3. User Stories

### Pipeline View
- As a user, I want to see all my projects organized by stage so I can understand my portfolio at a glance.
- As a user, I want to see project progress percentage so I know how far along each project is.
- As a user, I want to see days since last update so I can identify stale projects.

### Quick Launch
- As a user, I want to press ⌘K to open a command palette so I can navigate quickly.
- As a user, I want to fuzzy search projects so I can find them by partial name.
- As a user, I want keyboard navigation so I never need the mouse.

### File Operations
- As a user, I want the app to read my existing JSON files so I don't lose data.
- As a user, I want changes saved automatically so I don't have to manually save.
- As a user, I want JSON validation so corrupted data doesn't crash the app.

### Real-time Updates
- As a user, I want the UI to update when I edit files externally (in VS Code) so the app stays in sync.
- As a user, I want to see a notification when external changes are detected.

---

## 4. Acceptance Criteria

### F1: Pipeline Kanban View
- [ ] Shows 5 stage columns
- [ ] Displays project cards with: name, phase, progress, priority, task count
- [ ] Cards are clickable to open detail modal
- [ ] Empty columns show "No projects" placeholder
- [ ] Loads in < 100ms with 10 projects

### F2: Quick Launch
- [ ] Opens with ⌘K (Mac) / Ctrl+K (Windows)
- [ ] Closes with Esc
- [ ] Fuzzy matches project names
- [ ] Shows commands matching input
- [ ] Executes selected command on Enter
- [ ] Navigates with arrow keys
- [ ] Opens in < 50ms

### F3: File Operations
- [ ] Reads projects.json on startup
- [ ] Reads tasks.json on startup
- [ ] Writes changes with 500ms debounce
- [ ] Validates JSON schema before write
- [ ] Shows error toast on invalid JSON
- [ ] Creates backup before write

### F4: File Watcher
- [ ] Detects changes within 1 second
- [ ] Debounces rapid changes
- [ ] Reloads data and re-renders
- [ ] Shows "Externally updated" toast

### F5: Project Detail Modal
- [ ] Opens on card click
- [ ] Shows all project fields
- [ ] Shows stage history timeline
- [ ] Has "Open in VS Code" button
- [ ] Has "Move to next stage" button
- [ ] Closes with Esc or outside click

### F6: Dark Theme
- [ ] Dark background by default
- [ ] All text readable (contrast ratio > 4.5:1)
- [ ] Consistent color tokens throughout

---

## 5. Non-Functional Requirements

### 5.1 Performance
- App launch: < 2 seconds
- File load: < 100ms for 100 projects
- UI response: < 16ms (60fps)
- File watch latency: < 1 second

### 5.2 Security
- No network requests (offline-first)
- No telemetry
- Files stored locally only
- No sensitive data in logs

### 5.3 Accessibility
- Keyboard navigable
- Focus indicators visible
- Color not sole indicator (icons + color)

### 5.4 Compatibility
- Windows 10/11
- macOS 12+
- Linux (Ubuntu 22.04+)

---

## 6. Technical Constraints

### 6.1 Stack (Non-negotiable)
- **Framework:** Tauri 2.0
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **File ops:** Tauri FS API
- **File watch:** notify (Rust crate)

### 6.2 File Paths
```
~/arun-task-board/
├── config.json
├── projects.json
├── tasks.json
├── inbox.md
└── agent-actions.log
```

### 6.3 JSON Schemas
See existing files for schema definitions.

---

## 7. Out of Scope (v1.0)

Explicitly NOT building:
- [ ] Cloud sync
- [ ] Multi-user support
- [ ] Mobile app
- [ ] Browser extension
- [ ] API server
- [ ] Database backend
- [ ] Git integration
- [ ] Time tracking
- [ ] Notifications/reminders
- [ ] Task editing (view only)
- [ ] Inbox processing (view only)

---

## 8. Implementation Plan

### Phase 1: Foundation (Week 1)
1. Tauri project setup
2. React + TypeScript + Tailwind config
3. Zustand store setup
4. File service (read/write JSON)
5. Type definitions

### Phase 2: Core UI (Week 1-2)
6. App shell (header, layout)
7. Pipeline kanban component
8. Project card component
9. Empty states

### Phase 3: Interactions (Week 2)
10. Quick Launch command palette
11. Project detail modal
12. Keyboard shortcuts

### Phase 4: Real-time (Week 2-3)
13. File watcher (Rust backend)
14. Auto-reload on change
15. Toast notifications

### Phase 5: Polish (Week 3)
16. Dark theme refinement
17. Loading states
18. Error handling
19. Performance optimization

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active use | 5+ days/week | Self-reported |
| Context switch time | < 30 seconds | Stopwatch test |
| Crash rate | 0 | Error logs |
| Load time | < 2 seconds | Startup timer |

---

## 10. Appendix

### A. Mockup Reference
See: `docs/mockups/pipeline-view.html` (to be created)

### B. Related Documents
- [idea.md](./idea.md) - Original concept
- [discovery.md](./discovery.md) - Research findings
- [TASKBOARD_COMPLETE_SPEC.md](../../../TASKBOARD_COMPLETE_SPEC.md) - Full system spec

---

**PRD Status:** ✅ Ready for Architecture Phase

*Next: Architect Agent creates ARCHITECTURE.md and generates implementation tasks.*
