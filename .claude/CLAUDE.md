# Klarity & Orbit - Claude Instructions

## Project Overview

This is **Klarity & Orbit** - a file-based project orchestration system. Klarity is the desktop command center (Tauri 2.0 + React + TypeScript), Orbit is the mobile companion (React Native + Expo).

**Jira Project Key**: TASKBOARD (if synced)

---

## Auto-Check on Session Start

**IMPORTANT**: At the start of EVERY Claude session, automatically check these files for pending instructions and feedback:

### 1. Inbox (Structured JSON + Markdown)

**Primary file**: `~/.taskboard/inbox.json` (structured data)
**Human-readable**: `~/.taskboard/inbox.md` (auto-generated from JSON)

**At session start:**
1. **Pull latest from GitHub first** — run `bash ~/.taskboard/sync-pull.sh` to get Orbit's latest messages (Klarity may not have been running)
2. Read `inbox.json` to see all pending items
3. **Show ALL unread/pending inbox messages** to the user immediately (summary table)
4. Check for items with `status: "pending"` that need response
5. Add your reply to the item's `replies` array
6. Set `read: false` so the user sees the badge notification

**Agent inbox check (REQUIRED for all agents):**
- Every agent (design, QA, architect, etc.) MUST run `bash ~/.taskboard/sync-pull.sh` when it starts — pull fresh from GitHub, not rely on stale local data
- After pulling, read `inbox.json` and filter for `project` matching the current project
- If there are new pending items relevant to the agent's role, alert the user before proceeding with the assigned task
- Design agents filter for: "design", "mockup", "UI", "layout", "theme"
- QA agents filter for: "bug", "test", "fix", "broken", "crash"
- Architect agents filter for: "architecture", "schema", "structure", "refactor"
- General agents: show all pending items for the project

**Example:** QA agent invoked on `klarity` → pulls from GitHub → reads inbox.json → finds 1 new item where `project === "klarity"` with text containing "login bug" → alerts: "New inbox item for Klarity: login bug reported from Orbit"

**To respond to an inbox item**, edit `inbox.json` and add to the item's replies:
```json
{
  "id": "reply-<timestamp>",
  "author": "claude",
  "text": "Your response here...",
  "createdAt": "2026-01-25T14:30:00.000Z"
}
```

**Full inbox.json schema:**
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-25T14:30:00.000Z",
  "items": [
    {
      "id": "inbox-<timestamp>",
      "text": "User's message or task",
      "type": "task|idea|note",
      "project": "project-name|null",
      "priority": "P0|P1|P2|P3|null",
      "status": "pending|done|skipped",
      "createdAt": "2026-01-25T14:00:00.000Z",
      "read": false,
      "author": "user|claude",
      "parentId": null,
      "taskRef": "t-rp-002|null",
      "taskTitle": "Exercise library with search|null",
      "replies": [
        {
          "id": "reply-<timestamp>",
          "author": "claude",
          "text": "Claude's response",
          "createdAt": "2026-01-25T14:30:00.000Z"
        }
      ]
    }
  ]
}
```

**Important:**
- After adding a reply, set `item.read = false` so user sees notification
- Mark `item.status = "done"` when task is complete
- The app auto-generates `inbox.md` from JSON for human readability

### Pushing Responses to GitHub (Required)

After writing your reply to local `~/.taskboard/inbox.json`, you **MUST** also push the updated file directly to the `.taskboard` GitHub repo. This ensures Orbit (phone app) gets your response even if Klarity (desktop) is not running.

**Use the sync script:**
```bash
bash ~/.taskboard/sync-push.sh
```

This script:
1. Reads your GitHub token + owner from `~/.taskboard/sync-config.json`
2. Gets the current file SHA from GitHub
3. Pushes the updated `inbox.json` via GitHub Contents API
4. Is idempotent — safe to run multiple times

**When to push:**
- After adding a reply to any inbox item
- After marking an item as `done` or `skipped`
- After any status change that Orbit should see

**Do NOT rely on Klarity to relay your responses.** Orbit must function independently.

### 2. Project Reviews (Project-Level Feedback)
```
projects.json → reviews[] where forClaude=true and resolved=false
```
- Check for unresolved reviews
- Acknowledge and incorporate feedback
- Mark as resolved when addressed

### 3. Task Comments (via Inbox Pipeline)

Task-level comments flow through the **same inbox pipeline** — not a separate channel.
When an inbox item has `taskRef` and `taskTitle`, it's a task-specific comment.

**How to identify task comments in inbox.json:**
```json
{
  "id": "inbox-1706234567890",
  "text": "The search filter is not working for muscle groups",
  "type": "task",
  "project": "reppit",
  "taskRef": "t-rp-002",
  "taskTitle": "Exercise library with search",
  "forClaude": true,
  "status": "pending"
}
```

**When responding to task comments:**
1. Include the task context in your reply: mention the task title and ID
2. If the comment requires code changes, explain what you'll do
3. After acting on it, add your reply AND mark status as "done"
4. Your reply appears in Orbit's project detail screen under the linked task

**Example response flow:**
- Orbit user comments on task "Exercise library with search": "Search filter broken for muscle groups"
- Claude reads inbox, sees `taskRef: "t-rp-002"` with `forClaude: true`
- Claude investigates, fixes the issue
- Claude adds reply: "Fixed the muscle group filter — was missing lowercase normalization in the search query"
- Reply shows up under the task card in Orbit's project detail view

---

## Multi-Task Handling (Global Workflow)

**When the user provides multiple tasks/requests in a single message:**

1. **Create a todo list** immediately with all tasks
2. **Ask the user**: "Should I wait for review after each task, or execute all sequentially and update status as I go?"
3. **Based on response**:
   - **Review mode**: Complete one task → present status → wait for "proceed"
   - **Sequential mode**: Execute all tasks, updating todo status after each completion
4. **Always present the todo table** after each task completion showing:
   - ✅ Completed tasks
   - 🔄 Current task (in_progress)
   - ⏳ Pending tasks
5. **Never skip presenting status** - user should always see progress

**Todo Status Format:**
```
| # | Task | Status |
|---|------|--------|
| 1 | First task description | ✅ Done |
| 2 | Second task description | 🔄 In Progress |
| 3 | Third task description | ⏳ Pending |
```

**Example workflow:**
```
User: "Fix the bug, add tests, and update docs"

Claude: Creating todo list:
1. Fix the bug
2. Add tests
3. Update docs

Should I wait for your review after each task, or execute all sequentially?

User: "proceed sequentially"

Claude: [Completes task 1, shows status table]
Claude: [Completes task 2, shows status table]
Claude: [Completes task 3, shows final status table]
```

---

## Comment Schema

### Task Comments (in tasks.json)
```json
{
  "id": "c-001",
  "type": "review|instruction|question|note",
  "author": "arun",
  "createdAt": "2026-01-18T12:00:00Z",
  "content": "Your comment text here",
  "forClaude": true,
  "resolved": false
}
```

### Project Reviews (in projects.json)
```json
{
  "id": "r-001",
  "type": "feedback|blocker|approval|question",
  "author": "arun",
  "createdAt": "2026-01-18T12:00:00Z",
  "content": "Your review text here",
  "forClaude": true,
  "resolved": false
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `~/.taskboard/inbox.json` | **Primary inbox data** - structured JSON for Claude replies |
| `~/.taskboard/inbox.md` | Human-readable inbox (auto-generated from JSON) |
| `~/.taskboard/sync-pull.sh` | **Pull latest inbox from GitHub** (run at session start) |
| `~/.taskboard/sync-push.sh` | **Push inbox to GitHub** (run after every reply) |
| `~/.taskboard/sync-config.json` | GitHub token + owner for sync scripts |
| `~/.taskboard/projects.json` | Project data + reviews |
| `~/.taskboard/tasks.json` | Task data + comments |
| `~/.taskboard/config.json` | System configuration |
| `apps/command-center/mockups/` | UI design mockups |

---

## Development Standards

- **Tech Stack**: Tauri 2.0, React 18, TypeScript, Tailwind CSS, Zustand
- **Theme**: Dark theme only (see mockups in `.taskboard/docs/mockups/`)
- **File Ops**: Always use Tauri's `invoke` command, not direct browser APIs
- **Types**: Full TypeScript coverage, no `any` types

---

## Current Phase

**Stage**: Engineering
**Phase**: Architecture
**Focus**: Complete QA_PLAN.md, then move to Build phase

---

## UI Reference

Desktop mockup: `.taskboard/docs/mockups/pipeline-view-v2-updated.html`
Mobile mockup: `.taskboard/docs/mockups/mobile-view-v3.html`
