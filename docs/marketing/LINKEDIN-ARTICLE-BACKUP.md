# Why I Built My Own Task Board After Jira Failed My AI Workflow

**The problem wasn't Jira. It was how Jira fits into AI-assisted development.**

---

## The Cluttered Review Process

Here's a conversation I kept having with myself:

*"Claude just finished the feature. Let me check Jira for the task... wait, which sprint is it in? Let me navigate to the board... filter by assignee... open the task... read the acceptance criteria... okay now let me review the code..."*

I was using Jira with MCP (Model Context Protocol) to bring the human review process out of my codebase. The flow looked clean on paper:

1. Claude writes code
2. Claude creates review tasks in Jira
3. I review and comment in Jira
4. Claude reads my feedback and proceeds

**But three problems emerged:**

### Problem 1: Jira is Heavy for Solo Dev Work

Jira is built for teams of 10-100+. For a solo developer working with AI assistants, I don't need:
- Sprint planning ceremonies
- Story point estimation
- 47 custom fields per ticket
- Complex workflow states

I need: **What am I working on? What's blocked? What's done?**

### Problem 2: The UI Isn't Mine

I couldn't customize Jira's interface to show exactly what matters for AI-assisted development. I wanted to see:
- Which phase each project is in (Design? Build? Launch?)
- What Claude is currently working on
- My review queue at a glance

### Problem 3: One-Way Communication

This was the killer. With Jira + MCP, **code talks to Jira** (creating issues, updating status). But **Jira doesn't talk back to code**.

When I leave a comment on a Jira ticket, Claude doesn't automatically see it in the next session. I have to manually copy feedback into the conversation. The bidirectional loop was broken.

---

## The Solution: Klarity

So I built **Klarity** — a personal task board designed specifically for AI-assisted development.

The tagline: **Declutter, Design, Deploy better.**

`[SCREENSHOT: project-board-dark.png - Show the 5-phase pipeline view with projects in different phases]`

---

## What Makes Klarity Different

### 1. Five-Phase Pipeline (Not Sprint Boards)

Instead of Jira's sprint-based workflow, Klarity uses a **phase-based pipeline**:

| Phase | What Happens |
|-------|--------------|
| **Design** | PRD creation, architecture planning |
| **Engineering** | Technical design, API specs |
| **Build** | Active development |
| **Launch** | Testing, deployment, documentation |
| **Closure** | Retrospective, learnings captured |

Every project card shows its current phase at a glance. No digging through boards.

### 2. Bidirectional Human-AI Communication

This is the game-changer. Klarity has three channels for me to communicate with Claude:

**Inbox** — Quick instructions that Claude checks at session start
```markdown
## Active Instructions
- [ ] Focus on the calendar view today
- [ ] Don't refactor the auth module yet
```

**Project Reviews** — Feedback attached to specific projects
```json
{
  "type": "feedback",
  "content": "The timeline blocks are overlapping",
  "forClaude": true,
  "resolved": false
}
```

**Task Comments** — Instructions on specific tasks
```json
{
  "type": "instruction",
  "content": "Use the mockup at /mockups/calendar.html as reference",
  "forClaude": true
}
```

Claude checks all three at the start of every session. **True bidirectional workflow.**

`[SCREENSHOT: inbox-view.png - Show the inbox with active instructions]`

### 3. File-Based Storage

No database. No backend. Just JSON files:

```
projects.json  — All projects with metadata
tasks.json     — All tasks with comments
inbox.md       — Quick capture instructions
config.json    — Preferences
```

**Why this matters:**
- Git-friendly (version control your project state)
- Portable (copy folder = backup)
- No server costs
- Works offline
- Claude can read/write directly

### 4. Quick Launch (Ctrl+K)

Spotlight-style command palette for everything:

`[SCREENSHOT: quick-launch.png - Show the command palette with project search]`

- Jump to any project instantly
- Create new tasks
- Switch views
- All keyboard-driven

### 5. Voice Capture

Sometimes I'm away from the keyboard with an idea. Voice capture lets me:
- Record a voice memo
- Auto-transcribe to inbox
- Tag with priority
- Process later

`[SCREENSHOT: voice-capture.png - Show the voice recording modal]`

### 6. Calendar View (Work History)

Track when you worked on which projects:

`[SCREENSHOT: calendar-view.png - Show the week timeline with colored project blocks]`

- See deep work sessions (6+ hours) highlighted
- Visual timeline of project activity
- Month grid for patterns

### 7. Built-in AI Agent Workflow

Klarity is designed around the 9-step development process I use:

| Step | Agent | Output |
|------|-------|--------|
| 1 | @designer | Initial PRD |
| 2 | Human | PRD Review |
| 3 | @architect | Technical Design |
| 4 | Human | Architecture Review |
| 5 | @dev | Implementation |
| 6 | @qa | Test Plan |
| 7 | Human | QA Review |
| 8 | @walkthrough | User Guide |
| 9 | @retro | Retrospective |

The task board reflects these phases. When I'm in "Design" phase, I know exactly which agents to invoke.

---

## Tech Stack

Built with modern, lightweight tools:

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri 2.0 (Rust) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Storage | Local JSON files |

**Binary size: ~15MB** (vs Electron apps at 150MB+)

---

## The Result

After two weeks of using Klarity:

- **Review time cut in half** — Everything I need is in one view
- **Zero context switching** — No browser tabs to Jira
- **Claude reads my feedback** — Bidirectional loop closed
- **Project history preserved** — Git commits include task state

---

## Try It / What's Next

Klarity is currently a personal tool, but I'm considering open-sourcing it if there's interest.

**If you're a solo developer using AI coding assistants and frustrated with heavy project management tools, let me know in the comments.**

Questions I'm exploring:
- Would you use a file-based task board?
- What features matter most for AI-assisted workflows?
- Should this integrate with GitHub Issues instead of replacing it?

---

*Built using my 9-step AI development workflow. [Read about the process here](https://www.linkedin.com/pulse/clarity-clutter-why-ai-assisted-development-needs-arun-castromin-hmxzc/)*

---

## Screenshots to Capture

1. `project-board-dark.png` - 5-phase pipeline view with projects in different phases
2. `inbox-view.png` - Inbox with active instructions visible
3. `quick-launch.png` - Ctrl+K command palette with project search
4. `voice-capture.png` - Voice recording modal
5. `calendar-view.png` - Week timeline with colored project blocks and deep work indicator
