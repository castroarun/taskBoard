# LinkedIn Post — Klarity + Orbit Sync Architecture

**Status:** Draft v2
**Date:** 2026-02-01
**Angle:** Problem-solution (anchored on Klarity launch)
**CTA:** Try it / GitHub link

---

## Post

Launching Orbit — the phone companion!! We recently shipped Klarity — a desktop command center that brings a focused "human-in-the-loop" for AI-assisted development. Pipeline board, inbox, review system — no clutter, just signal. (https://www.linkedin.com/pulse/my-project-management-app-8mb-works-offline-talks-ai-meet-castromin-mmnsc/)

But ideas don't happen at your desk. They happen on the commute, in the shower, in bed at 2 AM. So Orbit — the phone companion — was always part of the plan. Both apps were designed simultaneously, each meant to complement each other or even work alone. The real challenge was making them speak the same language — schema mismatches and UI patterns that worked on desktop but broke on mobile forced design rework mid-build.

The design principle: **each app must work completely alone.**

Orbit alone: Phone → GitHub → Claude executes → results back on phone. 
Klarity alone: Desktop pipeline, Windows notifications, inbox with replies. No phone required.
(via a strcutured JSON - our source of truth)

What Orbit actually shows on your phone:

- Project age + stale days since last update
- Smart "pick this up now" recommendation based on staleness + closeness to launch
- Voice capture at project, task, or home level — Groq AI transcribes and structures it. Captured at a project or task? Claude gets that context and acts accordingly
- Ship tab ranks all projects by shipping readiness

But here's what happens when both apps are active:

You say "fix the calendar bug" into Orbit at lunch. Klarity pops a Windows notification on your desktop. Claude Code pulls the task from GitHub, fixes the code, pushes the result. Your phone AND desktop show the reply — simultaneously.
*- the windows notification is WIP on Klarity - have reopened for enhancements*

The architecture that makes this work:

- GitHub private repo as the entire backend (zero servers)
- SHA conflict protection + additive merge — zero data loss with concurrent edits
- ETag caching — idle polls cost zero bandwidth
- Claude agents pull fresh from GitHub when spawned — catch Orbit messages mid-session
- <2 min sync across all 4 systems. $0 infrastructure cost.

Tech: React Native (Orbit) · Tauri 2.0 + Rust (Klarity) · TypeScript · GitHub API · Groq AI (voice) · Claude AI (execution)

Interactive architecture diagram: https://htmlpreview.github.io/?https://github.com/castroarun/taskBoard/blob/main/.taskboard/docs/Design/sync-architecture-flow.html

More on Klarity: https://www.linkedin.com/pulse/my-project-management-app-8mb-works-offline-talks-ai-meet-castromin-mmnsc/
Built with the 9-step AI dev process: https://www.linkedin.com/pulse/clarity-clutter-why-ai-assisted-development-needs-arun-castromin-hmxzc/

Repo: https://github.com/castroarun/taskBoard

Next up: multi-user collaboration. Same sync pipeline, more contributors. One person captures the idea on Orbit, another picks it up on Klarity, Claude assists both. The architecture is already additive-merge — scaling to teams is a natural extension.

---

## Screenshot Recommendation

Use the "Full System" flow diagram (Flow 3 — pink label) from the interactive diagram:
https://htmlpreview.github.io/?https://github.com/castroarun/taskBoard/blob/main/.taskboard/docs/Design/sync-architecture-flow.html
Shows fan-out to both Klarity + Claude, fan-in to both Orbit + Klarity.

## Hashtags (optional)

#BuildInPublic #DevTools #AI #ClaudeAI #TauriApp #ReactNative #SoloDevLife

## Post Checklist

- [x] Anchored on Klarity as recently shipped
- [x] Relatable problem (ideas away from desk)
- [x] Independence explained (each app works alone)
- [x] Together value (fan-out sync, simultaneous results)
- [x] Technical specifics (SHA, ETag, additive merge, $0)
- [x] AI agent layer (mid-session pull)
- [x] 9-step article referenced (placeholder)
- [x] Klarity article referenced (placeholder)
- [x] CTA with GitHub link (placeholder)
- [x] Discussion question at end
- [x] Collaboration/team scaling teased as next step
- [ ] Replace [Klarity article link] with actual URL
- [ ] Replace [9-step article link] with actual URL
- [x] Replace [GitHub link] with actual URL
- [x] Interactive architecture diagram link added
- [ ] Replace [Klarity article link] with actual URL
- [ ] Replace [9-step article link] with actual URL
- [ ] Attach screenshot
