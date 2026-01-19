# Arun's Task Board - Discovery

> **Stage:** Discovery
> **Created:** 2026-01-18
> **Author:** Design Agent

---

## Research Summary

### Problem Space Analysis

The core problem is **context fragmentation** for solo developers:
- Project state scattered across tools
- AI agents need repeated context injection
- Pipeline visibility requires mental tracking
- Heavy tools (Jira/Linear) are overkill

### Key Insight

**Files as Database Pattern:**
- JSON files are human-readable AND machine-readable
- Git provides version control for free
- No server, no sync, no subscription
- AI agents can read/write directly

---

## Competitive Analysis

| Tool | Pros | Cons | Gap |
|------|------|------|-----|
| **Jira** | Full-featured, industry standard | Heavy, slow, requires internet, overkill | No agent integration |
| **Linear** | Fast, beautiful UI | SaaS, no offline, no file access | Agents can't write |
| **Notion** | Flexible, databases | Slow, proprietary, no CLI | Not agent-native |
| **Obsidian** | File-based, offline | No kanban, no task management | Missing pipeline view |
| **GitHub Projects** | Free, integrated | Web-only, GitHub lock-in | No local files |
| **Taskwarrior** | CLI-native, files | Ugly, no GUI, steep learning | No modern UI |

**What's Missing:** A tool that combines:
- Obsidian's file-based approach
- Linear's beautiful kanban
- CLI-native agent access
- Offline-first architecture

---

## Technical Feasibility

### Tauri 2.0 Assessment

| Capability | Feasibility | Notes |
|------------|-------------|-------|
| File read/write | ✅ Native | Rust FS API, fast |
| File watching | ✅ Native | notify crate, real-time |
| JSON parsing | ✅ Easy | serde_json, type-safe |
| Markdown rendering | ✅ Easy | react-markdown |
| Keyboard shortcuts | ✅ Native | Global shortcuts supported |
| Drag-drop | ✅ React | react-beautiful-dnd or dnd-kit |
| Dark theme | ✅ Tailwind | Built-in dark mode |
| Binary size | ✅ ~3-5MB | Much smaller than Electron |

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| File corruption | Low | JSON validation on write |
| Concurrent edits | Medium | File locking / conflict detection |
| Performance with many tasks | Low | Virtualized lists if needed |
| Tauri learning curve | Medium | Good docs, similar to Electron |

---

## User Research

### Target User Profile: Solo Developer

**Daily Workflow:**
1. Wake up → "Where was I?"
2. Open project → Need context
3. Start Claude → Re-explain everything
4. Work on task → Forget to update status
5. End day → What did I accomplish?

**Pain Points:**
- 5-10 minutes lost per context switch
- Mental overhead tracking multiple projects
- Agents need full re-briefing every session
- Status updates feel like busywork

**Desired Workflow:**
1. Open Task Board → See pipeline instantly
2. Pick task → Full context available
3. Invoke agent → Context auto-loaded
4. Work → Status auto-updates
5. End day → Clear progress visible

---

## Risks & Unknowns

### Technical Risks
1. **File watching reliability** - Need to handle rapid saves, external edits
2. **JSON schema evolution** - How to migrate when schema changes?
3. **Large file performance** - What if tasks.json has 1000+ tasks?

### Product Risks
1. **Adoption friction** - Will I actually use it daily?
2. **Feature creep** - Keep it simple or it becomes Jira
3. **Maintenance burden** - Another app to maintain

### Mitigations
- Start with MVP, iterate based on actual usage
- Hard limit on features in v1.0
- Dogfood immediately - use it for its own development

---

## Recommendation

### GO ✅

**Rationale:**
1. Problem is real and felt daily
2. No existing tool solves agent-native workflow
3. Technical feasibility is high
4. Can dogfood immediately
5. Learning opportunity (Tauri, Rust backend)

### MVP Scope (Strict)

**In Scope:**
- Pipeline kanban (5 stage columns)
- Project cards with key info
- Quick Launch (⌘K) command palette
- File read/write (projects.json, tasks.json)
- File watcher for real-time updates
- Dark theme

**Out of Scope (v1.0):**
- Task management UI (just show count)
- Agent invocation
- Inbox processing
- GitHub integration
- Time tracking

### Success Metric
**Daily active use** for 2+ weeks = success

---

## Next Steps

1. ✅ Complete discovery (this document)
2. → Move to Requirements phase
3. Create detailed APP_PRD.md
4. Generate implementation tasks

---

*"Build the simplest thing that could possibly work."*
