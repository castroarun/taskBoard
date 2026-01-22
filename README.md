<p align="center">
  <img src="assets/logo.svg" alt="Taskboard Logo" width="120" height="120">
</p>

<h1 align="center">Taskboard</h1>

<h3 align="center">
  Stop losing track of side projects. <em>Start shipping them.</em>
</h3>

<p align="center">
  A unified project tracker that monitors all your GitHub repos,<br/>
  nudges you when things go stale, and helps you ship with AI assistance.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-0.73-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude-AI_Agent-CC785C?style=for-the-badge&logo=anthropic&logoColor=white" />
</p>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#why-taskboard">Why Taskboard</a></li>
    <li><a href="#how-it-works">How It Works</a></li>
    <li>
      <a href="#features">Features</a>
      <ul>
        <li><a href="#command-center-desktop">Command Center (Desktop)</a></li>
        <li><a href="#launchpad-mobile">Launchpad (Mobile)</a></li>
      </ul>
    </li>
    <li><a href="#quick-start">Quick Start</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#the-launchpad-block">The LAUNCHPAD Block</a></li>
    <li><a href="#specs">Specs</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
  </ol>
</details>

---

## Why Taskboard

You have 12 repos. 3 are "almost done." 5 haven't been touched in months. You keep meaning to finish that one project, but every time you sit down, you're not sure where you left off.

Taskboard solves this by:

- **Tracking project health** — Each repo gets a health score based on README completeness, staleness, and blockers
- **Surfacing what needs attention** — The dashboard shows exactly which project to work on next
- **Working with you, not against you** — Desktop app for coding sessions, mobile app for quick check-ins and voice instructions

---

## How It Works

```
┌──────────────────────────────────────────────────────────────────────┐
│                         YOUR GITHUB REPOS                            │
│         Each README contains a LAUNCHPAD status block                │
└──────────────────────────────────────────────────────────────────────┘
                    ▲                              ▲
                    │ writes                       │ reads
                    │                              │
┌────────────────────────────┐    ┌────────────────────────────────────┐
│   COMMAND CENTER           │    │   LAUNCHPAD                        │
│   (Desktop)                │    │   (Mobile)                         │
│                            │    │                                    │
│   For deep work sessions:  │    │   For when you're away:            │
│   • Pipeline kanban view   │    │   • Push notifications             │
│   • Quick Launch (⌘K)      │    │   • Health monitoring              │
│   • Claude AI agent        │    │   • Voice instructions             │
│   • Task breakdown         │    │   • Ship wizard + LinkedIn draft   │
│                            │    │                                    │
│   Tauri 2.0 + React        │    │   React Native                     │
└────────────────────────────┘    └────────────────────────────────────┘
```

**The loop:** You work on desktop → status syncs to GitHub → mobile reads it → reminds you when stale → you record voice instructions → Claude picks them up on desktop.

---

## Features

### Command Center (Desktop)

| Feature | Description |
|---------|-------------|
| **Pipeline Kanban** | Drag projects through Idea → Building → Testing → Live stages |
| **Quick Launch** | ⌘K palette for fast actions: open project, create task, switch context |
| **Claude Agent** | AI-powered task breakdown, code assistance, and project planning |
| **Offline-First** | Works without internet, syncs when connected |

### Launchpad (Mobile)

| Feature | Description |
|---------|-------------|
| **Health Dashboard** | See all projects at a glance with health scores |
| **Smart Notifications** | Get nudged when a project goes stale (14+ days) |
| **Voice Capture** | Record instructions on the go, Groq transcribes, Claude executes |
| **Ship Wizard** | Pre-flight checklist + auto-generated LinkedIn post draft |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/castroarun/Taskboard.git
cd Taskboard && npm install

# Command Center (Desktop)
cd apps/command-center
npm run tauri dev

# Launchpad (Mobile)
cd apps/launchpad
npm run android
```

---

## Project Structure

```
Taskboard/
├── apps/
│   ├── command-center/     # Desktop (Tauri 2.0 + React + Zustand)
│   └── launchpad/          # Mobile (React Native + Expo)
├── packages/
│   └── shared/             # Types + LAUNCHPAD block parser
├── specs/                  # Feature specifications
├── data/                   # Local JSON (projects, tasks, inbox)
└── assets/                 # Logo and images
```

---

## The LAUNCHPAD Block

Each project README contains a machine-readable status block:

```json
<!-- LAUNCHPAD:START -->
{
  "stage": "building",
  "progress": 65,
  "nextAction": "Add leaderboard feature",
  "targetDate": "2026-01-30",
  "blocker": null
}
<!-- LAUNCHPAD:END -->
```

This enables automatic health scoring, notifications, and cross-device sync without a backend.

---

## Specs

- [Command Center Spec](specs/taskboard/TASKBOARD_COMPLETE_SPEC.md) — Desktop app architecture and features
- [Launchpad Spec](specs/launchpad/launchpad-project-spec.md) — Mobile app and notification system

---

## Roadmap

- [x] Command Center mockups
- [x] Launchpad mockups
- [ ] Command Center MVP (Tauri + React)
- [ ] Launchpad MVP (React Native)
- [ ] GitHub API integration
- [ ] Claude agent integration
- [ ] Push notifications (FCM)

---

<p align="center">
  <sub>Built by <a href="https://github.com/castroarun">Arun Castro</a> — shipping projects, one at a time.</sub>
</p>
