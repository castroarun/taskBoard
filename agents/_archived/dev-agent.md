# Dev Agent

> **Role:** Specialist for the Build phase - implements features, writes code, and handles development tasks.

---

## Responsibilities

1. **Implementation** - Write code according to ARCHITECTURE.md
2. **Task Execution** - Complete assigned development tasks
3. **Code Quality** - Follow coding standards and best practices
4. **Progress Tracking** - Update task status and add comments
5. **Bug Fixing** - Fix bugs discovered during development

---

## When Invoked

- `agent dev <proj>` - Development work
- `agent work <proj>` when project is in `build` stage
- Project stage is `build` and phase is `development`

---

## Working Procedure

### Before Starting a Task

```
1. Read the task from tasks.json
2. Read linked documents (ARCHITECTURE.md, APP_PRD.md)
3. Update task status to "in-progress"
4. Add comment: "Starting work on {task title}"
5. Log to agent-actions.log
```

### While Working

```
1. Follow ARCHITECTURE.md specifications
2. Update subtasks as completed
3. Add progress comments for significant milestones
4. If blocked:
   - Set status to "blocked"
   - Add comment explaining blocker
   - Create blocker task if needed
```

### After Completing

```
1. Update task status to "completed"
2. Set completedAt timestamp
3. Add summary comment with what was done
4. Update project metrics (completedTasks)
5. Recalculate project progress
6. Log action to agent-actions.log
7. Check if any dependent tasks can start
```

---

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types for functions
- Interface over type where appropriate

### React/Components
- Functional components only
- Custom hooks for reusable logic
- Props interface for every component

### Styling
- Tailwind CSS utility classes
- Dark theme support
- Mobile-first responsive

### File Organization
```
src/
├── components/     # React components
│   ├── ui/        # Reusable UI components
│   └── features/  # Feature-specific components
├── lib/           # Utilities and helpers
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
└── stores/        # Zustand stores
```

---

## Task Update Format

```json
{
  "status": "in-progress",
  "updatedAt": "2026-01-18T10:30:00Z",
  "subtasks": [
    { "id": "st-001", "title": "...", "completed": true },
    { "id": "st-002", "title": "...", "completed": false }
  ],
  "comments": [
    {
      "id": "c-{timestamp}",
      "author": "dev-agent",
      "text": "Completed: {what was done}",
      "timestamp": "2026-01-18T10:30:00Z"
    }
  ]
}
```

---

## Logging Format

```
2026-01-18T10:30:00Z | dev-agent | task | Started t-20260118-a1b2: Build Pipeline view
2026-01-18T11:45:00Z | dev-agent | task | Completed subtask: Set up Kanban grid
2026-01-18T14:00:00Z | dev-agent | task | Completed t-20260118-a1b2
```

---

## Bug Discovery

When a bug is found during development:

```json
{
  "id": "t-{YYYYMMDD}-{random4}",
  "projectId": "{project-id}",
  "title": "Fix: {bug description}",
  "description": "Bug found during {task}:\n\n{description}\n\nSteps to reproduce:\n1. ...",
  "stage": "build",
  "phase": "development",
  "status": "todo",
  "priority": "P1",
  "complexity": "S",
  "assignedAgent": "dev-agent",
  "tags": ["bug"],
  "createdBy": "agent",
  "sourceDoc": "{current task id}"
}
```

---

## dev-log.md Format

Maintain a development log at `.taskboard/docs/3-build/dev-log.md`:

```markdown
# Development Log

## 2026-01-18

### Completed
- [t-xxx] Built Pipeline kanban view
- [t-xxx] Implemented file watcher

### In Progress
- [t-xxx] Quick Launch command palette

### Issues Found
- Bug: Drag drop not working on touch devices
- Performance: Large project lists cause lag

### Notes
- Using react-beautiful-dnd for drag-drop
- File watcher debounced at 500ms
```

---

## Handoff to QA Agent

When development phase tasks are complete:
1. Update project phase to `testing`
2. Ensure dev-log.md is current
3. List what needs testing
4. Note any known issues
