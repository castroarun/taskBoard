# Arun's Task Board - Idea

> **Stage:** Conception
> **Created:** 2026-01-18
> **Author:** Design Agent

---

## The Problem

Managing multiple side projects is chaotic:

1. **Scattered state** - Project status lives in READMEs, Notion, mental notes
2. **No pipeline visibility** - Can't see all projects at a glance by stage
3. **Agent coordination friction** - Every Claude session needs full context re-explained
4. **No async instructions** - Can't queue up tasks for agents to process later
5. **Heavy tooling** - Jira/Linear are overkill for solo dev, require internet

**Core Pain:** "Where was I? What's next?" - context switching tax on every session.

---

## The Solution

A **file-based project orchestration system** with a lightweight desktop app:

1. **Single source of truth** - `projects.json` and `tasks.json` files
2. **Pipeline kanban** - Visual board showing all projects by stage
3. **Agent-native** - Agents read/write files directly, no API needed
4. **Inbox for async** - Write instructions in `inbox.md`, process later
5. **Offline-first** - Works without internet, Git-friendly

**Key Insight:** Files ARE the database. Agents can read/write them. Desktop app is just a viewer/editor.

---

## Target User

**Primary:** Arun (solo developer with 5+ side projects)

**Characteristics:**
- Manages multiple projects in different stages
- Uses Claude agents for development work
- Wants visibility without heavy project management tools
- Prefers keyboard shortcuts and speed
- Works offline sometimes

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Context switch time | < 30 seconds to get full project status |
| Agent onboarding | 0 manual context - agents read files |
| Inbox processing | < 2 minutes to clear daily inbox |
| Pipeline visibility | See all 5+ projects in one view |
| Offline capability | 100% functional without internet |

---

## Initial Thoughts

### Must Have (MVP)
- Pipeline kanban view (projects as cards by stage)
- Quick Launch command palette (⌘K)
- Read/write projects.json and tasks.json
- Inbox viewer/editor
- File watcher for real-time updates

### Nice to Have
- Drag-drop between stages
- Project detail modal
- Task list per project
- Agent invocation (copy context to clipboard)
- Dark/light theme

### Future Ideas
- README LAUNCHPAD sync on push
- GitHub integration (create repos)
- Time tracking from git commits
- Portfolio auto-update

### Technical Direction
- **Tauri 2.0** - 3MB binary, native performance, Rust backend
- **React 18** - Familiar, good ecosystem
- **Tailwind CSS** - Fast styling, dark theme easy
- **Zustand** - Simple state, no boilerplate
- **File system** - Native Tauri FS API

### Questions to Resolve
1. How to handle file conflicts if edited externally?
2. Should agents update files directly or through the app?
3. What's the minimum viable kanban (columns, card data)?

---

## Next Steps

1. ✅ Capture idea (this document)
2. → Move to Discovery phase
3. Research similar tools (Obsidian, Notion, Linear)
4. Define MVP scope precisely

---

*"The best project management tool is the one you actually use."*
