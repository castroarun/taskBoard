# Task Board - Claude Instructions

## Project Overview

This is **Arun's Task Board** - a file-based project orchestration system with a Command Center desktop app built with Tauri 2.0 + React + TypeScript.

**Jira Project Key**: TASKBOARD (if synced)

---

## Auto-Check on Session Start

**IMPORTANT**: At the start of EVERY Claude session, automatically check these files for pending instructions and feedback:

### 1. Inbox (General Instructions)
```
inbox.md
```
- Read the "Active Instructions" section
- Process any items marked with `[ ]`
- Move processed items to "Processed Archive" with timestamp

### 2. Project Reviews (Project-Level Feedback)
```
projects.json → reviews[] where forClaude=true and resolved=false
```
- Check for unresolved reviews
- Acknowledge and incorporate feedback
- Mark as resolved when addressed

### 3. Task Comments (Task-Specific Instructions)
```
tasks.json → tasks[].comments[] where forClaude=true
```
- Check comments on tasks you're working on
- Follow any instructions or incorporate feedback

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
| `inbox.md` | Quick instructions, ad-hoc feedback |
| `projects.json` | Project data + reviews |
| `tasks.json` | Task data + comments |
| `config.json` | System configuration |
| `.taskboard/docs/` | Design documents |

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
