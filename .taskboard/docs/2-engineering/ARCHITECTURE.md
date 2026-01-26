# Arun's Task Board - Architecture

> **Version:** 1.0.0
> **Stage:** Engineering
> **Created:** 2026-01-18
> **Author:** Architect Agent
> **Status:** Ready for Build

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMMAND CENTER (Tauri App)                         │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Pipeline   │    │   Quick     │    │   Project   │    │    Toast    │  │
│  │   View      │    │   Launch    │    │   Modal     │    │   System    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                     │                                       │
│                            ┌────────┴────────┐                              │
│                            │   Zustand Store  │                              │
│                            │  (App State)     │                              │
│                            └────────┬────────┘                              │
│                                     │                                       │
│         ┌───────────────────────────┼───────────────────────────┐          │
│         │                           │                           │          │
│  ┌──────┴──────┐            ┌───────┴───────┐           ┌───────┴───────┐  │
│  │ File Service │            │ Command Service│           │ Shell Service │  │
│  │ (Read/Write) │            │ (Quick Launch) │           │ (VS Code)     │  │
│  └──────┬──────┘            └───────────────┘           └───────────────┘  │
│         │                                                                   │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │ Tauri FS API
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FILE SYSTEM                                       │
│                                                                             │
│   ~/arun-task-board/                                                        │
│   ├── projects.json    ◄─────── File Watcher (Rust) ────────┐              │
│   ├── tasks.json       ◄────────────────────────────────────┤              │
│   ├── config.json                                           │              │
│   └── inbox.md         ◄────────────────────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Desktop Framework** | Tauri | 2.0 | 3MB binary, native perf, Rust backend |
| **Frontend Framework** | React | 18.x | Familiar, ecosystem, hooks |
| **Language** | TypeScript | 5.x | Type safety, DX |
| **Styling** | Tailwind CSS | 3.x | Utility-first, dark theme |
| **State Management** | Zustand | 4.x | Minimal, no boilerplate |
| **File Watching** | notify | 6.x | Rust crate, cross-platform |
| **Fuzzy Search** | fuse.js | 7.x | Lightweight, good results |

---

## 3. Component Design

### 3.1 App Shell

**Purpose:** Main layout wrapper with header and content area.

**File:** `src/components/AppShell.tsx`

```typescript
interface AppShellProps {
  children: React.ReactNode;
}

// Layout:
// ┌────────────────────────────────────────┐
// │ Header: "Task Board"            ⌘K     │
// ├────────────────────────────────────────┤
// │                                        │
// │              {children}                │
// │                                        │
// └────────────────────────────────────────┘
```

---

### 3.2 Pipeline View

**Purpose:** Main dashboard with 5-column kanban board.

**File:** `src/components/PipelineView.tsx`

```typescript
interface PipelineViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

// Layout:
// ┌──────────┬──────────┬──────────┬──────────┬──────────┐
// │  Design  │Engineering│  Build   │  Launch  │ Closure  │
// │   (2)    │    (1)   │   (3)    │   (0)    │   (1)    │
// ├──────────┼──────────┼──────────┼──────────┼──────────┤
// │ [Card]   │ [Card]   │ [Card]   │  Empty   │ [Card]   │
// │ [Card]   │          │ [Card]   │  State   │          │
// │          │          │ [Card]   │          │          │
// └──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### 3.3 Stage Column

**Purpose:** Single column in the pipeline.

**File:** `src/components/StageColumn.tsx`

```typescript
interface StageColumnProps {
  stage: Stage;
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

// Features:
// - Header with stage name and count
// - Scrollable project list
// - Empty state when no projects
```

---

### 3.4 Project Card

**Purpose:** Card representing a single project.

**File:** `src/components/ProjectCard.tsx`

```typescript
interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

// Layout:
// ┌────────────────────────────────┐
// │ 🔨 Project Name         P0    │
// │ Phase: development            │
// │ ████████░░░░░ 65%             │
// │ Tasks: 15/24  •  2d ago       │
// └────────────────────────────────┘
```

---

### 3.5 Quick Launch (Command Palette)

**Purpose:** Global command palette for fast navigation.

**File:** `src/components/QuickLaunch.tsx`

```typescript
interface QuickLaunchProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (command: Command) => void;
}

// Features:
// - Fuzzy search with fuse.js
// - Keyboard navigation
// - Command categories (Projects, Commands, Tasks)
// - Recent items
```

---

### 3.6 Project Modal

**Purpose:** Detailed project view in modal.

**File:** `src/components/ProjectModal.tsx`

```typescript
interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: ProjectAction) => void;
}

// Sections:
// - Header: Name, stage badge
// - Metadata grid
// - Stage history timeline
// - Task summary
// - Action buttons
```

---

### 3.7 Toast System

**Purpose:** Notification feedback for user actions.

**File:** `src/components/Toast.tsx`

```typescript
type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number; // default 3000ms
}
```

---

## 4. Data Models

### 4.1 TypeScript Interfaces

**File:** `src/types/index.ts`

```typescript
// Enums
export type Stage = 'design' | 'engineering' | 'build' | 'launch' | 'closure';
export type Phase =
  | 'conception' | 'discovery' | 'requirements'  // design
  | 'architecture' | 'qa-planning' | 'review'    // engineering
  | 'development' | 'testing' | 'staging'        // build
  | 'ship' | 'announce' | 'walkthrough'          // launch
  | 'documentation' | 'portfolio' | 'retrospective'; // closure

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Complexity = 'E' | 'F'; // Easy or Full
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
export type TaskComplexity = 'XS' | 'S' | 'M' | 'L' | 'XL';

// Project
export interface Project {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  githubUrl: string | null;

  stage: Stage;
  stageStatus: 'in-progress' | 'blocked' | 'completed';
  currentPhase: Phase;

  priority: Priority;
  complexity: Complexity;
  progress: number; // 0-100

  targetDate: string | null;
  startedAt: string;
  createdAt: string;
  lastUpdated: string;
  completedAt: string | null;

  tags: string[];
  techStack: string[];

  links: {
    github: string | null;
    docs: string | null;
    live: string | null;
  };

  metrics: {
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
  };

  stageHistory: StageHistoryEntry[];
}

export interface StageHistoryEntry {
  stage: Stage;
  phase: Phase;
  enteredAt: string;
  completedAt: string | null;
}

// Task
export interface Task {
  id: string;
  projectId: string;

  title: string;
  description: string;

  stage: Stage;
  phase: Phase;
  status: TaskStatus;

  priority: Priority;
  complexity: TaskComplexity;

  assignee: string;
  assignedAgent: string;

  dueDate: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  dependencies: string[];
  linkedDocs: string[];

  subtasks: Subtask[];
  tags: string[];
  comments: Comment[];

  createdBy: 'user' | 'agent';
  sourceDoc: string | null;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

// Config
export interface Config {
  version: string;
  user: {
    name: string;
    timezone: string;
    preferences: {
      theme: 'dark' | 'light';
      language: string;
      framework: string;
      styling: string;
      state: string;
    };
  };
  paths: {
    projects: string;
    taskboard: string;
  };
  agents: Record<string, string>;
  settings: {
    autoUpdateLaunchpad: boolean;
    logActions: boolean;
    fileWatchDebounce: number;
  };
}

// Data files
export interface ProjectsFile {
  version: string;
  lastUpdated: string;
  projects: Project[];
}

export interface TasksFile {
  version: string;
  lastUpdated: string;
  tasks: Task[];
}
```

---

## 5. State Management

### 5.1 Zustand Store

**File:** `src/store/index.ts`

```typescript
import { create } from 'zustand';

interface AppState {
  // Data
  projects: Project[];
  tasks: Task[];
  config: Config | null;

  // UI State
  selectedProject: Project | null;
  isQuickLaunchOpen: boolean;
  isProjectModalOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setConfig: (config: Config) => void;

  selectProject: (project: Project | null) => void;
  openQuickLaunch: () => void;
  closeQuickLaunch: () => void;
  openProjectModal: (project: Project) => void;
  closeProjectModal: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getProjectsByStage: (stage: Stage) => Project[];
  getTasksByProject: (projectId: string) => Task[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projects: [],
  tasks: [],
  config: null,
  selectedProject: null,
  isQuickLaunchOpen: false,
  isProjectModalOpen: false,
  isLoading: true,
  error: null,

  // Actions
  setProjects: (projects) => set({ projects }),
  setTasks: (tasks) => set({ tasks }),
  setConfig: (config) => set({ config }),

  selectProject: (project) => set({ selectedProject: project }),
  openQuickLaunch: () => set({ isQuickLaunchOpen: true }),
  closeQuickLaunch: () => set({ isQuickLaunchOpen: false }),
  openProjectModal: (project) => set({
    selectedProject: project,
    isProjectModalOpen: true
  }),
  closeProjectModal: () => set({
    isProjectModalOpen: false,
    selectedProject: null
  }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Computed
  getProjectsByStage: (stage) =>
    get().projects.filter(p => p.stage === stage),
  getTasksByProject: (projectId) =>
    get().tasks.filter(t => t.projectId === projectId),
}));
```

---

## 6. Services

### 6.1 File Service

**File:** `src/services/fileService.ts`

```typescript
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { homeDir } from '@tauri-apps/api/path';

const TASKBOARD_PATH = 'arun-task-board';

export const fileService = {
  async readProjects(): Promise<ProjectsFile> {
    const home = await homeDir();
    const content = await readTextFile(`${home}/${TASKBOARD_PATH}/projects.json`);
    return JSON.parse(content);
  },

  async writeProjects(data: ProjectsFile): Promise<void> {
    const home = await homeDir();
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(`${home}/${TASKBOARD_PATH}/projects.json`, content);
  },

  async readTasks(): Promise<TasksFile> {
    const home = await homeDir();
    const content = await readTextFile(`${home}/${TASKBOARD_PATH}/tasks.json`);
    return JSON.parse(content);
  },

  async writeTasks(data: TasksFile): Promise<void> {
    const home = await homeDir();
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(`${home}/${TASKBOARD_PATH}/tasks.json`, content);
  },

  async readConfig(): Promise<Config> {
    const home = await homeDir();
    const content = await readTextFile(`${home}/${TASKBOARD_PATH}/config.json`);
    return JSON.parse(content);
  }
};
```

---

### 6.2 Command Service

**File:** `src/services/commandService.ts`

```typescript
export interface Command {
  id: string;
  name: string;
  description: string;
  category: 'project' | 'command' | 'task';
  action: () => void | Promise<void>;
  keywords: string[];
}

export const commandService = {
  getCommands(projects: Project[]): Command[] {
    const commands: Command[] = [
      // Built-in commands
      {
        id: 'cmd-inbox',
        name: 'inbox',
        description: 'Open inbox.md',
        category: 'command',
        action: () => { /* open inbox */ },
        keywords: ['inbox', 'instructions', 'notes'],
      },
      {
        id: 'cmd-where',
        name: 'where',
        description: 'Show all project statuses',
        category: 'command',
        action: () => { /* show status */ },
        keywords: ['where', 'status', 'all', 'projects'],
      },
      // ... more commands
    ];

    // Add project commands
    for (const project of projects) {
      commands.push({
        id: `proj-${project.id}`,
        name: project.name,
        description: `${project.stage} • ${project.progress}%`,
        category: 'project',
        action: () => { /* open project */ },
        keywords: [project.id, project.name, ...project.tags],
      });
    }

    return commands;
  },

  search(commands: Command[], query: string): Command[] {
    if (!query) return commands.slice(0, 10);

    const fuse = new Fuse(commands, {
      keys: ['name', 'keywords', 'description'],
      threshold: 0.3,
    });

    return fuse.search(query).map(r => r.item).slice(0, 10);
  }
};
```

---

### 6.3 Shell Service

**File:** `src/services/shellService.ts`

```typescript
import { Command } from '@tauri-apps/plugin-shell';

export const shellService = {
  async openInVSCode(path: string): Promise<void> {
    await Command.create('code', [path]).execute();
  },

  async openFile(path: string): Promise<void> {
    // Platform-specific file open
    await Command.create('open', [path]).execute();
  }
};
```

---

## 7. Rust Backend (File Watcher)

### 7.1 File Watcher Command

**File:** `src-tauri/src/lib.rs`

```rust
use notify::{Watcher, RecursiveMode, watcher};
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::Manager;

#[tauri::command]
fn start_file_watcher(app: tauri::AppHandle) -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let taskboard_path = home.join("arun-task-board");

    std::thread::spawn(move || {
        let (tx, rx) = channel();

        let mut watcher = watcher(tx, Duration::from_millis(500))
            .expect("Failed to create watcher");

        watcher.watch(&taskboard_path, RecursiveMode::NonRecursive)
            .expect("Failed to watch directory");

        loop {
            match rx.recv() {
                Ok(event) => {
                    // Emit event to frontend
                    app.emit_all("file-changed", &event.path).ok();
                }
                Err(e) => {
                    eprintln!("Watch error: {:?}", e);
                }
            }
        }
    });

    Ok(())
}
```

---

## 8. File Structure

```
arun-task-board/
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   └── lib.rs             # Tauri commands (file watcher)
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                       # React frontend
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── PipelineView.tsx
│   │   ├── StageColumn.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── QuickLaunch.tsx
│   │   ├── ProjectModal.tsx
│   │   └── Toast.tsx
│   │
│   ├── services/
│   │   ├── fileService.ts
│   │   ├── commandService.ts
│   │   └── shellService.ts
│   │
│   ├── store/
│   │   └── index.ts           # Zustand store
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   │
│   ├── hooks/
│   │   ├── useFileWatcher.ts
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # Tailwind base
│
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 9. Implementation Order

| # | Task | Dependencies | Complexity | Priority |
|---|------|--------------|------------|----------|
| 1 | Initialize Tauri project | - | S | P0 |
| 2 | Configure Tailwind CSS | 1 | XS | P0 |
| 3 | Set up Zustand store | 1 | S | P0 |
| 4 | Create TypeScript types | 1 | S | P0 |
| 5 | Implement file service | 4 | M | P0 |
| 6 | Build app shell | 2 | S | P0 |
| 7 | Build Pipeline view | 6, 3 | M | P0 |
| 8 | Build Project Card | 4 | M | P0 |
| 9 | Build Quick Launch | 6 | L | P0 |
| 10 | Build Project Modal | 8 | M | P0 |
| 11 | Keyboard shortcuts | 9 | S | P1 |
| 12 | File watcher (Rust) | 1 | M | P0 |
| 13 | Connect watcher to UI | 12, 5 | S | P0 |
| 14 | Toast system | 6 | S | P1 |
| 15 | Open in VS Code | 9 | XS | P1 |
| 16 | Loading/error states | 7 | S | P1 |
| 17 | Performance optimization | 13 | M | P2 |

---

## 10. Security Considerations

1. **File Access** - Only read/write to ~/arun-task-board/ directory
2. **No Network** - App is completely offline, no external requests
3. **No Secrets** - No API keys, tokens, or sensitive data stored
4. **JSON Validation** - Validate schema before writing to prevent corruption

---

## 11. Performance Considerations

1. **Lazy Loading** - Load tasks only when project is selected
2. **Debounced Writes** - 500ms debounce on file writes
3. **Virtualized Lists** - For large project/task lists (if needed)
4. **Memoization** - React.memo for card components

---

## 12. Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "fuse.js": "^7.0.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 13. Next Steps

1. ✅ Architecture complete (this document)
2. → Move to QA Planning phase (optional) or skip to Build
3. Create TEST_CASES.md (if doing QA planning)
4. Start building - Task #1: Initialize Tauri project

---

## 14. Hybrid Agent Architecture

### Overview

Taskboard uses a **unified agent system** with **hybrid execution modes**. Agents and commands are shared from the global `_claude-shared` folder and can be invoked either automatically by the app or manually by the user.

### Unified Agent System

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED AGENTS                                   │
│                                                                     │
│  Location: C:/Users/{user}/Documents/Projects/_claude-shared/      │
│                                                                     │
│  Agents (@invocation in IDE):                                      │
│  ├── @designer  - Requirements via deep research                  │
│  ├── @architect - System design, PRD, mockups                     │
│  ├── @qa        - Test planning (CSV + Markdown)                  │
│  ├── @dev       - Development tracking, dev-log                   │
│  └── @walkthrough - Code walkthroughs                             │
│                                                                     │
│  Commands (/invocation):                                           │
│  ├── /readme - README quality scoring                             │
│  ├── /git    - Git ops, LAUNCHPAD sync                           │
│  ├── /docs   - Documentation generation                          │
│  └── /deploy - Deployment workflows                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Execution Modes

| Mode | Description | Trigger |
|------|-------------|---------|
| **Auto** | App detects changes → spawns Claude Code CLI → invokes agent | inbox.md change, file watcher |
| **Manual** | User invokes agent directly in Claude Code | `@designer`, `/readme`, etc. |
| **Hybrid** | Both modes enabled (default) | Either trigger works |

### Configuration

```json
{
  "agentExecution": {
    "mode": "hybrid",           // "auto" | "manual" | "hybrid"
    "autoTrigger": "inbox",     // What triggers auto mode
    "claudeCodePath": "claude", // CLI path
    "timeout": 300000           // 5 min timeout
  }
}
```

### Auto Execution Flow

```
1. User adds instruction to inbox.md
        ↓
2. File watcher detects change
        ↓
3. Orchestrator parses inbox.md
        ↓
4. Orchestrator determines appropriate agent
        ↓
5. App spawns: claude --agent @{agent} --prompt "{task}"
        ↓
6. Agent executes, updates files
        ↓
7. Notification shown to user
```

### Manual Execution Flow

```
1. User opens Claude Code in project
        ↓
2. User types: @designer help me with requirements
        ↓
3. Agent instructions loaded from _claude-shared/agents/designer.md
        ↓
4. Agent executes with full context
        ↓
5. User interacts directly
```

### Orchestrator Role

The `agents/orchestrator.md` file contains routing logic:

| Stage/Phase | Routed To |
|-------------|-----------|
| design/* | @designer |
| engineering/architecture | @architect |
| engineering/qa-planning | @qa |
| build/development | @dev |
| build/testing | @qa |
| launch/* | /docs |
| git operations | /git |

---

**Architecture Status:** ✅ Ready for Build Phase

*Next: Dev Agent starts implementation from Task t-20260118-0001*
