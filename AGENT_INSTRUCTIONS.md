# Agent Instructions: Arun's Task Board

You are an AI development agent working on Arun's projects. Follow these instructions.

---

## FIRST STEPS (Always)

1. Read `~/arun-task-board/inbox.md` for pending instructions
2. Read `~/arun-task-board/projects.json` for project state
3. Read `~/arun-task-board/tasks.json` for task state
4. Process unmarked inbox items FIRST
5. Then proceed with the main task

---

## FILE LOCATIONS

### Central (Single Source of Truth)
```
~/arun-task-board/
├── config.json          # Global configuration
├── projects.json        # All projects metadata
├── tasks.json           # All tasks across projects
├── inbox.md             # Async instructions
├── agent-actions.log    # Activity log
├── AGENT_INSTRUCTIONS.md # This file
└── agents/              # Task Board prompt templates
    ├── orchestrator.md
    ├── design-agent.md
    ├── architect-agent.md
    ├── dev-agent.md
    ├── git-agent.md
    ├── qa-agent.md
    └── docs-agent.md
```

### Per-Project Structure
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
├── README.md              # Contains LAUNCHPAD block
└── src/                   # Source code
```

### Related: Claude SDK Agents
```
~/_claude-shared/agents/
├── designer.md      # @designer - Requirements gathering
├── architect.md     # @architect - PRD & architecture
├── qa.md            # @qa - Test plan creation
└── walkthrough.md   # @walkthrough - Code documentation
```

---

## WORKING ON TASKS

### Before Starting
1. Update task status to `"in-progress"`
2. Add comment: `"Starting work"`
3. Log to agent-actions.log

### While Working
1. Update subtasks as completed
2. Add progress comments
3. If blocked, set status `"blocked"` + explain

### After Completing
1. Update status to `"completed"`
2. Set `completedAt` timestamp
3. Add summary comment
4. Update project progress
5. Log action
6. Check if stage can advance

---

## CREATING TASKS

After creating stage documents, generate tasks:

| Document | Tasks Generated |
|----------|-----------------|
| APP_PRD.md | 1 task per feature |
| ARCHITECTURE.md | 1 task per component |
| TEST_CASES.md | 1 task per test group |
| review-notes.md | 1 task per change request |

### Task Format
```json
{
  "id": "t-{YYYYMMDD}-{random4}",
  "projectId": "{project-id}",
  "title": "{Verb} {noun}",
  "description": "{What + acceptance criteria}",
  "stage": "{appropriate stage}",
  "phase": "{appropriate phase}",
  "status": "todo",
  "priority": "P0|P1|P2|P3",
  "complexity": "XS|S|M|L|XL",
  "assignee": "claude",
  "assignedAgent": "{appropriate-agent}",
  "dueDate": null,
  "startedAt": null,
  "createdAt": "{ISO timestamp}",
  "updatedAt": "{ISO timestamp}",
  "completedAt": null,
  "dependencies": [],
  "linkedDocs": ["{source document}"],
  "subtasks": [],
  "tags": ["{appropriate tags}"],
  "comments": [],
  "createdBy": "agent",
  "sourceDoc": "{document that spawned this task}"
}
```

---

## PROCESSING INBOX

### Pattern Recognition
- `"Move {TASK} to {STATUS}"` → Update task
- `"Create task for {PROJECT}: {TITLE}"` → Create task
- `"P0/P1/P2 the {TASK}"` → Update priority
- `"{PROJECT} to {STAGE}"` → Update project stage
- `"Add comment to {TASK}: {TEXT}"` → Add comment

### After Processing
- Change `- instruction` to `- [DONE] instruction`
- Or `- [SKIPPED] instruction - reason`

---

## LOGGING

Append to agent-actions.log:
```
{timestamp} | {agent} | {category} | {action}
```

**Categories:** `inbox`, `task`, `project`, `create`, `error`

**Examples:**
```
2026-01-18T10:30:00Z | orchestrator | inbox | Processed 3 inbox items
2026-01-18T10:31:00Z | dev-agent | task | Started t-20260118-a1b2: Build Pipeline view
2026-01-18T14:00:00Z | dev-agent | task | Completed t-20260118-a1b2
2026-01-18T14:01:00Z | git-agent | project | Pushed taskboard to origin/main
```

---

## STATUS UPDATES

### Update projects.json when:
- Stage changes
- Progress changes (recalculate from tasks)
- Task counts change

### Calculate Progress
```
progress = (completedTasks / totalTasks) * 100
```

### Stage Flow
```
design → engineering → build → launch → closure
```

### Task Status Flow
```
todo → in-progress → review → completed
                  ↘ blocked
```

---

## AGENT ROUTING

| Stage | Phase | Agent |
|-------|-------|-------|
| design | conception | design-agent |
| design | discovery | design-agent |
| design | requirements | design-agent |
| engineering | architecture | architect-agent |
| engineering | qa-planning | qa-agent |
| engineering | review | architect-agent |
| build | development | dev-agent |
| build | testing | qa-agent |
| build | staging | dev-agent |
| launch | ship | docs-agent |
| launch | announce | docs-agent |
| launch | walkthrough | docs-agent |
| closure | documentation | docs-agent |
| closure | portfolio | docs-agent |
| closure | retrospective | docs-agent |
| any | git operations | git-agent |

---

## PRIORITY GUIDELINES

| Priority | Meaning | Examples |
|----------|---------|----------|
| **P0** | Blocking, critical | Build failing, security issue |
| **P1** | Important, this sprint | Core features, significant bugs |
| **P2** | Normal, when possible | Nice-to-haves, minor improvements |
| **P3** | Backlog, future | Ideas, tech debt |

---

## COMPLEXITY GUIDELINES

| Complexity | Scope | Examples |
|------------|-------|----------|
| **XS** | Config change, small fix | < 1 hour |
| **S** | Single function/component | 1-4 hours |
| **M** | Feature module | 4-8 hours |
| **L** | Complex feature | 1-3 days |
| **XL** | Major system | 3+ days |

---

## SESSION END CHECKLIST

- [ ] All inbox items processed
- [ ] Task statuses accurate
- [ ] Comments added to tasks
- [ ] Progress updated in projects.json
- [ ] Actions logged to agent-actions.log
- [ ] Summary provided to user

---

## PREFERENCES (Arun)

- Dark theme
- TypeScript over JavaScript
- Tauri over Electron
- Tailwind for styling
- Zustand for state
- Supabase for database
- Next.js App Router
- Mobile-first design
- Indian stock symbols: NSE/BSE
- Timezone: Asia/Singapore

---

## QUICK REFERENCE

### Commands
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
```

---

*"Done is better than perfect." — Move fast, ship often.*
