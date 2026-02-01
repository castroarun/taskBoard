# Orbit - Product Requirements Document

**Version:** 1.0
**Created:** 2026-01-28
**Author:** Arun Castro
**Status:** Engineering Phase

---

## Overview

**Orbit** is the mobile companion app for Klarity (desktop). It provides quick project status checks, voice capture on the go, and push notifications — designed for moments when you're away from your desk but want to capture ideas or check progress.

### Tagline
> "Your pocket dashboard for AI-assisted development"

### Core Philosophy
- **Capture, don't edit** — Mobile is for quick input, desktop is for heavy editing
- **Glance, don't browse** — Show summary views, not full documents
- **Voice-first** — Hands-free capture with AI structuring via Groq

---

## Problem Statement

When working on projects with AI coding assistants (Claude Code, Cursor, etc.):

1. **Ideas strike anywhere** — You're commuting, walking, or in a meeting when an idea hits
2. **No quick status check** — Opening Jira on mobile is slow and cluttered
3. **Voice memos get lost** — Raw voice notes need manual processing later
4. **Desktop-only workflow** — Klarity requires being at your computer

### Solution

Orbit fills the gap:
- **Quick capture** — Voice-to-structured-task in seconds (Groq AI)
- **Status glance** — See project health, streaks, blockers instantly
- **Notifications** — Get alerted about deadlines and stale projects
- **Sync with Klarity** — Everything captured syncs to your desktop workflow

---

## Separation of Concerns: Orbit vs Klarity

| Feature | Klarity (Desktop) | Orbit (Mobile) |
|---------|:-----------------:|:------------------:|
| **Project Pipeline Board** | Full CRUD, drag-drop | Read-only view |
| **Task Management** | Full editing, bulk ops | View + quick add |
| **Voice Capture** | Available | **Primary** (star feature) |
| **Inbox** | View + process items | **Quick add** (capture device) |
| **Calendar/Activity** | Full timeline view | Summary (streaks, deep work) |
| **Docs View** | Full PRD/architecture browser | Not included |
| **Settings** | Full config (API keys, integrations) | Profile + sync only |
| **Quick Launch (Ctrl+K)** | Keyboard-first | Not applicable |
| **Notifications** | Basic | **Primary** (mobile is notification device) |
| **Ship Wizard** | Full workflow | Trigger + status only |
| **Theme Toggle** | Yes | Yes |

### Golden Rule
> Orbit is for **capture and glance**. Klarity is for **edit and work**.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Expo | React Native framework, easy deployment |
| React Native | Cross-platform mobile UI |
| TypeScript | Type safety |
| expo-router | File-based navigation |
| @react-native-voice/voice | Native speech recognition |
| Groq API | Whisper (transcription) + LLaMA (structuring) |
| Git (via API) | Data sync with Klarity |

---

## Data Architecture

### Single Source of Truth

```
┌─────────────────┐         ┌─────────────────┐
│   Klarity       │         │   Orbit         │
│   (Desktop)     │         │   (Mobile)      │
├─────────────────┤         ├─────────────────┤
│ • Full CRUD     │         │ • Read + Add    │
│ • File access   │         │ • Voice capture │
│ • Docs browser  │         │ • Notifications │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    ┌──────────────────┐   │
         └───►│  Git Repo        │◄──┘
              │  (Single Source) │
              │                  │
              │  public/data/    │
              │  ├─ projects.json│
              │  ├─ tasks.json   │
              │  ├─ inbox.json   │
              │  └─ config.json  │
              └──────────────────┘
```

### Sync Strategy

1. **Klarity** writes directly to local JSON files
2. Changes commit to git (manual or auto-commit)
3. **Orbit** pulls from git periodically or on-demand
4. Orbit writes go to a "pending" queue → synced back via:
   - Git commit from mobile (if repo access)
   - Cloud API (if configured)
   - Local queue processed when Klarity opens

### Data Files

| File | Read | Write | Notes |
|------|:----:|:-----:|-------|
| `projects.json` | Yes | No | View only |
| `tasks.json` | Yes | Add only | Quick task add |
| `inbox.json` | Yes | Yes | Primary capture target |
| `config.json` | Partial | No | Read sync settings only |
| `activities.json` | Yes | No | For calendar summary |

---

## Core Features

### 1. Dashboard (Home)

**Purpose:** At-a-glance project health and quick actions

**Elements:**
- Greeting with user name and date
- **Recommended Now** card (most relevant project to work on)
- **Project Health** summary (healthy/needs work/incomplete counts)
- **Stage Overview** (idea/build/test/live counts)
- **Action Items** (blockers, overdue tasks, unread inbox)
- Voice capture FAB (floating action button)

**Data Sources:**
- `projects.json` for project list and stages
- `tasks.json` for action items
- `inbox.json` for unread count

### 2. Voice Capture (Star Feature)

**Purpose:** Hands-free idea/task capture with AI structuring

**Flow:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  1. Record  │ ──► │ 2. Transcribe│ ──► │ 3. Structure │
│  (Mic tap)  │     │  (Whisper)  │     │   (LLaMA)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                           ┌───────────────────────────────┐
                           │ 4. Review & Confirm            │
                           │    - Title (editable)          │
                           │    - Description (editable)    │
                           │    - Priority (P0-P3)          │
                           │    - Target (project/inbox)    │
                           └───────────────────────────────┘
                                               │
                                               ▼
                           ┌───────────────────────────────┐
                           │ 5. Save to Inbox/Task          │
                           │    (synced to Klarity)         │
                           └───────────────────────────────┘
```

**AI Structuring (via Groq):**

Input (raw voice):
> "I need to fix that bug in the login page where users can't reset their password it's been annoying people for a while now probably high priority"

Output (structured):
```json
{
  "title": "Fix password reset on login page",
  "description": "Users are unable to reset passwords from the login page. Recurring issue affecting user experience.",
  "priority": "P1",
  "complexity": "S",
  "targetProject": null
}
```

**LLaMA Prompt (same as Klarity):**
```
You are a task structuring assistant. Convert voice input into a structured task.
Extract:
- title: A clear, concise task title (max 60 chars)
- description: Detailed description of what needs to be done
- priority: P0 (critical/urgent), P1 (high), P2 (medium), P3 (low)
- complexity: XS (trivial), S (small), M (medium), L (large), XL (very large)

Respond ONLY with valid JSON in this exact format:
{"title": "...", "description": "...", "priority": "P2", "complexity": "M"}

If the input is unclear, make reasonable assumptions. Default to P2 priority and M complexity if not specified.
```

**UI States:**
1. **Idle** — FAB visible, tap to start
2. **Recording** — Pulse animation, waveform, "Listening..."
3. **Processing** — Spinner, "Structuring with AI..."
4. **Review** — Show structured result, allow edits
5. **Success** — Toast "Saved! Claude will pick this up"

### 3. Project List

**Purpose:** Browse all projects with stage filtering

**Elements:**
- Search/filter bar
- Stage filter tabs (All, Idea, Build, Test, Live)
- Project cards showing:
  - Name and description
  - Progress bar
  - Stage badge (color-coded)
  - Last updated
- Tap to view project detail

**Interaction:**
- Pull-to-refresh syncs from git
- Tap project → Project Detail view
- Long-press → Quick actions (add task, mark stale)

### 4. Project Detail

**Purpose:** View single project status and quick actions

**Elements:**
- Project header (name, stage, progress)
- **Next Action** card (current task or blocker)
- **Recent Activity** timeline (last 5 activities)
- **Quick Actions:**
  - Add voice instruction (opens voice capture with project context)
  - Add task (simple form)
  - View on desktop (deep link intent)

**Not Included (desktop-only):**
- Full task list editing
- Document browser
- Stage transitions

### 5. Inbox Capture

**Purpose:** Quick text capture without voice

**Elements:**
- Text input field with placeholder
- Priority picker (P0-P3)
- Project selector (optional)
- "Add to Inbox" button

**Use Cases:**
- Quick note in a meeting (can't use voice)
- Copy-paste from another app
- Thought that doesn't need AI structuring

### 6. Activity Summary

**Purpose:** See work patterns and streaks

**Elements:**
- **Streak counter** (consecutive days with activity)
- **This week summary** (hours per day bar chart)
- **Deep work indicator** (days with 6h+ focus)
- **Project breakdown** (time per project this week)

**Not Included (desktop-only):**
- Full calendar view
- Detailed activity list
- Activity editing

### 7. Ship Wizard (Trigger Only)

**Purpose:** Start ship process from mobile

**Elements:**
- Project selector
- Checklist summary (from desktop config)
- "Ready to Ship" confirmation
- Status tracking after trigger

**Flow:**
1. User selects project
2. See pre-ship checklist (tests pass, docs updated, etc.)
3. Tap "Trigger Ship"
4. Ship process starts (actual work happens on desktop/CI)
5. User gets notification when complete

### 8. Settings

**Purpose:** Profile and sync configuration

**Elements:**
- **Profile** — Name, avatar
- **Sync Settings:**
  - Git repo URL
  - Sync frequency (manual/15min/1hr)
  - Last sync timestamp
  - Force sync button
- **Groq API Key** — For voice AI (optional, falls back to config.json)
- **Notifications:**
  - Enable/disable
  - Stale project alerts (days threshold)
  - Deadline reminders
- **Theme** — Light/Dark toggle
- **About** — Version, links

**Not Included (desktop-only):**
- Full API key management
- Integration settings (Jira, etc.)
- Advanced config

### 9. Push Notifications

**Purpose:** Proactive alerts for project health

**Notification Types:**

| Type | Trigger | Message |
|------|---------|---------|
| Stale Project | No activity for X days | "Numbers Game hasn't been updated in 5 days" |
| Deadline | Task due soon | "Task 'Add leaderboard' due tomorrow" |
| Blocker | Task marked blocked | "Blocker on PRIMMO: API rate limit issue" |
| Ship Complete | CI/CD finishes | "Portfolio deployed successfully!" |
| Inbox Response | Claude replies to inbox | "Claude responded to your inbox item" |

**Settings:**
- Global enable/disable
- Per-type toggle
- Quiet hours
- Stale threshold (default: 3 days)

---

## UI/UX Specifications

### Design Language

- **Light theme default** (mobile convention)
- **Dark theme available** (toggle in settings)
- **iOS-inspired** aesthetics (rounded corners, subtle shadows)
- **Touch-friendly** targets (min 44pt)
- **Bottom navigation** (Home, Projects, Ship, Settings)

### Color Palette

| Element | Light | Dark |
|---------|-------|------|
| Background | `#f5f5f5` | `#09090B` |
| Surface | `#ffffff` | `#18181B` |
| Primary | `#10b981` (emerald) | `#10b981` |
| Text Primary | `#111827` | `#fafafa` |
| Text Secondary | `#6b7280` | `#71717a` |

### Stage Colors (same as Klarity)

| Stage | Color |
|-------|-------|
| Design | Pink `#ec4899` |
| Engineering | Sky `#0ea5e9` |
| Build | Yellow `#eab308` |
| Launch | Green `#22c55e` |
| Closure | Teal `#14b8a6` |

### Typography

- **Font:** Inter (system fallback: SF Pro, Roboto)
- **Heading:** 600 weight
- **Body:** 400 weight
- **Caption:** 400 weight, muted color

---

## Navigation Structure

```
├── Home (Dashboard)
│   └── Voice Capture (Modal)
├── Projects
│   └── Project Detail
│       └── Voice Capture (with project context)
├── Ship
│   └── Ship Wizard
└── Settings
    └── Sync Settings
```

### Bottom Tab Bar

| Icon | Label | Screen |
|------|-------|--------|
| Home | Home | Dashboard |
| Folder | Projects | Project List |
| Rocket | Ship | Ship Wizard |
| Gear | Settings | Settings |

### Floating Action Button (FAB)

- Always visible on Home and Projects screens
- Microphone icon
- Emerald color with shadow
- Opens Voice Capture modal
- "Groq" badge underneath

---

## API Integrations

### Groq (Required)

**Endpoints:**
- `POST /openai/v1/audio/transcriptions` — Whisper
- `POST /openai/v1/chat/completions` — LLaMA

**Authentication:** Bearer token (API key)

**Rate Limits:**
- Whisper: 25 requests/minute
- LLaMA: 30 requests/minute

### GitHub (Optional)

**For sync:**
- Read raw files from repo
- Create commits for captures

**Alternative:** Local file sync via filesystem (if repo cloned)

---

## Offline Behavior

### What Works Offline

- View cached project list
- View cached dashboard
- Record voice (saved locally)
- Add to inbox (queued)
- View cached activities

### What Requires Connection

- AI structuring (Groq)
- Sync with git
- Ship trigger
- Real-time notifications

### Offline Queue

Captures made offline are:
1. Stored in local AsyncStorage
2. Marked with `synced: false`
3. Automatically synced when online
4. User sees "Pending sync" badge

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Cold start | < 2s |
| Voice capture start | < 500ms |
| Groq transcription | < 3s |
| Groq structuring | < 2s |
| Sync refresh | < 5s |
| App size | < 50MB |

---

## Security

- API keys stored in secure storage (Expo SecureStore)
- No sensitive data in AsyncStorage
- Git credentials via system keychain
- Optional biometric lock for app

---

## Roadmap

### v0.1 (MVP)
- [ ] Dashboard with project health
- [ ] Voice capture with Groq AI
- [ ] Project list (read-only)
- [ ] Basic sync with git
- [ ] Light/dark theme

### v0.2
- [ ] Push notifications
- [ ] Inbox view and capture
- [ ] Activity summary
- [ ] Offline queue

### v0.3
- [ ] Ship wizard trigger
- [ ] Project detail view
- [ ] Quick task add
- [ ] Widget (home screen)

### v1.0
- [ ] Full notification system
- [ ] Biometric lock
- [ ] Watch companion (stretch)

---

## Mockup Files

| Screen | File | Status |
|--------|------|--------|
| Dashboard | `mockups/dashboard.html` | Updated |
| Project List | `mockups/project-list.html` | Existing |
| Project Detail | `mockups/project-detail.html` | Existing |
| Voice Capture | `mockups/voice-capture.html` | Updated |
| Inbox Capture | `mockups/inbox-capture.html` | New |
| Ship Wizard | `mockups/ship-wizard.html` | Existing |
| Settings | `mockups/settings.html` | Existing |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Voice captures per week | 10+ |
| Time from voice to structured | < 10s |
| Daily active opens | 3+ |
| Sync failures | < 1% |
| User satisfaction (if surveyed) | 4.5/5 |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Next Review:** After MVP implementation
