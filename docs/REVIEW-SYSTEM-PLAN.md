# Review & Feedback System - Implementation Plan

## Overview

Enable Arun to provide feedback on tasks and documents via text or voice while mobile. Claude Code reads this feedback on next session and acts accordingly. Document approvals gate workflow progression.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMAND CENTER (Mobile)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Task Click  │───▶│ TaskDetail  │───▶│ Comment (text/voice)│  │
│  │   Popup     │    │   Modal     │    │ → tasks.json        │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Doc Viewer  │───▶│ Review Bar  │───▶│ Approve/Comment     │  │
│  │   (MD)      │    │ (Top)       │    │ → projects.json     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    GROQ WHISPER API                          ││
│  │  Audio Blob → Transcription → Structured Comment             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        JSON FILES                                │
├─────────────────────────────────────────────────────────────────┤
│  tasks.json                    │  projects.json                  │
│  └─ tasks[].comments[]         │  └─ reviews[]                   │
│     {                          │     {                           │
│       id, type, author,        │       id, type, author,         │
│       content, forClaude,      │       content, forClaude,       │
│       resolved, createdAt      │       resolved, documentPath,   │
│     }                          │       approved, createdAt       │
│                                │     }                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE SESSION                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Read inbox.md for general instructions                       │
│  2. Read tasks.json for task comments (forClaude=true)           │
│  3. Read projects.json for document reviews (forClaude=true)     │
│  4. CHECK: Document approved? → Proceed to next phase            │
│  5. Process feedback, implement changes                          │
│  6. Mark resolved=true when addressed                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Schemas

### Task Comment (tasks.json)
```json
{
  "id": "c-20260123-abc1",
  "type": "review|instruction|question|note",
  "author": "arun",
  "createdAt": "2026-01-23T10:00:00Z",
  "content": "The validation logic needs to handle edge cases",
  "forClaude": true,
  "resolved": false,
  "source": "voice|text"
}
```

### Document Review (projects.json → reviews[])
```json
{
  "id": "r-20260123-xyz2",
  "type": "approval|feedback|blocker|question",
  "author": "arun",
  "createdAt": "2026-01-23T10:00:00Z",
  "documentPath": ".taskboard/docs/1-design/APP_PRD.md",
  "documentName": "APP_PRD.md",
  "content": "PRD looks good, approved for engineering phase",
  "forClaude": true,
  "resolved": false,
  "approved": true,
  "source": "voice|text"
}
```

---

## Implementation Tasks

### Phase 1: Voice Infrastructure (Groq Integration)

**1.1 Create Voice Recording Hook**
- File: `src/hooks/useVoiceRecorder.ts`
- Browser MediaRecorder API
- Returns audio blob ready for transcription

**1.2 Create Groq Transcription Service**
- File: `src/lib/groq.ts`
- Send audio to Groq Whisper API
- Return transcribed text
- Handle errors gracefully

**1.3 Update Environment Config**
- Add GROQ_API_KEY to config
- Secure key storage (Tauri keychain or config.json)

---

### Phase 2: Task Detail Popup

**2.1 Create TaskDetailModal Component**
- File: `src/components/ui/TaskDetailModal.tsx`
- Triggered on task card click (PipelineView)
- Shows: title, description, status, priority, comments
- Comment input section with text + voice

**2.2 Update Store for Comments**
- Add `addTaskComment(taskId, comment)` action
- Ensure comments saved to tasks.json

**2.3 Wire Up in PipelineView**
- On task click → open TaskDetailModal
- Pass task data and handlers

---

### Phase 3: Document Review Toolbar

**3.1 Update DocumentViewer Component**
- Add review toolbar at top of viewer
- Buttons: Approve, Comment, Voice Comment
- Show approval status badge

**3.2 Add Document Review to Store**
- Track reviews in projects.json
- Add `addDocumentReview(projectId, review)` action

**3.3 Implement Approval Logic**
- Approve button creates review with `approved: true`
- Visual indicator when doc is approved
- Filter to show pending reviews

---

### Phase 4: Claude Code Integration

**4.1 Update Git Agent**
- File: `agents/git-agent.md`
- On session start: check for pending reviews
- Display unresolved feedback to user

**4.2 Create Workflow Gate Logic**
- Before phase transition, check document approvals
- Design → Engineering: Requires PRD approval
- Engineering → Build: Requires Architecture approval
- Block if required docs not approved

**4.3 Update CLAUDE.md Instructions**
- Document the review workflow
- Add session-start checklist

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useVoiceRecorder.ts` | CREATE | Voice recording hook |
| `src/lib/groq.ts` | CREATE | Groq Whisper transcription |
| `src/components/ui/TaskDetailModal.tsx` | CREATE | Task detail popup with comments |
| `src/components/docs/DocsView.tsx` | MODIFY | Add review toolbar to DocumentViewer |
| `src/store/index.ts` | MODIFY | Add comment/review actions |
| `src/lib/tauri.ts` | MODIFY | Add review read/write functions |
| `config.json` | MODIFY | Add Groq API key |
| `agents/git-agent.md` | MODIFY | Add review check on session start |
| `.claude/CLAUDE.md` | MODIFY | Update workflow documentation |

---

## UI Mockups

### Task Detail Modal
```
┌─────────────────────────────────────────────────┐
│ ✕                           Task Detail         │
├─────────────────────────────────────────────────┤
│ 📋 Build Pipeline kanban view                   │
│ ────────────────────────────────────────────────│
│ Status: In Progress     Priority: P0            │
│ Stage: development      Complexity: L           │
├─────────────────────────────────────────────────┤
│ Description:                                    │
│ Create the main dashboard view with drag-drop   │
│ between stages                                  │
├─────────────────────────────────────────────────┤
│ Comments (2)                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 arun • 2h ago                     [AI]   │ │
│ │ Add keyboard shortcuts for navigation       │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 claude • 1h ago                          │ │
│ │ Implemented Cmd+K for quick launch          │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Add Comment:                                    │
│ ┌─────────────────────────────────────┐ ┌────┐ │
│ │ Type your instruction...            │ │🎤AI│ │
│ └─────────────────────────────────────┘ └────┘ │
│                                         [Send] │
└─────────────────────────────────────────────────┘
```

### Document Review Toolbar
```
┌─────────────────────────────────────────────────────────────────┐
│ 📄 APP_PRD.md                    ~/Projects/taskboard/.taskboard│
├─────────────────────────────────────────────────────────────────┤
│ [✓ Approve]  [💬 Comment]  [🎤 Voice Comment]    │ View │ Edit ││
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ # Product Requirements Document                                 │
│                                                                 │
│ ## Overview                                                     │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘

After Approval:
┌─────────────────────────────────────────────────────────────────┐
│ 📄 APP_PRD.md   ✅ Approved by arun (2h ago)                    │
├─────────────────────────────────────────────────────────────────┤
```

---

## Workflow Gates

| Transition | Required Approval |
|------------|-------------------|
| Design → Engineering | APP_PRD.md approved |
| Engineering → Build | ARCHITECTURE.md approved |
| Build → Launch | Testing completed |
| Launch → Closure | Ship confirmed |

---

## API Keys Needed

1. **Groq API Key** - For Whisper transcription
   - Get from: https://console.groq.com/keys
   - Store in: `config.json` or Tauri secure storage

---

## Estimated Work

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1: Voice Infrastructure | 3 | Medium |
| Phase 2: Task Detail Popup | 3 | Medium |
| Phase 3: Document Review | 3 | Medium |
| Phase 4: Claude Code Integration | 3 | Small |

---

## Next Steps

1. Get Groq API key and add to config
2. Implement Phase 1 (voice recording + transcription)
3. Implement Phase 2 (task detail modal)
4. Implement Phase 3 (document review toolbar)
5. Implement Phase 4 (Claude Code integration)
