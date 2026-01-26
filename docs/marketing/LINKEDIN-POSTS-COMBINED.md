# LinkedIn Posts for Klarity Launch

## Post #1: Launch Post (Combined)

---

I built **Klarity** — a personal task board for AI-assisted development with a truck load of features.

`[IMAGE: project-board-dark.png - 5-phase pipeline view showing all projects]`

I was using Jira + MCP to manage my Claude coding sessions. The flow worked well, but three problems emerged:

❌ **Too heavy** — Sprint planning, story points, 47 custom fields. I just need: what's blocked? what's done?
❌ **UI isn't mine** — Can't customize to show AI-specific workflows
❌ **One-way street** — Code talks to Jira, but Jira doesn't talk back to code

So I built my own.

---

**Here's what sets Klarity apart:**

📋 **5-phase visual pipeline** (Design → Engineering → Build → Launch → Closure)
No sprints. No ceremonies. See exactly which phase each project is in — at a glance.

💬 **Bidirectional human-AI communication**
Inbox, project reviews, document comments — Claude (or any AI of your choice) checks all three at session start. The context persists. The collaboration loop closes.

`[IMAGE: inbox-view.png - Show the inbox with active instructions]`

In **Klarity**, I have three channels to talk to Claude — or for that matter, any AI assistant of your choice:

**1. Inbox** (session-level) — Quick instructions checked FIRST every session. Voice-enabled.
**2. Project Reviews** (project-level) — Feedback attached to specific projects. Mark blockers, approve phases.
**3. Document Reviews** (document-level) — Comments directly on PRDs, architecture docs. Voice-enabled.

When I leave feedback at 11pm and start a new session at 9am, Claude already knows what I thought. No re-explaining. No copy-pasting.

📝 **Built-in Markdown reader + editor**
View and edit PRDs, architecture docs, README files — all without leaving the task board. HTML mockup preview included.

`[IMAGE: docs-view.png - Document viewer with markdown content]`

🎤 **Voice capture everywhere**
Approve project documentations, record ideas, auto-transcribe and structure — directly to Claude sessions.

📁 **File-based storage**
JSON files. Git-friendly. No database. No server costs. Works offline.

⌨️ **Keyboard-first design**
Ctrl+K for everything. Ctrl+1-5 for tabs. No mouse required.

📅 **Calendar view**
Track when you worked on which projects. Deep work sessions (6h+) highlighted with 🔥

---

**The game-changer?**

Klarity is a lightweight standalone desktop app (~15MB vs Electron's 150MB+). It comes bundled with:
- **Pre-built AI agents** (@designer, @architect, @qa, @dev, @walkthrough, @retro)
- **9-step development workflow** from ideation to retrospective
- **Slash commands** for common operations

Cross the common AI-dev hurdles and save significant time.

---

**Get started in 2 steps:**

**Step 1: Install Klarity**
```
# Download the installer
Windows: Klarity_x64.msi
macOS: Klarity.dmg

https://github.com/castroarun/klarity/releases
```

**Step 2: Install AI Agents**
```bash
# macOS / Linux / Git Bash
git clone https://github.com/castroarun/claude-shared.git ~/.claude-shared
cp -r ~/.claude-shared/agents ~/.claude/
cp -r ~/.claude-shared/commands ~/.claude/

# Windows PowerShell
git clone https://github.com/castroarun/claude-shared.git $HOME\.claude-shared
Copy-Item -Recurse $HOME\.claude-shared\agents $HOME\.claude\
Copy-Item -Recurse $HOME\.claude-shared\commands $HOME\.claude\
```

Test with: `@architect help`

---

Full breakdown of architecture and features: [ARTICLE LINK]

Are you using project management tools with AI coding assistants? What's working (or not)?

#AIAssistedDevelopment #DeveloperTools #BuildInPublic #ClaudeAI #Tauri #React #TypeScript

---

## Post #2: Quick Demo (Visual Post)

---

`[VIDEO/GIF: quick-demo.gif - 15-second flow showing Ctrl+K → project → task → done]`

**Klarity in 15 seconds:**

1. Ctrl+K → Quick launch
2. Type project name → Jump to it
3. See phase, progress, priority at a glance
4. Review tasks, leave comments for Claude
5. Done. No browser tabs. No context switching.

Built with Tauri 2.0 + React + TypeScript.
~15MB installer. Runs anywhere.

Download: [GITHUB LINK]

#AIAssistedDevelopment #DeveloperTools #BuildInPublic

---

## Posting Schedule

| Day | Post | Focus |
|-----|------|-------|
| Day 1 | Post #1 (Combined Launch) | Problem + features + install |
| Day 1 | Article published | Full feature breakdown |
| Day 5-7 | Post #2 (Demo) | Visual quick demo |

## Image Checklist

| Image | Post | Description |
|-------|------|-------------|
| `project-board-dark.png` | Post #1 | 5-phase pipeline with all projects |
| `inbox-view.png` | Post #1 | Inbox with active instructions |
| `docs-view.png` | Post #1 | Document viewer with markdown |
| `quick-demo.gif` | Post #2 | 15-second Ctrl+K flow |

## Hashtags to Use

```
#AIAssistedDevelopment #DeveloperTools #ProductivityTools #SoftwareEngineering #IndieHacker #BuildInPublic #ClaudeAI #Tauri #React #TypeScript
```

## Engagement Strategy

1. Respond to all comments within 2 hours
2. Ask follow-up questions to commenters
3. Share in relevant communities:
   - r/programming
   - r/webdev
   - Hacker News (Show HN)
   - Indie Hackers
4. Cross-post teaser on Twitter/X
