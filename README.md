<p align="center">
  <img src=".taskboard/assets/logo.png" alt="Task Board Logo" width="80" height="80">
</p>

<h1 align="center">Arun's Task Board</h1>

<p align="center">
  <strong>File-based project orchestration with a beautiful Command Center</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

<!-- LAUNCHPAD:START -->
```json
{
  "stage": "engineering",
  "progress": 15,
  "complexity": "F",
  "lastUpdated": "2026-01-18",
  "targetDate": "2026-02-15",
  "nextAction": "Complete QA_PLAN.md",
  "blocker": null,
  "demoUrl": null,
  "techStack": ["Tauri", "React", "TypeScript", "Tailwind", "Zustand"],
  "shipped": false,
  "linkedinPosted": false
}
```
<!-- LAUNCHPAD:END -->

---

## The Problem

Managing multiple side projects is chaotic:
- Scattered across folders with no visibility
- No single dashboard to see what's in progress
- Context switching between projects is painful
- Hard to track where each project is in its lifecycle

## The Solution

**Task Board** is a lightweight desktop app that gives you a **Command Center** for all your projects:

- **5-Stage Pipeline**: Design → Engineering → Build → Launch → Closure
- **File-Based Storage**: JSON/Markdown files you can edit anywhere
- **Quick Launch**: Cmd+K to jump to any project instantly
- **Claude Integration**: Comments sync automatically for AI-assisted development

---

## Features

| Feature | Description |
|---------|-------------|
| **Pipeline Kanban** | Visual board with 5 lifecycle stages |
| **Project Cards** | See progress, priority, and status at a glance |
| **Quick Launch** | Cmd+K command palette with fuzzy search |
| **File Watching** | Auto-reload when files change externally |
| **Dark Theme** | Beautiful dark UI inspired by Motion |
| **VS Code Integration** | One-click to open project in editor |
| **Claude Comments** | Leave instructions for AI sessions |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- [VS Code](https://code.visualstudio.com/) (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/aruncastro/task-board.git
cd task-board

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Project Structure

```
task-board/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/             # Zustand stores
│   ├── services/           # File & API services
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   └── src/
│       └── main.rs         # Tauri commands
├── projects.json           # Project data
├── tasks.json              # Task data
├── inbox.md                # Quick instructions
└── config.json             # App configuration
```

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                   Task Board App                     │
├─────────────────────────────────────────────────────┤
│  React UI          Zustand Store       Tauri Backend │
│  ┌─────────┐      ┌───────────┐      ┌────────────┐ │
│  │ Pipeline │ ←→  │  Projects │  ←→  │ File Watch │ │
│  │ Cards    │     │  Tasks    │      │ FS Read    │ │
│  │ Modals   │     │  Config   │      │ FS Write   │ │
│  └─────────┘      └───────────┘      └────────────┘ │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│               File System (JSON/MD)                  │
│  projects.json  │  tasks.json  │  inbox.md          │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI components |
| State | Zustand | Global state management |
| Styling | Tailwind CSS | Utility-first styling |
| Desktop | Tauri 2.0 | Native app wrapper |
| Backend | Rust | File operations, watchers |
| Types | TypeScript | Type safety |

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Project pipeline view
- [x] Project cards with progress
- [ ] Quick Launch command palette
- [ ] File watching & auto-reload
- [ ] VS Code integration

### Phase 2: Enhancements
- [ ] Task management within projects
- [ ] Drag & drop between stages
- [ ] Search and filters
- [ ] Keyboard shortcuts

### Phase 3: Polish
- [ ] Animations & transitions
- [ ] System tray integration
- [ ] Auto-start on boot
- [ ] Export/import projects

---

## Configuration

Edit `config.json` to customize:

```json
{
  "projectsRoot": "C:/Users/Castro/Documents/Projects",
  "theme": "dark",
  "defaultEditor": "code",
  "autoReload": true,
  "reloadDebounceMs": 500
}
```

---

## Claude Integration

Task Board is designed to work seamlessly with Claude Code sessions.

### Leaving Instructions

**Option 1: inbox.md** (general instructions)
```markdown
## Active Instructions
- [ ] @claude: Focus on Build phase tasks
- [ ] **Priority**: Complete file service first
```

**Option 2: Task comments** (task-specific)
```json
{
  "comments": [{
    "content": "Use Tauri 2.0 stable, not beta",
    "forClaude": true
  }]
}
```

**Option 3: Project reviews** (project-level)
```json
{
  "reviews": [{
    "content": "UI mockups approved, proceed with dark theme",
    "forClaude": true
  }]
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with caffeine and Claude by <a href="https://github.com/aruncastro">Arun Castro</a>
</p>
