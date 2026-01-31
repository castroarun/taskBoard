# Orbit — Architecture & Design Decisions

## Overview

Orbit is a mobile companion app (Expo/React Native) for developers to track their projects, capture ideas, and stay on top of their dev life — from their phone.

Klarity is the desktop counterpart. Both are independent apps that share a `.taskboard` private GitHub repo as the sync layer.

## Decided: Naming

- **Mobile app:** Orbit
- **Desktop app:** Klarity (Command Center)
- **CLI onboarding tool:** orbit-setup (optional, for Klarity users only)

---

## Data Architecture

### Single source of truth: `.taskboard` GitHub repo

```
github.com/{username}/.taskboard  (private)
├── projects.json       ← Tracked projects
├── tasks.json          ← User-created tasks
├── inbox.json          ← Notes, voice captures, ideas
├── config.json         ← Preferences, API keys
└── voice/
    └── captures.json   ← Voice capture metadata
```

### Who reads/writes where

| App | Reads from | Writes to |
|-----|-----------|-----------|
| **Orbit** (phone) | GitHub API → `.taskboard` repo | GitHub API → `.taskboard` repo |
| **Klarity** (desktop) | Local clone `~/.taskboard/` | Local clone → git push |
| **orbit-setup** (CLI) | GitHub API + local filesystem | Local clone → git push |

### How each app accesses data

**Orbit (phone):**
- GitHub Contents API to read/write JSON files
- `GET /repos/{user}/.taskboard/contents/projects.json`
- `PUT /repos/{user}/.taskboard/contents/tasks.json`
- Local cache via AsyncStorage for offline access

**Klarity (desktop):**
- Reads directly from `~/.taskboard/` on disk (local git clone)
- Writes to disk, commits, pushes to GitHub
- git pull on app launch to get latest

**orbit-setup (CLI):**
- Optional tool — only needed if user wants Klarity
- Clones `.taskboard` repo to `~/.taskboard/`
- Run via `npx orbit-setup`

---

## Onboarding Flow (Orbit — phone)

Orbit handles its own setup. No CLI or desktop required.

### Step 1: Sign in with GitHub

Standard OAuth flow. Gets token for API access to user's repos.

### Step 2: Create `.taskboard` repo

Orbit creates the private repo via GitHub API with a clear explanation screen:

```
"Orbit needs a private repo to store your
project data. We'll create:

  github.com/yourname/.taskboard (private)

Only you can see this. It stores your project
list, tasks, and notes.

[Create & Continue]    [Learn More]"
```

API call: `POST /user/repos { "name": ".taskboard", "private": true }`

### Step 3: Scan GitHub repos

Fetch all repos via `GET /user/repos`. For each repo, collect:
- Name, description
- Language / tech stack
- Last push date
- Stars, open issues
- Archived flag

### Step 4: User selects projects to track

Present the list, let user pick which repos to track in Orbit.

### Step 5: Build initial data

Write `projects.json` to `.taskboard` repo with selected projects.
Create empty `tasks.json`, `inbox.json`, `config.json`.

### Done

User lands on the Orbit dashboard with their projects loaded.

---

## Scanner Agent

### What it scans (from GitHub API)

| Signal | API endpoint |
|--------|-------------|
| Repo list | `GET /user/repos` |
| Languages | `GET /repos/{owner}/{repo}/languages` |
| Recent commits | `GET /repos/{owner}/{repo}/commits` |
| Open issues | `GET /repos/{owner}/{repo}/issues` |
| README content | `GET /repos/{owner}/{repo}/readme` |
| Repo metadata | Included in repos response (stars, forks, archived, pushed_at) |

### What it infers

| Field | How |
|-------|-----|
| Status (active/stale/archived) | `pushed_at` date + archived flag |
| Tech stack | Language stats + package file detection |
| Project name | Repo name, cleaned up |
| Description | Repo description or first line of README |

### Optional: Local scan enrichment (for Klarity users)

If user also runs `npx orbit-setup`, the CLI can scan local repos for:
- TODO comments in code
- Uncommitted work / dirty branches
- Local-only repos not on GitHub

This data gets merged into the GitHub-sourced project list.

---

## Builder Agent

Takes the scanner output and writes structured JSON files.

### projects.json entry schema

```json
{
  "id": "repo-name",
  "name": "Repo Name",
  "description": "From GitHub description or README",
  "techStack": ["TypeScript", "React", "Node.js"],
  "status": "active",
  "github": {
    "owner": "username",
    "repo": "repo-name",
    "url": "https://github.com/username/repo-name",
    "stars": 12,
    "openIssues": 3,
    "lastPush": "2026-01-30T10:00:00Z",
    "archived": false
  },
  "tracking": {
    "addedAt": "2026-01-31T12:00:00Z",
    "updatedAt": "2026-01-31T12:00:00Z"
  }
}
```

---

## Sync Strategy

### Pull-before-push pattern

1. Before writing, fetch latest SHA of the file from GitHub
2. Include SHA in the PUT request (GitHub rejects if stale)
3. If conflict (409), pull latest, merge, retry

### Conflict handling

- Each item has a unique `id` and `updatedAt` timestamp
- On conflict: newer `updatedAt` wins
- JSON files are structured as arrays of objects — merging by ID is straightforward

### Offline support (Orbit)

- AsyncStorage holds a local cache of all JSON files
- Edits queue locally when offline
- On reconnect: push queued changes with pull-before-push

---

## orbit-setup CLI (Optional)

For developers who also use Klarity on desktop.

```
npx orbit-setup

Step 1 — Sign in with GitHub
Step 2 — Clone .taskboard repo to ~/.taskboard/
Step 3 — Verify Klarity can read the files
Step 4 — Done
```

If the `.taskboard` repo doesn't exist yet (user hasn't used Orbit), the CLI can create it. But the primary path is: Orbit creates it on phone, CLI just clones it locally.

---

## Tech Stack

| Component | Tech |
|-----------|------|
| Orbit (mobile) | Expo, React Native, TypeScript |
| State management | Zustand |
| Local storage | AsyncStorage, Expo SecureStore |
| GitHub auth | Expo AuthSession (OAuth) |
| GitHub API | Octokit or fetch |
| Voice capture | Expo AV |
| orbit-setup (CLI) | Node.js, TypeScript, @clack/prompts |

---

## Relationship between apps

```
Orbit (phone)                   Klarity (desktop)
  standalone app                  standalone app
       │                               │
       └──── both read/write ──────────┘
                    │
          github.com/user/.taskboard
                (private repo)
```

Neither app depends on the other. A user can use Orbit alone, Klarity alone, or both. The `.taskboard` repo is the shared contract when both are used.

---

## Decided items (from architecture discussion)

- [x] Name: Orbit
- [x] GitHub as primary data source (not local-only)
- [x] `.taskboard` private repo as sync layer
- [x] Orbit creates the repo during onboarding (Option A — with clear explanation)
- [x] orbit-setup CLI is optional (only for Klarity desktop users)
- [x] No backend server needed
- [x] Scan remote first, local second
- [x] Phone uses GitHub Contents API (no git clone on device)
- [x] Post-onboarding auto-detect new repos with banner + agent setup
- [x] README improvement for new repos (scanner + builder agent)

## Backlog

- [ ] **Klarity: Windows desktop notifications for new inbox items** — Use `tauri-plugin-notification` + Rust file watcher on `inbox.json`. Changes: Cargo.toml, tauri.conf.json, main.rs, new watcher.rs module.
