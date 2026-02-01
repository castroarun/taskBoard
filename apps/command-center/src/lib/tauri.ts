/**
 * Tauri API wrapper for Klarity
 *
 * Provides typed interfaces for all Tauri commands.
 */

import { invoke } from '@tauri-apps/api/core';
import { Project, Task, InboxItem } from '@/store';

// Check if we're running in Tauri
export const isTauri = (): boolean => {
  return '__TAURI__' in window;
};

// Dev mode in-memory image store (simulates file system)
interface DevImageStore {
  [projectPath: string]: {
    [folder: string]: Array<{ name: string; dataUrl: string }>;
  };
}
const devImageStore: DevImageStore = {};

// Data API

interface ProjectsData {
  version: string;
  lastUpdated: string;
  projects: Project[];
}

interface TasksData {
  version: string;
  lastUpdated: string;
  tasks: Task[];
}

/**
 * Read projects from ~/.taskboard/projects.json (or /data/projects.json in dev)
 */
export async function readProjects(): Promise<ProjectsData> {
  if (!isTauri()) {
    // In dev mode, fetch from public data folder
    try {
      const response = await fetch('/data/projects.json');
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn('[tauri] Failed to fetch projects.json, using fallback');
    }
    // Fallback to empty
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), projects: [] };
  }

  const data = await invoke<string>('read_projects');
  return JSON.parse(data);
}

/**
 * Write projects to ~/.taskboard/projects.json
 */
export async function writeProjects(data: ProjectsData): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing projects', data);
    return;
  }

  await invoke('write_projects', { data: JSON.stringify(data, null, 2) });
}

/**
 * Read tasks from ~/.taskboard/tasks.json (or /data/tasks.json in dev)
 */
export async function readTasks(): Promise<TasksData> {
  if (!isTauri()) {
    // In dev mode, fetch from public data folder
    try {
      const response = await fetch('/data/tasks.json');
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn('[tauri] Failed to fetch tasks.json, using fallback');
    }
    // Fallback to empty
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), tasks: [] };
  }

  const data = await invoke<string>('read_tasks');
  return JSON.parse(data);
}

/**
 * Write tasks to ~/.taskboard/tasks.json
 */
export async function writeTasks(data: TasksData): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing tasks', data);
    return;
  }

  await invoke('write_tasks', { data: JSON.stringify(data, null, 2) });
}

/**
 * Read inbox from ~/.taskboard/inbox.md
 */
export async function readInbox(): Promise<string> {
  if (!isTauri()) {
    return '# Inbox\n\nQuick instructions for agents.\n\n---\n';
  }

  return invoke<string>('read_inbox');
}

/**
 * Write inbox to ~/.taskboard/inbox.md
 */
export async function writeInbox(content: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing inbox', content);
    return;
  }

  await invoke('write_inbox', { data: content });
}

// Inbox JSON Data Structure
interface InboxData {
  version: string;
  lastUpdated: string;
  items: InboxItem[];
}

// Mock inbox data for dev mode and first-time Tauri users
// Note: read=true for user-created items (user knows about them)
// read=false only when Claude has replied and user hasn't seen it yet
export const MOCK_INBOX_ITEMS: InboxItem[] = [
  {
    id: 'inbox-1',
    text: 'Research Whisper alternatives',
    type: 'idea',
    project: 'tradevoice',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    read: false, // Claude replied, user hasn't seen - shows badge
    author: 'user',
    parentId: null,
    replies: [
      {
        id: 'reply-1',
        author: 'claude',
        text: `I found several alternatives worth considering for real-time voice transcription:

• **Deepgram** — Fastest option, great for real-time with ~100ms latency
• **AssemblyAI** — Best accuracy, more features like speaker diarization
• **Groq Whisper** — Free tier available, fast inference on their hardware

Want me to create a detailed comparison doc with pricing and code examples?`,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 'reply-2',
        author: 'user',
        text: 'Yes, please create the comparison. Focus on Deepgram and Groq since we need speed. Include pricing for ~100k minutes/month.',
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      },
    ],
  },
  {
    id: 'inbox-2',
    text: 'Review pending: APP_PRD.md',
    type: 'task',
    project: 'tradevoice',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-3',
    text: 'Stale project: Portfolio',
    type: 'note',
    project: 'portfolio',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(), // 18 days ago
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-4',
    text: 'Move pipeline task to review',
    type: 'task',
    project: 'taskboard',
    priority: 'P1',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-5',
    text: 'Add keyboard shortcuts',
    type: 'task',
    project: 'taskboard',
    priority: 'P2',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-6',
    text: 'P0 the file watcher task',
    type: 'task',
    project: null,
    priority: 'P0',
    status: 'pending',
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-7',
    text: 'Start discovery: Fitness Tracker',
    type: 'idea',
    project: 'fittrack',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), // 12 days ago
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-8',
    text: 'Set up CI/CD pipeline for staging. Need GitHub Actions workflow with auto-deploy to Vercel preview.',
    type: 'task',
    project: 'taskboard',
    priority: 'P1',
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-9',
    text: 'Explore Supabase Edge Functions for real-time sync between Orbit and Command Center',
    type: 'idea',
    project: 'orbit',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-10',
    text: 'Bug: Calendar view crashes when no activities exist for selected week',
    type: 'task',
    project: 'taskboard',
    priority: 'P0',
    status: 'pending',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-11',
    text: 'Write unit tests for inbox CRUD operations. Cover add, update, delete, and reply flows.',
    type: 'task',
    project: 'taskboard',
    priority: 'P2',
    status: 'pending',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-12',
    text: 'Add dark/light theme toggle to settings panel',
    type: 'task',
    project: 'taskboard',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
  {
    id: 'inbox-13',
    text: 'Research React Native Expo push notifications for Orbit mobile companion app',
    type: 'idea',
    project: 'orbit',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    read: true,
    author: 'user',
    parentId: null,
    replies: [],
  },
];

/**
 * Read inbox from ~/.taskboard/inbox.json (structured data)
 */
export async function readInboxJson(): Promise<InboxData> {
  if (!isTauri()) {
    // In dev mode, return mock data so badge and inbox items work
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), items: MOCK_INBOX_ITEMS };
  }

  const data = await invoke<string>('read_inbox_json');
  return JSON.parse(data);
}

/**
 * Write inbox to ~/.taskboard/inbox.json (structured data)
 */
export async function writeInboxJson(data: InboxData): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing inbox.json', data);
    return;
  }

  await invoke('write_inbox_json', { data: JSON.stringify(data, null, 2) });
}

// Sync config for mobile ↔ desktop sync
export interface SyncConfig {
  // Gist-based sync (legacy)
  gistToken: string;
  gistId: string;
  pollIntervalMs?: number;
  // GitHub repo sync (Orbit ↔ Klarity via .taskboard repo)
  github?: {
    token: string;
    owner: string;
    pollIntervalMs?: number;
  };
}

/**
 * Read sync config from ~/.taskboard/sync-config.json
 */
export async function readSyncConfig(): Promise<SyncConfig | null> {
  if (!isTauri()) {
    return null; // No sync in dev mode
  }

  try {
    const data = await invoke<string>('read_sync_config');
    return JSON.parse(data);
  } catch {
    return null; // File doesn't exist yet
  }
}

/**
 * Write sync config to ~/.taskboard/sync-config.json
 */
export async function writeSyncConfig(config: SyncConfig): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing sync config', config);
    return;
  }

  await invoke('write_sync_config', { data: JSON.stringify(config, null, 2) });
}

/**
 * Generate inbox.md content from inbox items (for Claude readability)
 */
export function generateInboxMarkdown(items: InboxItem[]): string {
  const pendingItems = items.filter(i => i.status === 'pending');
  const doneItems = items.filter(i => i.status !== 'pending');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatItem = (item: InboxItem): string => {
    const typeLabel = item.type.toUpperCase();
    const priority = item.priority ? ` [${item.priority}]` : '';
    const project = item.project ? `\n**Project:** @${item.project}` : '';
    const readStatus = item.read ? 'read' : 'unread';

    let md = `### [${typeLabel}] ${item.text}${priority}
**ID:** ${item.id}
**Created:** ${formatDate(item.createdAt)}
**Status:** ${item.status} (${readStatus})${project}

> ${item.author === 'claude' ? 'Claude' : 'User'}: ${item.text}
`;

    if (item.replies.length > 0) {
      md += '\n**Replies:**\n';
      item.replies.forEach(reply => {
        const authorLabel = reply.author === 'claude' ? 'Claude' : 'User';
        md += `> ${authorLabel} (${formatDate(reply.createdAt)}): ${reply.text}\n\n`;
      });
    }

    md += '\n---\n';
    return md;
  };

  let markdown = '# Inbox\n\n';

  if (pendingItems.length > 0) {
    markdown += '## Active Items\n\n';
    pendingItems.forEach(item => {
      markdown += formatItem(item);
    });
  }

  if (doneItems.length > 0) {
    markdown += '\n## Processed Archive\n\n';
    doneItems.slice(0, 10).forEach(item => {
      markdown += formatItem(item);
    });
    if (doneItems.length > 10) {
      markdown += `\n*(${doneItems.length - 10} older items omitted)*\n`;
    }
  }

  return markdown;
}

/**
 * Dev mode dummy document content keyed by filename
 */
function getDevDocContent(lowerName: string, fileName: string, path: string): string {
  if (lowerName.includes('architecture')) {
    return `# Architecture

## Overview

This document describes the technical architecture of the project — a desktop-class application built with **Tauri 2.0** on the backend and **React 18** on the frontend. The system follows a layered architecture with clear separation between the native shell, the UI layer, and data persistence.

## System Diagram

\`\`\`
┌──────────────────────────────────────────────────────────┐
│                    Tauri Window (WebView2)                │
│  ┌────────────────────────────────────────────────────┐  │
│  │               React 18 + Vite                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ Pipeline │ │  Inbox   │ │     Calendar      │  │  │
│  │  │   View   │ │   View   │ │       View        │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │  │
│  │       │             │                │             │  │
│  │  ┌────▼─────────────▼────────────────▼──────────┐  │  │
│  │  │            Zustand Store                     │  │  │
│  │  │  projects | tasks | inbox | activities       │  │  │
│  │  └────────────────────┬─────────────────────────┘  │  │
│  └───────────────────────┼────────────────────────────┘  │
│                          │ invoke()                       │
│  ┌───────────────────────▼────────────────────────────┐  │
│  │              Rust Backend (Tauri)                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │  │
│  │  │  data.rs   │  │  voice.rs  │  │  main.rs    │  │  │
│  │  │ read/write │  │  capture   │  │  app state  │  │  │
│  │  └─────┬──────┘  └────────────┘  └─────────────┘  │  │
│  └────────┼───────────────────────────────────────────┘  │
│           │                                               │
│  ┌────────▼───────────────────────────────────────────┐  │
│  │          ~/.taskboard/  (File System)               │  │
│  │  projects.json │ tasks.json │ inbox.json │ docs/   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
\`\`\`

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Shell** | Tauri 2.0 | Native window, file system, IPC |
| **Frontend** | React 18 | Component UI |
| **Bundler** | Vite 6 | Dev server, HMR, production builds |
| **State** | Zustand | Lightweight global state |
| **Styling** | Tailwind CSS | Utility-first dark theme |
| **Language** | TypeScript 5.x | Type safety across frontend |
| **Backend** | Rust | System-level operations |

## Data Flow

### Read Path
1. App boots → Tauri \`main.rs\` initialises \`AppState\` with data dir
2. React \`useDataLoader\` hook calls \`invoke('read_projects')\`
3. Rust reads \`~/.taskboard/projects.json\` from disk
4. JSON returned to frontend via IPC bridge
5. Zustand store updated → components re-render

### Write Path
1. User action triggers store mutation (e.g. \`updateTask\`)
2. \`useDataLoader\` auto-save effect detects change (500 ms debounce)
3. Serialised JSON sent to Rust via \`invoke('write_tasks', { data })\`
4. Rust writes atomically to disk

## Key Design Decisions

### File-Based Storage
All data lives in \`~/.taskboard/\` as plain JSON and Markdown files. This makes it trivial for Claude Code (or any CLI tool) to read and write project state without a database.

### No Database
Intentionally avoided SQLite or Supabase for this app. The dataset is small (< 50 projects, < 500 tasks) and file-based storage keeps the system inspectable and portable.

### Dual Persistence for Inbox
- \`inbox.json\` — structured data for the app
- \`inbox.md\` — human/Claude-readable markdown generated on every save

### Tauri IPC over Direct FS
Even though Tauri exposes \`tauri-plugin-fs\`, all file operations go through custom Rust commands. This gives us a single place for validation, error handling, and logging.

## Module Map

| Module | Location | Responsibility |
|--------|----------|---------------|
| \`store/index.ts\` | Frontend | Zustand store with all slices |
| \`hooks/useDataLoader.ts\` | Frontend | Load/save data on mount and change |
| \`lib/tauri.ts\` | Frontend | Typed wrappers around \`invoke()\` |
| \`data.rs\` | Backend | File read/write commands |
| \`voice.rs\` | Backend | Audio capture + Whisper integration |
| \`main.rs\` | Backend | App entry, plugin registration |

## Security

- **CSP**: Configured in \`tauri.conf.json\` (currently null for dev)
- **Shell plugin**: Only \`open\` command enabled
- **No network**: App is fully offline — no external API calls from the desktop app
- **Sensitive files**: \`.env\`, credentials excluded via deny rules
`;
  }

  if (lowerName.includes('prd') || lowerName.includes('requirements')) {
    return `# Product Requirements Document

## Vision
A desktop command center that gives developers full visibility into their project portfolio — pipeline status, task tracking, documentation, and inbox — all powered by local files that AI agents can read and write.

## Core Features

### F1: Pipeline View
Kanban-style board with 5 stage columns (Design → Engineering → Build → Launch → Closure). Each project card shows phase, progress, priority badge, and days since last update.

### F2: Quick Launch (Cmd+K)
Command palette with fuzzy search across projects, tasks, and actions. Recent items surfaced first.

### F3: Document Viewer
Browse and edit project Markdown docs inline. Supports approval workflow, voice comments, and AI review badges.

### F4: Inbox
Messaging system with unread badges, reply threads, and structured Markdown export for Claude Code integration.

### F5: Calendar
Weekly timeline showing project activity across Morning / Afternoon / Evening / Night blocks with deep-work detection.

## Non-Functional Requirements

| Metric | Target |
|--------|--------|
| App launch | < 2 s |
| File load | < 100 ms |
| UI response | < 16 ms (60 fps) |
| Memory | < 200 MB |

## Out of Scope (v1)
- Cloud sync
- Multi-user collaboration
- Mobile companion (planned as Orbit)
`;
  }

  if (lowerName.includes('idea') || lowerName.includes('discovery')) {
    return `# Discovery Notes

## Problem Statement
Managing multiple side-projects is chaotic. Context is spread across GitHub, Jira, Notion, and local files. Switching between projects means re-loading mental context every time.

## User Research
- Developers juggle 3-8 projects simultaneously
- Average context-switch cost: 15-25 minutes
- Most existing tools are cloud-first and heavy
- AI coding agents need a local file interface to read/write project state

## Key Insight
A **file-based** system that stores everything in JSON and Markdown gives both humans *and* AI agents a shared interface. No API keys, no sync conflicts, no vendor lock-in.

## Initial Ideas
1. Kanban pipeline view for project stages
2. Voice-to-text inbox for quick capture
3. AI-readable inbox.md for Claude Code sessions
4. Calendar heatmap for work patterns
5. Command palette for fast navigation
`;
  }

  if (lowerName.includes('development-plan') || lowerName.includes('dev-plan')) {
    return `# AnyCalc - Development Plan

---

## Overview

AnyCalc is a comprehensive financial calculator suite built for the Indian market. One workspace, 19+ calculators, covering investments, tax, loans, health, and real estate.

**Core Problem:** Users juggle 5-10 different calculator apps for financial planning. None of them talk to each other, none save your context, and none are designed for Indian tax/investment rules.

**Solution:** A single, elegant workspace with interlinked calculators, persistent data, and India-specific defaults (old/new tax regime, CII indexation, PPF rates, etc.)

---

## Phase 1: Foundation (Dec 15-18)

### 1.1 Project Setup
- [x] Initialize Next.js 14 with App Router
- [x] Configure TypeScript 5.7 strict mode
- [x] Set up Tailwind CSS with custom color palette
- [x] Configure ESLint + Prettier
- [x] Set up project folder structure
- [x] Configure path aliases

### 1.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14 (App Router) | SSR for SEO, file-based routing |
| State | Zustand | Lightweight, no boilerplate, persist middleware |
| Charts | Recharts | React-native, responsive, composable |
| UI Primitives | Radix UI | Accessible, unstyled, composable |
| Auth | Supabase Auth | Google OAuth, magic links, free tier |
| Database | Supabase (PostgreSQL) | Cloud sync, RLS, real-time |
| Styling | Tailwind CSS | Utility-first, dark mode, responsive |

### 1.3 Component Architecture

\`\`\`
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Home / calculator grid
│   └── workspace/
│       └── page.tsx            # Workspace mode
├── components/
│   ├── calculators/
│   │   ├── CalculatorCard.tsx  # Reusable calculator wrapper
│   │   ├── InputField.tsx      # Formatted number input
│   │   ├── ResultDisplay.tsx   # Result with breakdown
│   │   ├── ChartContainer.tsx  # Recharts wrapper
│   │   ├── sip/               # SIP calculator
│   │   ├── fd/                # FD calculator
│   │   ├── tax/               # Tax calculator
│   │   └── ...                # 19 total calculators
│   ├── workspace/
│   │   ├── Sidebar.tsx         # Calculator navigation
│   │   ├── Favorites.tsx       # Pinned calculators
│   │   └── ExportPanel.tsx     # PDF/Excel export
│   └── ui/                     # Shared UI components
├── lib/
│   ├── calculations/           # Pure calculation functions
│   │   ├── investment.ts       # SIP, FD, RD, PPF, CAGR, Lumpsum
│   │   ├── tax.ts              # Old/New regime, HRA, Gratuity
│   │   ├── loan.ts             # EMI, Compound Interest
│   │   ├── realestate.ts       # Capital gains, CII
│   │   └── health.ts           # BMI
│   ├── formatters.ts           # INR formatting, percentage
│   └── constants.ts            # Tax slabs, CII index, PPF rates
├── hooks/
│   ├── useCalculator.ts        # Shared calculator state logic
│   └── useExport.ts            # Export functionality
└── store/
    └── index.ts                # Zustand store (favorites, history, notes)
\`\`\`

---

## Phase 2: Core Calculators (Dec 18 - Jan 5)

### 2.1 Investment Calculators (6)

| Calculator | Features | Dual-Mode | Status |
|-----------|----------|-----------|--------|
| SIP | Growth chart, step-up SIP, goal planner | Yes (Calculate / Plan for Goal) | Done |
| Lumpsum | Maturity breakdown, comparison chart | Yes | Done |
| FD | Interest options (quarterly/monthly/cumulative) | Yes | Done |
| RD | Monthly deposit projections | No | Done |
| PPF | 15-year projection with yearly breakdown | No | Done |
| CAGR | Returns calculator with period comparison | Yes | Done |

**Dual-Mode:** Five calculators support two modes:
1. **Calculate** — Enter inputs, get the result
2. **Plan for Goal** — Enter your target amount, get the required investment

### 2.2 Tax Calculators (4)

| Calculator | Features | Status |
|-----------|----------|--------|
| Income Tax | Old vs New regime comparison, slab visualization | Done |
| HRA Exemption | Metro/non-metro, rent receipt calculator | Done |
| Gratuity | Years of service, last drawn salary | Done |
| TDS | Section-wise TDS rates, threshold check | Done |

### 2.3 Loan Calculators (3)

| Calculator | Features | Status |
|-----------|----------|--------|
| EMI | Amortization schedule, prepayment analysis | Done |
| Compound Interest | Annual/quarterly/monthly compounding | Done |
| Simple Interest | Basic SI calculator | Done |

### 2.4 Utility & Health Calculators (6)

| Calculator | Features | Status |
|-----------|----------|--------|
| Currency Converter | Live rates via API, 150+ currencies | Done |
| Trip Splitter | Multi-person expense splitting | Done |
| Percentage | 3 modes (% of, % change, find %) | Done |
| Age Calculator | Years/months/days with next birthday | Done |
| BMI | WHO categories, visual scale | Done |
| Real Estate CG | STCG/LTCG, CII indexation, Section 54/54EC/54F | Done |

---

## Phase 3: Workspace Features (Jan 5-10)

- [x] Sidebar navigation with calculator categories
- [x] Favorites system (pin frequently used calculators)
- [x] Calculator history (last 10 calculations per type)
- [x] Notes section per calculator
- [x] PDF / Excel / HTML export
- [x] Interlinked calculators (salary → tax, SIP → CAGR)

---

## Phase 4: Real Estate Capital Gains (Jan 10-17)

Most complex calculator — dedicated feature build:

- **Capital gains computation** — STCG (<24 months) and LTCG (>=24 months)
- **CII indexation** — Cost Inflation Index from 2001-02 to 2025-26
- **Reinvestment planner** — Section 54, 54EC, 54F
- **Budget 2024 dual regime** — Old: 20% with indexation vs New: 12.5% without

---

## Phase 5: Testing & Ship (Jan 10-17)

| Metric | Target | Actual |
|--------|--------|--------|
| Lighthouse Performance | >90 | 94 |
| First Contentful Paint | <1.5s | 1.2s |
| Bundle Size (gzipped) | <200KB | 178KB |

**Deployed:** Vercel + [anycalc.in](https://anycalc.in)

---

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| next | Framework | 14.2.x |
| typescript | Language | 5.7.x |
| tailwindcss | Styling | 3.4.x |
| zustand | State management | 4.5.x |
| recharts | Charts & visualizations | 2.12.x |
| @supabase/supabase-js | Auth & database | 2.x |
| jspdf | PDF export | 2.5.x |

---

**Document Version:** 2.0 | **Created:** 2025-12-15 | **Updated:** 2026-01-17
`;
  }

  // Default fallback for any other document
  return `# ${fileName}

> **File Path:** \`${path}\`

---

This is a project document. In the desktop app (Tauri mode), the full file content loads directly from disk.

## Sections

### Overview
Document content would appear here when loaded from the file system.

### Details
Additional content, tables, code blocks, and diagrams from the original Markdown file.

---

*Running in browser dev mode — switch to \`npm run tauri dev\` for live file access.*
`;
}

/**
 * Read a markdown document
 */
export async function readDocument(path: string): Promise<string> {
  if (!isTauri()) {
    // In browser dev mode, return realistic dummy content per document
    const fileName = path.split(/[/\\]/).pop() || path;
    const lowerName = fileName.toLowerCase();
    return getDevDocContent(lowerName, fileName, path);
  }

  return invoke<string>('read_document', { path });
}

/**
 * Write a markdown document
 */
export async function writeDocument(path: string, content: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing document', { path, content });
    return;
  }

  await invoke('write_document', { path, content });
}

// Voice API

/**
 * Check if voice capture is available
 */
export async function checkVoiceAvailable(): Promise<boolean> {
  if (!isTauri()) return false;
  return invoke<boolean>('check_voice_available');
}

/**
 * Capture voice and return transcript
 */
export async function voiceCapture(durationSecs: number): Promise<string> {
  if (!isTauri()) {
    throw new Error('Voice capture not available in browser');
  }

  return invoke<string>('voice_capture', { durationSecs });
}

// External App API

/**
 * Open a folder in VS Code
 */
export async function openInVSCode(path: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Opening in VS Code', path);
    // In dev, try to use window.open with vscode:// protocol
    window.open(`vscode://file/${path}`, '_blank');
    return;
  }

  await invoke('open_in_vscode', { path });
}

/**
 * Open a folder in Claude Code (terminal with claude command)
 */
export async function openInClaudeCode(path: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Opening in Claude Code', path);
    alert(`Would open Claude Code in: ${path}`);
    return;
  }

  await invoke('open_in_claude_code', { path });
}

/**
 * Get project screenshots by scanning the assets folder
 * Default folder: assets/ (configurable)
 * Supported formats: png, jpg, jpeg, gif, webp
 */
export async function getProjectScreenshots(repoPath: string, folder: string = 'assets'): Promise<string[]> {
  if (!isTauri()) {
    // In dev mode, return images from in-memory store
    const projectImages = devImageStore[repoPath]?.[folder] || [];
    console.log(`[tauri] Dev mode: returning ${projectImages.length} images from store`);
    // Return pseudo-paths that getAssetUrl will recognize
    return projectImages.map(img => `dev://${repoPath}/${folder}/${img.name}`);
  }

  try {
    return await invoke<string[]>('get_project_screenshots', { path: repoPath, folder });
  } catch {
    return [];
  }
}

/**
 * Convert a local file path to a Tauri asset URL for display
 */
export function getAssetUrl(path: string): string {
  if (!isTauri()) {
    // In dev mode, check if this is a dev:// pseudo-path
    if (path.startsWith('dev://')) {
      // Extract repoPath, folder, and filename from dev://repoPath/folder/filename
      const withoutProtocol = path.replace('dev://', '');
      const parts = withoutProtocol.split('/');
      const fileName = parts.pop()!;
      const folder = parts.pop()!;
      const repoPath = parts.join('/');

      // Look up the data URL from the store
      const image = devImageStore[repoPath]?.[folder]?.find(img => img.name === fileName);
      if (image) {
        return image.dataUrl;
      }
    }
    // Fallback for browser (won't work due to security)
    return `file:///${path.replace(/\\/g, '/')}`;
  }
  // Tauri asset protocol - allows loading local files
  return `asset://localhost/${path.replace(/\\/g, '/')}`;
}

/**
 * Upload an image to the project's assets folder
 * Returns the full path of the saved file
 */
export async function uploadProjectImage(
  repoPath: string,
  folder: string,
  fileName: string,
  base64Data: string
): Promise<string> {
  if (!isTauri()) {
    // In dev mode, store in memory
    if (!devImageStore[repoPath]) {
      devImageStore[repoPath] = {};
    }
    if (!devImageStore[repoPath][folder]) {
      devImageStore[repoPath][folder] = [];
    }

    // Determine MIME type from file extension
    const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/png';

    // Reconstruct full data URL for display
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Add to store (or replace if exists)
    const existingIndex = devImageStore[repoPath][folder].findIndex(img => img.name === fileName);
    if (existingIndex >= 0) {
      devImageStore[repoPath][folder][existingIndex] = { name: fileName, dataUrl };
    } else {
      devImageStore[repoPath][folder].push({ name: fileName, dataUrl });
    }

    console.log(`[tauri] Dev mode: stored image ${fileName} (total: ${devImageStore[repoPath][folder].length})`);
    return `dev://${repoPath}/${folder}/${fileName}`;
  }

  return invoke<string>('upload_project_image', {
    path: repoPath,
    folder,
    fileName,
    base64Data,
  });
}

/**
 * Add an image reference to the project's README.md
 * Inserts the image in the screenshots section or creates one
 */
export async function addImageToReadme(
  repoPath: string,
  imagePath: string,
  altText: string
): Promise<void> {
  if (!isTauri()) {
    console.log(`[tauri] Would add image to README: ${imagePath}`);
    return;
  }

  await invoke('add_image_to_readme', {
    path: repoPath,
    imagePath,
    altText,
  });
}

/**
 * Delete an image from the project's assets folder
 */
export async function deleteProjectImage(imagePath: string): Promise<void> {
  if (!isTauri()) {
    // In dev mode, remove from memory store
    if (imagePath.startsWith('dev://')) {
      const withoutProtocol = imagePath.replace('dev://', '');
      const parts = withoutProtocol.split('/');
      const fileName = parts.pop()!;
      const folder = parts.pop()!;
      const repoPath = parts.join('/');

      if (devImageStore[repoPath]?.[folder]) {
        devImageStore[repoPath][folder] = devImageStore[repoPath][folder].filter(
          img => img.name !== fileName
        );
        console.log(`[tauri] Dev mode: deleted image ${fileName}`);
      }
    }
    return;
  }

  await invoke('delete_project_image', { path: imagePath });
}
