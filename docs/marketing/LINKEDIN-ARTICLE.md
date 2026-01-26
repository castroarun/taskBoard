# I Replaced Jira and Built My Own Task Board — Meet Klarity

**The problem wasn't Jira. It was how Jira fits into AI-assisted development.**

---

## The Cluttered Review Process

*"Claude just finished the feature. Let me check Jira for the task... wait, which sprint is it in? Let me navigate to the board... filter by assignee... open the task... read the acceptance criteria... okay now let me review the code..."*

I was using Jira with MCP (Model Context Protocol) to bring the human review process out of my codebase. [I wrote about this approach here](https://www.linkedin.com/pulse/clarity-clutter-why-ai-assisted-development-needs-arun-castromin-hmxzc/). This flow worked remarkably well, solving the clutter problem:

1. AI writes code
2. AI creates review tasks in Jira
3. I review and comment in Jira
4. AI reads my feedback and proceeds

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
- What my AI assistant is currently working on
- My review queue at a glance

### Problem 3: One-Way Communication

This was the killer. With Jira + MCP, **code talks to Jira** (creating issues, updating status). But **Jira doesn't talk back to code**.

When I leave a comment on a Jira ticket, my AI assistant doesn't automatically see it in the next session. I have to manually copy feedback into the conversation. The bidirectional loop was broken.

---

## The Solution: Klarity

So I built **Klarity** — an installable desktop application designed specifically for AI-assisted development.

The tagline: **Declutter, Design, Deploy better.**

`[SCREENSHOT: project-board-dark.png - Show the 5-phase pipeline view with projects in different phases]`

---

## What Makes Klarity Different

### 1. Visual Five-Phase Pipeline

Instead of Jira's sprint-based workflow, Klarity uses a **phase-based pipeline** with clear visual structure:

| Phase | What Happens | Outcomes |
|-------|--------------|----------|
| **Design** | PRD creation, architecture planning | APP_PRD.md, feature specs |
| **Engineering** | Technical design, API specs, test planning | ARCHITECTURE.md, QA_PLAN.md |
| **Build** | Active development | Working code, DEV-CLOCK.md |
| **Launch** | Testing, deployment, documentation | Live product, user guides |
| **Closure** | Retrospective, learnings captured | RETRO.md, lessons learned |

Every project card shows:
- Current phase with color coding
- Progress percentage
- Priority badge (P0/P1/P2/P3)
- Task completion status
- **Stale project indicators** — Projects without activity are highlighted so nothing gets forgotten

`[SCREENSHOT: project-card.png - Show a project card with all status indicators]`

### 2. Bidirectional Human-AI Communication

This is the game-changer. Klarity has three channels for me to communicate with my AI coding assistant:

`[SCREENSHOT: inbox-view.png - Show the inbox with active instructions and response options]`

**Inbox** — Quick instructions checked at session start. Your AI assistant reads this first every session.

**Project Reviews** — Feedback attached to specific projects. Leave comments, mark blockers, approve phases.

**Document Reviews** — Comments directly on PRDs, architecture docs. Instructions attached to specific deliverables.

**The key:** All review comments become **directly actionable instructions** that your AI coding assistant reads at the start of each session. No copy-pasting. No context loss.

### 3. Built-in Document & Mockup Viewers

Klarity includes integrated viewers for your project artifacts:

- **Markdown Viewer** — View and edit PRDs, architecture docs, README files directly in the app
- **HTML Mockup Viewer** — Preview UI mockups without leaving the task board
- **Document Review System** — Add comments, approve documents, and send feedback to AI sessions

`[SCREENSHOT: docs-view.png - Show the document viewer with a PRD open]`

### 4. Voice Capture with AI Structuring

Sometimes I'm away from the keyboard with an idea. Voice capture is integrated at multiple points:
- **Inbox responses** — Quick voice replies to instructions
- **Document reviews** — Voice feedback on PRDs and architecture docs
- **Project notes** — Capture thoughts while reviewing project cards

How it works:
- Record a voice memo
- **AI auto-transcribes** using Groq Whisper
- **Structures the content** into actionable items
- Routes to inbox or specific project
- Ready for your AI coding assistant to process

`[SCREENSHOT: voice-capture.png - Show the voice recording modal]`

### 5. Calendar View (Work History)

Track when you worked on which projects:

`[SCREENSHOT: calendar-view.png - Show the week timeline with colored project blocks]`

- Visual timeline of project activity by time period
- **Deep work indicators** (6+ hours) highlighted with 🔥
- Month grid for spotting patterns
- Click any day to see detailed activity breakdown

### 6. Project Initialization from Klarity

Start new projects directly from the app with the `/newproject` command:

**What gets created:**
- Project folder structure
- `docs/` directory with subdirectories
- `docs/Design/APP_PRD.md` — Product requirements template
- `docs/PROJECT-STATUS.md` — 9-step workflow tracker
- `docs/DEV-CLOCK.md` — Time tracking from git commits
- Project entry in `projects.json`
- Initial task backlog

No more manual folder setup or IDE required to initiate projects. Consistent structure across all projects.

### 7. Idea Capture & Structuring

Klarity isn't just for active projects. Capture and structure:
- **Project ideas** — Early concepts before they become projects
- **Feature ideas** — Enhancements for existing projects
- **Task-level notes** — Quick thoughts attached to specific work items

All structured and ready to pass to your AI coding assistant when you're ready to build.

### 8. File-Based Storage

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
- AI assistants can read/write directly

---

## Built-in AI Agent Workflow

Klarity is designed around the 9-step development process with specialized agents:

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

**Important:** While I reference Claude Code throughout this article, the agents and commands are **designed to work across any AI coding assistant** that supports custom prompts or system instructions. The JSON-based structure is AI-agnostic.

### 9. In-App Documentation & Workflow Guide

Everything you need to understand the development workflow is built right into Klarity's **Help section** (accessible via the `?` icon or keyboard shortcut):

`[SCREENSHOT: workflow-diagram.png - Show the 9-step development workflow visualization from Help section]`

The Help section includes:
- **Development Workflow** — Visual walkthrough of the 9-step process from ideation to retrospective
- **Agents Playbook** — Complete reference for each specialized agent (@designer, @architect, @qa, @dev, @walkthrough, @retro)
- **Keyboard Shortcuts** — Full reference for keyboard-first navigation
- **Feature Documentation** — Detailed guides for every Klarity feature

No digging through external docs or wikis. The playbook lives where you work.

---

## Installation

### Installing Klarity (Desktop App)

Klarity is an installable desktop application built with Tauri 2.0:

**Windows:**
```bash
# Download the installer
https://github.com/castroarun/klarity/releases/latest/download/Klarity_x64.msi

# Or use winget (coming soon)
winget install Klarity
```

**macOS:**
```bash
# Download the DMG
https://github.com/castroarun/klarity/releases/latest/download/Klarity.dmg
```

**Binary size: ~15MB** (vs Electron apps at 150MB+)

### Deploying AI Agents

The agents and commands that power the 9-step workflow can be installed separately:

**macOS / Linux / Git Bash:**
```bash
# Clone the shared agents repository
git clone https://github.com/castroarun/claude-shared.git ~/.claude-shared

# Copy agents and commands to your AI assistant's config
cp -r ~/.claude-shared/agents ~/.claude/
cp -r ~/.claude-shared/commands ~/.claude/
```

**Windows PowerShell:**
```powershell
# Clone the shared agents repository
git clone https://github.com/castroarun/claude-shared.git $HOME\.claude-shared

# Copy agents and commands
Copy-Item -Recurse $HOME\.claude-shared\agents $HOME\.claude\
Copy-Item -Recurse $HOME\.claude-shared\commands $HOME\.claude\
```

**Test the installation:**
```bash
@architect help
```

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
| Voice | Groq Whisper API |

---

## The Result

After two weeks of intense design and build process, the integration of workflow with Claude, agents, and IDE is fully smooth:

- **Review time cut in half** — Everything I need is in one view
- **Zero context switching** — No browser tabs to Jira
- **AI reads my feedback** — Bidirectional loop closed
- **Project history preserved** — Git commits include task state
- **No stale projects** — Visual indicators keep everything moving
- **Voice ideas captured** — Never lose a thought

---

## Open Source — Use It Today

Klarity is open source and available for anyone to use. The app comes with long-preserved and evolved agents that help you cross the common hurdles in AI-assisted development and save significant time.

**Get started:**
1. Download Klarity from [GitHub Releases](https://github.com/castroarun/klarity/releases)
2. Install the AI agents using the commands above
3. Start building with the 9-step workflow

**Feedback & Ideas Welcome**

Found an issue or have an idea? Navigate to **Help → Feedback** in Klarity to report issues or suggest improvements. You can also open issues directly on the [GitHub repository](https://github.com/castroarun/klarity/issues).

**If you're a solo developer using AI coding assistants, I'd love to hear how Klarity fits into your workflow.**

---

*Built using my 9-step AI development workflow. [Read about the process here](https://www.linkedin.com/pulse/clarity-clutter-why-ai-assisted-development-needs-arun-castromin-hmxzc/)*

---

## Screenshots to Capture

1. `project-board-dark.png` - 5-phase pipeline view with projects in different phases
2. `project-card.png` - Single project card showing all status indicators
3. `inbox-view.png` - Inbox with active instructions and response options
4. `docs-view.png` - Document viewer with PRD open and review comments
5. `quick-launch.png` - Ctrl+K command palette with project search
6. `voice-capture.png` - Voice recording modal
7. `calendar-view.png` - Week timeline with colored project blocks and deep work indicator
8. `workflow-diagram.png` - 9-step development workflow visualization from Help section
