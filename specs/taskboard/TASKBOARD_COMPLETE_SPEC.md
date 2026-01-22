# Arun's Task Board - Complete System Specification

> **Version:** 1.0.0  
> **Author:** Arun Prakash  
> **Date:** January 2026  
> **Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Data Layer](#3-data-layer)
4. [Agent Orchestration](#4-agent-orchestration)
5. [Command Center Integration](#5-command-center-integration)
6. [Project Status System](#6-project-status-system)
7. [Task Generation Rules](#7-task-generation-rules)
8. [File Structure](#8-file-structure)
9. [Implementation Guide](#9-implementation-guide)
10. [Agent Instructions Template](#10-agent-instructions-template)

---

## 1. Executive Summary

### 1.1 What is Task Board?

A **file-based project orchestration system** that:
- Tracks projects through a 15-stage pipeline
- Manages tasks via JSON files (no database)
- Enables AI agents to read/write project state directly
- Integrates with Command Center as the primary UI
- Provides complete traceability from idea to shipped product

### 1.2 Core Principles

| Principle | Implementation |
|-----------|---------------|
| **Single Source of Truth** | All state in `projects.json` and `tasks.json` |
| **Agent-Native** | Claude reads/writes files directly |
| **Zero Integration Friction** | No APIs, no MCP, no setup |
| **Forced Documentation** | Every stage produces artifacts |
| **Lightweight** | No cloud, works offline, Git-friendly |

### 1.3 Key Components

```
COMMAND CENTER (Tauri App)
         │
         ▼
    DATA LAYER (JSON/MD Files)
         │
         ▼
   AGENT ORCHESTRATOR
         │
    ┌────┴────┐
    ▼         ▼
SPECIALIST AGENTS
(Design, Architect, Dev, Git, QA, Docs)
```

---

## 2. System Architecture

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER (Arun)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                     │                              │
                     │ uses                         │ writes
                     ▼                              ▼
┌─────────────────────────────┐     ┌─────────────────────────────────────┐
│      COMMAND CENTER         │     │            inbox.md                  │
│      (Tauri Desktop)        │     │      (async instructions)           │
│                             │     └─────────────────────────────────────┘
│  • Quick Launch (⌘K)        │                     │
│  • Pipeline Kanban View     │                     │
│  • Project Status View      │                     │
│  • Task Management          │                     │
│  • Agent Invocation         │                     │
└─────────────────────────────┘                     │
          │                                         │
          │ reads/writes                            │ read by
          ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FILE SYSTEM                                    │
│                    (Single Source of Truth)                             │
│                                                                         │
│  projects.json ──── tasks.json ──── inbox.md ──── agent-actions.log    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
          │                                         │
          │ read by                                 │ read/write
          ▼                                         ▼
┌─────────────────────────────┐     ┌─────────────────────────────────────┐
│     PORTFOLIO WEBSITE       │     │         CLAUDE AGENTS               │
│   (fetches from GitHub)     │     │   (invoked by Command Center)       │
│                             │     │                                     │
│  • Reads LAUNCHPAD block    │     │  • Design Agent                     │
│  • Auto-updates on push     │     │  • Architect Agent                  │
└─────────────────────────────┘     │  • Dev Agent                        │
                                    │  • Git Agent                        │
                                    │  • QA Agent                         │
                                    │  • Docs Agent                       │
                                    └─────────────────────────────────────┘
```

### 2.2 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Desktop App** | Tauri 2.0 + Rust | 3MB binary, native performance |
| **Frontend** | React 18 + TypeScript | Familiar, ecosystem |
| **Styling** | Tailwind CSS | Utility-first, dark theme |
| **State** | Zustand | Minimal, no boilerplate |
| **File Operations** | Tauri FS API | Native file access |
| **File Watching** | notify (Rust) | Real-time updates |
| **Markdown Rendering** | react-markdown | Built-in doc viewer |
| **Data Storage** | JSON + Markdown | Human readable, Git-friendly |

---

## 3. Data Layer

### 3.1 Central Storage

```
~/arun-task-board/
├── config.json              # Global configuration
├── projects.json            # All projects metadata (SINGLE SOURCE OF TRUTH)
├── tasks.json               # All tasks across projects
├── inbox.md                 # Async agent instructions
├── agent-actions.log        # Agent activity log
├── agents/                  # Agent instruction files
│   ├── orchestrator.md
│   ├── design-agent.md
│   ├── architect-agent.md
│   ├── dev-agent.md
│   ├── git-agent.md
│   ├── qa-agent.md
│   └── docs-agent.md
├── templates/               # Document templates
└── AGENT_INSTRUCTIONS.md    # Master agent instructions
```

### 3.2 projects.json Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-18T10:30:00Z",
  "projects": [
    {
      "id": "taskboard",
      "name": "Arun's Task Board",
      "description": "File-based project orchestration",
      "repoPath": "~/Projects/taskboard",
      "githubUrl": "https://github.com/ArunPrakashG/taskboard",
      
      "stage": "build",
      "stageStatus": "in-progress",
      "currentPhase": "development",
      
      "priority": "P1",
      "complexity": "F",
      "progress": 65,
      
      "targetDate": "2026-02-15",
      "startedAt": "2026-01-10T00:00:00Z",
      "createdAt": "2026-01-10T00:00:00Z",
      "lastUpdated": "2026-01-18T10:30:00Z",
      "completedAt": null,
      
      "tags": ["desktop", "productivity", "tauri"],
      "techStack": ["Tauri", "React", "TypeScript"],
      
      "links": {
        "github": "https://github.com/ArunPrakashG/taskboard",
        "docs": null,
        "live": null
      },
      
      "metrics": {
        "totalTasks": 24,
        "completedTasks": 15,
        "blockedTasks": 1
      },
      
      "stageHistory": [
        { "stage": "design", "enteredAt": "2026-01-10T00:00:00Z", "completedAt": "2026-01-12T00:00:00Z" },
        { "stage": "engineering", "enteredAt": "2026-01-12T00:00:00Z", "completedAt": "2026-01-15T00:00:00Z" },
        { "stage": "build", "enteredAt": "2026-01-15T00:00:00Z", "completedAt": null }
      ]
    }
  ]
}
```

### 3.3 tasks.json Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-18T10:30:00Z",
  "tasks": [
    {
      "id": "t-20260118-a1b2",
      "projectId": "taskboard",
      
      "title": "Build Pipeline kanban view",
      "description": "Create the main dashboard view with drag-drop between stages",
      
      "stage": "build",
      "phase": "development",
      "status": "in-progress",
      
      "priority": "P0",
      "complexity": "L",
      
      "assignee": "claude",
      "assignedAgent": "dev-agent",
      
      "dueDate": "2026-01-20",
      "startedAt": "2026-01-18T08:00:00Z",
      "createdAt": "2026-01-15T00:00:00Z",
      "updatedAt": "2026-01-18T10:30:00Z",
      "completedAt": null,
      
      "dependencies": [],
      "linkedDocs": [".taskboard/docs/2-engineering/ARCHITECTURE.md"],
      
      "subtasks": [
        { "id": "st-001", "title": "Set up Kanban grid", "completed": true },
        { "id": "st-002", "title": "Create project card", "completed": true },
        { "id": "st-003", "title": "Implement drag-drop", "completed": false }
      ],
      
      "tags": ["feature", "ui"],
      
      "comments": [
        {
          "id": "c-001",
          "author": "arun",
          "text": "Use react-beautiful-dnd for drag-drop",
          "timestamp": "2026-01-16T09:00:00Z"
        }
      ],
      
      "createdBy": "agent",
      "sourceDoc": ".taskboard/docs/2-engineering/ARCHITECTURE.md"
    }
  ]
}
```

### 3.4 inbox.md Format

```markdown
# Inbox

Quick instructions for agents. Write here anytime.

---

## 2026-01-18

- Move taskboard pipeline task to review
- Create task for taskboard: Add keyboard shortcuts (P2)
- P0 the file watcher task
- Research Whisper alternatives for tradevoice

## 2026-01-17

- [DONE] Update tradevoice to architecture stage
- [DONE] Create tasks from ARCHITECTURE.md
- [SKIPPED] Look into Tauri 2.1 beta - staying on 2.0

---

## Instruction Patterns

- Move {PROJECT} {TASK} to {STATUS}
- Create task for {PROJECT}: {TITLE} (P1)
- P0/P1/P2 the {TASK}
- Add comment to {TASK}: {TEXT}
- {PROJECT} is now in {STAGE}
```

---

## 4. Agent Orchestration

### 4.1 Agent Types

| Agent | Responsibility | Invoked When |
|-------|---------------|--------------|
| **Orchestrator** | Parse inbox, route to agents, coordinate | Always first |
| **Design Agent** | idea.md, discovery.md, APP_PRD.md | Stage: design |
| **Architect Agent** | ARCHITECTURE.md, technical research | Stage: engineering |
| **Dev Agent** | Write code, implement features | Stage: build, Phase: development |
| **Git Agent** | Commits, pushes, branch management | Any git operation |
| **QA Agent** | TEST_CASES.md, run tests | Stage: build, Phase: testing |
| **Docs Agent** | README, CHANGELOG, WALKTHROUGH | Stage: launch/closure |

### 4.2 Agent Routing Logic

```typescript
function selectAgent(context: TaskContext): AgentType {
  // Git operations always go to git-agent
  if (context.action?.includes('git') || context.action?.includes('commit')) {
    return 'git-agent';
  }
  
  // Stage-based routing
  switch (context.stage) {
    case 'design':
      return 'design-agent';
    case 'engineering':
      return context.phase === 'qa-planning' ? 'qa-agent' : 'architect-agent';
    case 'build':
      return context.phase === 'testing' ? 'qa-agent' : 'dev-agent';
    case 'launch':
    case 'closure':
      return 'docs-agent';
    default:
      return 'orchestrator';
  }
}
```

### 4.3 Agent Invocation Flow

```
1. User runs command: `agent work taskboard`
   
2. Command Center:
   - Loads project context from projects.json
   - Loads tasks from tasks.json
   - Determines agent: dev-agent (project is in build stage)
   - Loads agent instructions from agents/dev-agent.md
   - Builds complete prompt with context
   - Copies to clipboard
   - Opens Claude

3. Claude Session:
   - Receives full context + instructions
   - Reads current task
   - Implements solution
   - Updates tasks.json
   - Logs to agent-actions.log
   - Reports completion

4. User returns to Command Center:
   - File watcher detects changes
   - UI updates automatically
```

---

## 5. Command Center Integration

### 5.1 Complete Command Reference

| Command | Description | Agent Invoked |
|---------|-------------|---------------|
| **Project Commands** | | |
| `newproject` | Create project with Task Board setup | - |
| `open <proj>` | Open in VS Code | - |
| `status <proj>` | Show project status modal | - |
| `where` | Show all active project statuses | - |
| **Task Board Commands** | | |
| `inbox` | Open inbox.md | - |
| `inbox add <text>` | Add to inbox | - |
| `tasks [proj]` | List tasks | - |
| `task new <proj> <title>` | Create task | - |
| `task done <id>` | Complete task | - |
| `stage <proj> next` | Move to next stage | - |
| `pipeline` | Open kanban view | - |
| **Agent Commands** | | |
| `agent start` | Open Claude with context | orchestrator |
| `agent inbox` | Process inbox | orchestrator |
| `agent work [proj]` | Work on tasks | auto-selected |
| `agent design <proj>` | Design work | design-agent |
| `agent architect <proj>` | Architecture work | architect-agent |
| `agent dev <proj>` | Development work | dev-agent |
| `agent git <proj>` | Git operations | git-agent |
| `agent qa <proj>` | Testing work | qa-agent |
| `agent docs <proj>` | Documentation | docs-agent |
| **Git Shortcuts** | | |
| `commit <proj> [msg]` | Commit changes | git-agent |
| `push <proj>` | Push to remote | git-agent |
| `pull <proj>` | Pull from remote | git-agent |

### 5.2 Quick Launch UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ⌘  Type a command or search...                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMMANDS                                                       │
│  📁 newproject          Create new project                      │
│  📊 status              Show project status                     │
│  📥 inbox               Open inbox for quick notes              │
│  🤖 agent work          Work on tasks with Claude               │
│                                                                 │
│  PROJECTS                                                       │
│  📁 taskboard           build • 65%                             │
│  📁 tradevoice          engineering • 45%                       │
│                                                                 │
│  TASKS (P0)                                                     │
│  ✅ Build Pipeline view  taskboard • in-progress                │
│  ✅ File watcher         taskboard • todo                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ↑↓ Navigate  ↵ Select  ESC Close                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Project Status System

### 6.1 Single Source of Truth

**IMPORTANT:** Project status is ONLY stored in `projects.json`. 

The README LAUNCHPAD block is a **mirror** that gets updated on git push for portfolio consumption.

```
projects.json (TRUTH)
       │
       ├──► Command Center (reads)
       ├──► Agents (read/write)
       └──► README LAUNCHPAD (mirror on push)
                    │
                    └──► Portfolio (fetches from GitHub)
```

### 6.2 "Where Are We" Command

The `where` command (aliases: `wherearewe`, `waw`) shows formatted status of all active projects.

**Output Format:**

```
═══════════════════════════════════════════════════════════════
  📊 PROJECT STATUS REPORT
  Generated: January 18, 2026 10:30 AM
═══════════════════════════════════════════════════════════════

  SUMMARY
  ────────
  Active Projects: 3
  Blocked: 1

  BY STAGE: design(1) │ engineering(1) │ build(1)

  ┌────────────────────────────────────────────────────────────┐
  │ 🔨 Arun's Task Board                              🟠 P1   │
  ├────────────────────────────────────────────────────────────┤
  │ Stage: BUILD           Progress: ██████░░░░ 65%           │
  │ 🔄 Working: Build Pipeline kanban view                    │
  │ 📅 Target: 2026-02-15 (28d left)                          │
  └────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────┐
  │ 🏗️ Trade Voice                                    🟠 P1   │
  ├────────────────────────────────────────────────────────────┤
  │ Stage: ENGINEERING     Progress: ████░░░░░░ 45%           │
  │ 🚫 BLOCKED: WhisperClient needs API key                   │
  │ 📅 Target: 2026-02-28 (41d left)                          │
  └────────────────────────────────────────────────────────────┘
```

### 6.3 README LAUNCHPAD Block

Updated automatically on `git push` or manually via `agent git`:

```markdown
<!-- LAUNCHPAD:START
{
  "stage": "build",
  "stageStatus": "in-progress",
  "progress": 65,
  "priority": "P1",
  "lastUpdated": "2026-01-18T10:30:00Z",
  "tasksTotal": 24,
  "tasksCompleted": 15
}
LAUNCHPAD:END -->
```

---

## 7. Task Generation Rules

### 7.1 When Tasks Are Generated

| Stage Completed | Document Created | Tasks Generated |
|-----------------|-----------------|-----------------|
| Conception | idea.md | 0-2 research tasks |
| Discovery | discovery.md | 0-3 research tasks |
| Requirements | APP_PRD.md | 5-15 feature tasks |
| Architecture | ARCHITECTURE.md | 10-30 technical tasks |
| QA Planning | TEST_CASES.md | 5-15 test tasks |
| Review | review-notes.md | 1-10 revision tasks |
| Development | dev-log.md | Bug/refactor tasks as discovered |
| Testing | test-results.md | Bug fix tasks |

### 7.2 Task Creation Template

```json
{
  "id": "t-{YYYYMMDD}-{random4}",
  "projectId": "{project-id}",
  "title": "{Verb} {specific noun}",
  "description": "{What + Acceptance criteria}",
  "stage": "{appropriate stage}",
  "phase": "{appropriate phase}",
  "status": "todo",
  "priority": "P0|P1|P2|P3",
  "complexity": "XS|S|M|L|XL",
  "assignee": "claude",
  "assignedAgent": "{appropriate-agent}",
  "linkedDocs": ["{source document}"],
  "subtasks": [],
  "tags": ["{appropriate tags}"],
  "createdBy": "agent",
  "sourceDoc": "{document that spawned this task}"
}
```

### 7.3 Priority Guidelines

| Priority | Meaning | Examples |
|----------|---------|----------|
| **P0** | Blocking, critical | Build failing, security issue |
| **P1** | Important, this sprint | Core features, significant bugs |
| **P2** | Normal, when possible | Nice-to-haves, minor improvements |
| **P3** | Backlog, future | Ideas, tech debt |

### 7.4 Complexity Guidelines

| Complexity | Time | Examples |
|------------|------|----------|
| **XS** | < 1 hour | Config change, small fix |
| **S** | 1-4 hours | Single function |
| **M** | 4-8 hours | Feature module |
| **L** | 1-3 days | Complex feature |
| **XL** | 3+ days | Major system |

---

## 8. File Structure

### 8.1 Per-Project Structure

```
~/Projects/{project-name}/
├── .taskboard/
│   └── docs/
│       ├── 1-design/
│       │   ├── idea.md
│       │   ├── discovery.md
│       │   └── APP_PRD.md
│       ├── 2-engineering/
│       │   ├── ARCHITECTURE.md
│       │   ├── TEST_CASES.md
│       │   └── review-notes.md
│       ├── 3-build/
│       │   ├── dev-log.md
│       │   ├── test-results.md
│       │   └── staging-checklist.md
│       ├── 4-launch/
│       │   ├── deployment.md
│       │   ├── linkedin-post.md
│       │   └── WALKTHROUGH.md
│       └── 5-closure/
│           ├── portfolio-entry.md
│           └── retro.md
├── README.md          # Contains LAUNCHPAD block
├── src/               # Source code
└── ...
```

### 8.2 15-Stage Pipeline

```
PHASE 1: DESIGN
├── Conception    → idea.md
├── Discovery     → discovery.md
└── Requirements  → APP_PRD.md

PHASE 2: ENGINEERING
├── Architecture  → ARCHITECTURE.md
├── QA Planning   → TEST_CASES.md
└── Review        → review-notes.md

PHASE 3: BUILD
├── Development   → dev-log.md
├── Testing       → test-results.md
└── Staging       → staging-checklist.md

PHASE 4: LAUNCH
├── Ship          → deployment.md
├── Announce      → linkedin-post.md
└── Walkthrough   → WALKTHROUGH.md

PHASE 5: CLOSURE
├── Documentation → README.md, CHANGELOG.md
├── Portfolio     → portfolio-entry.md
└── Retrospective → retro.md
```

---

## 9. Implementation Guide

### 9.1 Setup Steps

1. **Create Central Storage**
   ```bash
   mkdir -p ~/arun-task-board/agents
   mkdir -p ~/arun-task-board/templates
   ```

2. **Initialize Config Files**
   - Create config.json with preferences
   - Create empty projects.json and tasks.json
   - Create inbox.md with template

3. **Copy Agent Instructions**
   - Save each agent .md file to ~/arun-task-board/agents/
   - Save AGENT_INSTRUCTIONS.md

4. **Set Up Command Center**
   - Create Tauri project
   - Implement Quick Launch
   - Implement Pipeline View
   - Implement file watchers

5. **Test Agent Invocation**
   - Run `agent start`
   - Verify context is complete
   - Test with simple instruction

### 9.2 Implementation Order

```
Week 1-2: MVP
├── Central JSON files
├── Basic Tauri shell
├── Pipeline kanban view
├── File read/write
└── File watcher

Week 3-4: Core Features
├── Quick Launch commands
├── Task management
├── Agent invocation
├── Inbox processing
└── Status views

Week 5-6: Polish
├── All agent types
├── Git integration
├── README LAUNCHPAD sync
├── Keyboard shortcuts
└── Dark/light theme
```

---

## 10. Agent Instructions Template

This is the master template to paste into Claude for any session.

---


### Master Agent Instructions

```markdown
# Agent Instructions: Arun's Task Board

You are an AI development agent working on Arun's projects. Follow these instructions.

## FIRST STEPS (Always)

1. Read ~/arun-task-board/inbox.md for pending instructions
2. Read ~/arun-task-board/projects.json for project state
3. Read ~/arun-task-board/tasks.json for task state
4. Process unmarked inbox items FIRST
5. Then proceed with the main task

## FILE LOCATIONS

Central: ~/arun-task-board/
- config.json, projects.json, tasks.json, inbox.md, agent-actions.log

Per-Project: ~/Projects/{name}/.taskboard/docs/
- 1-design/, 2-engineering/, 3-build/, 4-launch/, 5-closure/

## WORKING ON TASKS

### Before Starting
1. Update task status to "in-progress"
2. Add comment: "Starting work"
3. Log to agent-actions.log

### While Working
1. Update subtasks as completed
2. Add progress comments
3. If blocked, set status "blocked" + explain

### After Completing
1. Update status to "completed"
2. Set completedAt timestamp
3. Add summary comment
4. Update project progress
5. Log action
6. Check if stage can advance

## CREATING TASKS

After creating stage documents, generate tasks:

- APP_PRD.md → 1 task per feature
- ARCHITECTURE.md → 1 task per component
- TEST_CASES.md → 1 task per test group
- review-notes.md → 1 task per change request

Task format:
{
  "id": "t-{YYYYMMDD}-{random4}",
  "title": "{Verb} {noun}",
  "description": "{What + acceptance criteria}",
  "priority": "P0|P1|P2|P3",
  "complexity": "XS|S|M|L|XL",
  "assignedAgent": "{agent-type}",
  "linkedDocs": ["{source}"],
  "createdBy": "agent"
}

## PROCESSING INBOX

Parse patterns:
- "Move {TASK} to {STATUS}" → Update task
- "Create task for {PROJECT}: {TITLE}" → Create task
- "P0/P1/P2 the {TASK}" → Update priority
- "{PROJECT} to {STAGE}" → Update project stage

After processing:
- Change `- instruction` to `- [DONE] instruction`
- Or `- [SKIPPED] instruction - reason`

## LOGGING

Append to agent-actions.log:
```
{timestamp} | {agent} | {category} | {action}
```

Categories: inbox, task, project, create, error

## STATUS UPDATES

Update projects.json when:
- Stage changes
- Progress changes (recalculate from tasks)
- Task counts change

Calculate progress:
```
progress = (completedTasks / totalTasks) * 100
```

## SESSION END CHECKLIST

- [ ] All inbox items processed
- [ ] Task statuses accurate
- [ ] Comments added
- [ ] Progress updated
- [ ] Actions logged
- [ ] Summary provided

## PREFERENCES (Arun)

- Dark theme
- TypeScript over JavaScript
- Tauri over Electron
- Tailwind for styling
- Zustand for state
- Indian stock symbols: NSE/BSE
- Timezone: Asia/Singapore
```

---

## Quick Reference Card

### Commands Cheat Sheet

```
# Projects
newproject              Create new project
status <proj>           Show status
where                   All active statuses

# Tasks
inbox                   Open inbox
inbox add <text>        Quick add
tasks [proj]            List tasks
task done <id>          Complete task

# Agents
agent start             Full context session
agent work [proj]       Work on tasks
agent design <proj>     Design agent
agent dev <proj>        Dev agent
agent git <proj>        Git agent

# Git Shortcuts
commit <proj>           Commit changes
push <proj>             Push to remote
```

### File Paths

```
~/arun-task-board/
├── projects.json       # Project state
├── tasks.json          # Task state
├── inbox.md            # Instructions
├── agents/*.md         # Agent instructions
└── agent-actions.log   # Activity log

~/Projects/{name}/.taskboard/docs/
├── 1-design/           # idea, discovery, PRD
├── 2-engineering/      # architecture, tests, review
├── 3-build/            # dev-log, test-results
├── 4-launch/           # deployment, announce
└── 5-closure/          # docs, portfolio, retro
```

### Status Flow

```
Task:    todo → in-progress → review → completed
                           ↘ blocked

Project: design → engineering → build → launch → closure
```

### Priority

```
P0 = 🔴 Critical (do NOW)
P1 = 🟠 Important (this sprint)
P2 = 🟡 Normal (when possible)
P3 = ⚪ Backlog (future)
```

---

## Appendix: Agent Files to Create

Create these files in `~/arun-task-board/agents/`:

1. `orchestrator.md` - Main coordinator
2. `design-agent.md` - Design phase specialist
3. `architect-agent.md` - Architecture specialist  
4. `dev-agent.md` - Development specialist
5. `git-agent.md` - Git operations
6. `qa-agent.md` - Testing specialist
7. `docs-agent.md` - Documentation specialist

Each file should contain:
- Agent responsibilities
- Document templates
- Task generation rules
- Working procedures
- Handoff instructions

---

**END OF SPECIFICATION**

To implement, open this file in VS Code and invoke Claude with:

"Read this specification and help me implement the Task Board system. Start by creating the folder structure and initial JSON files."
