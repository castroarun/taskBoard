# Launchpad - Project Orchestrator

> Android app to orchestrate all your GitHub projects with smart notifications, health tracking, and shipping workflows.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [GitHub Actions + Vercel Combo Explained](#github-actions--vercel-combo-explained)
4. [Sync Mechanisms](#sync-mechanisms)
5. [Repo Processing Logic](#repo-processing-logic)
6. [Notification System](#notification-system)
7. [App Screens](#app-screens)
8. [Data Structures](#data-structures)
9. [API Endpoints](#api-endpoints)
10. [Build Phases](#build-phases)
11. [Cost Analysis](#cost-analysis)

---

## Overview

### Problem

- 11+ projects scattered across different stages
- No single view of "where is everything?"
- Context switching kills momentum
- No systematic way to ship and announce
- Hard to decide "what should I work on today?"

### Solution

Launchpad is a personal project orchestration hub that:

1. **Monitors all public GitHub repos** automatically
2. **Parses README status blocks** for project metadata
3. **Sends proactive notifications** (stale, deadline, health)
4. **Helps ship projects** with checklists and LinkedIn drafts
5. **Identifies action items** when repos aren't properly configured

### Core Philosophy

> "The app finds YOU, not the other way around"

You shouldn't need to open the app to know what's happening. It nudges you at the right time.

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAUNCHPAD ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               ANDROID APP (React Native)                  │  │
│  │                                                           │  │
│  │  • Dashboard, project list, ship wizard                   │  │
│  │  • Pull-to-refresh calls /api/sync                        │  │
│  │  • Receives FCM push notifications                        │  │
│  │  • Offline-first with local cache                         │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                │
│                        REST API calls                           │
│                                │                                │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │              VERCEL SERVERLESS BACKEND                    │  │
│  │                                                           │  │
│  │  /api/sync           Fetch repos, parse READMEs           │  │
│  │  /api/projects       Get processed project list           │  │
│  │  /api/health         Get action items                     │  │
│  │  /api/notify         Send FCM notification                │  │
│  │                                                           │  │
│  │  Storage: Vercel KV (Redis) for caching                   │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │              GITHUB ACTIONS (Scheduler)                   │  │
│  │                                                           │  │
│  │  • Scheduled sync every 6 hours                           │  │
│  │  • Real-time trigger on README push                       │  │
│  │  • Calls Vercel endpoints                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                FIREBASE (Notifications)                   │  │
│  │                                                           │  │
│  │  • FCM for Android push                                   │  │
│  │  • Firestore for user prefs + FCM tokens                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile App | React Native | Android app with native feel |
| Backend | Vercel Serverless | API endpoints, repo processing |
| Scheduler | GitHub Actions | Cron jobs (free, unlimited) |
| Cache | Vercel KV (Redis) | Store processed project data |
| Notifications | Firebase FCM | Android push notifications |
| User Data | Firebase Firestore | Preferences, FCM tokens |
| Auth | GitHub OAuth | Login + repo access |

---

## GitHub Actions + Vercel Combo Explained

### Why This Combo?

| Component | Role | Why Not Just One? |
|-----------|------|-------------------|
| **GitHub Actions** | Scheduler (cron) | Vercel free tier only allows daily crons. GitHub Actions allows any frequency for free. |
| **Vercel** | Compute (execution) | GitHub Actions isn't ideal for API hosting. Vercel gives instant API endpoints. |

### How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   GITHUB ACTIONS                      VERCEL                    │
│   ══════════════                      ══════                    │
│   Role: SCHEDULER                     Role: EXECUTOR            │
│   (When to run)                       (What to run)             │
│                                                                 │
│   ┌─────────────────┐                ┌─────────────────┐        │
│   │                 │                │                 │        │
│   │  Cron Job       │───── POST ────▶│  /api/sync      │        │
│   │  (every 6 hrs)  │                │                 │        │
│   │                 │                │  Executes:      │        │
│   └─────────────────┘                │  • Fetch repos  │        │
│                                      │  • Parse README │        │
│                                      │  • Check alerts │        │
│   ┌─────────────────┐                │  • Send FCM     │        │
│   │                 │                │                 │        │
│   │  Push Trigger   │───── POST ────▶│                 │        │
│   │  (on README     │                │                 │        │
│   │   change)       │                └─────────────────┘        │
│   │                 │                                           │
│   └─────────────────┘                                           │
│                                                                 │
│   COST: $0                           COST: $0                   │
│   LIMIT: 2000 mins/month             LIMIT: 100K invocations    │
│   USED: ~120 mins/month              USED: ~500/month           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Analogy

Think of it like:
- **GitHub Actions** = Alarm clock (decides WHEN to wake up)
- **Vercel** = You doing the work (WHAT happens after alarm rings)

The alarm clock (GitHub Actions) rings every 6 hours and says "Hey Vercel, time to check all the repos!" Vercel then does the actual work.

### Why Not Use Vercel's Native Cron?

| Plan | Vercel Cron Limit | GitHub Actions |
|------|-------------------|----------------|
| Free | 2 crons, **once per day max** | **Unlimited, any frequency** |
| Pro ($20/mo) | 40 crons, every minute | Same |

Since we want **every 6 hours** (4x daily), GitHub Actions is the free solution.

---

## Sync Mechanisms

There are **two sync mechanisms**:

### 1. Scheduled Sync (Every 6 Hours)

**Purpose**: Regular full sync of all repos

**Flow**:
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  GitHub Action  │      │  Vercel /api/   │      │  Firebase FCM   │
│  (Cron: 0 */6)  │─────▶│  sync           │─────▶│  (if alerts)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │
        │                        ├── Fetch ALL public repos
        │                        ├── Parse each README
        │                        ├── Calculate health scores
        │                        ├── Detect alerts (stale, deadline)
        │                        ├── Store in Vercel KV
        │                        └── Send notifications if needed
        │
    Runs at:
    • 00:00 UTC
    • 06:00 UTC
    • 12:00 UTC
    • 18:00 UTC
```

**GitHub Action File**: `.github/workflows/launchpad-sync.yml`

```yaml
name: Launchpad Scheduled Sync

on:
  schedule:
    # Every 6 hours: midnight, 6am, noon, 6pm UTC
    - cron: '0 */6 * * *'
  
  # Allow manual trigger from GitHub UI
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Vercel Sync
        run: |
          response=$(curl -s -w "\n%{http_code}" -X POST \
            "${{ secrets.VERCEL_SYNC_URL }}/api/sync" \
            -H "Authorization: Bearer ${{ secrets.LAUNCHPAD_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger": "scheduled", "full": true}')
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | sed '$d')
          
          echo "Response: $body"
          echo "Status: $http_code"
          
          if [ "$http_code" != "200" ]; then
            echo "Sync failed!"
            exit 1
          fi

      - name: Log Result
        run: |
          echo "✅ Scheduled sync completed at $(date)"
```

**Secrets Required**:
- `VERCEL_SYNC_URL`: Your Vercel deployment URL (e.g., `https://launchpad-api.vercel.app`)
- `LAUNCHPAD_API_TOKEN`: Secret token to authenticate requests

---

### 2. Real-Time Trigger (On README Push)

**Purpose**: Instant update when you modify a project's README

**Flow**:
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  You push to    │      │  GitHub Action  │      │  Vercel /api/   │
│  README.md      │─────▶│  (push trigger) │─────▶│  sync?repo=X    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                          │
                                                          ├── Fetch ONLY this repo
                                                          ├── Parse README
                                                          ├── Update cache
                                                          └── No notification (user initiated)
```

**Why Real-Time?**

Without this, if you update a README at 1 PM, the app won't reflect it until the next scheduled sync (could be 5 hours later). Real-time trigger = instant update.

**GitHub Action File**: Add to EACH project repo

`.github/workflows/notify-launchpad.yml`

```yaml
name: Notify Launchpad

on:
  push:
    branches: [main, master]
    paths:
      - 'README.md'  # Only triggers when README changes

jobs:
  notify:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Launchpad Update
        run: |
          curl -X POST \
            "${{ secrets.LAUNCHPAD_SYNC_URL }}/api/sync" \
            -H "Authorization: Bearer ${{ secrets.LAUNCHPAD_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "trigger": "push",
              "repo": "${{ github.repository }}",
              "full": false
            }'
          
          echo "✅ Notified Launchpad about README change in ${{ github.repository }}"
```

**Alternative: Organization-wide Webhook**

Instead of adding workflow to each repo, you can set up a GitHub webhook at org level:

1. Go to GitHub → Settings → Webhooks
2. Add webhook URL: `https://launchpad-api.vercel.app/api/webhook`
3. Select events: `push`
4. Vercel endpoint filters for README changes

---

### 3. Manual Sync (Pull-to-Refresh)

**Purpose**: User-initiated refresh from the app

**Flow**:
```
┌─────────────────┐      ┌─────────────────┐
│  User pulls to  │      │  Vercel /api/   │
│  refresh in app │─────▶│  sync           │
└─────────────────┘      └─────────────────┘
```

This is just the app calling `/api/sync` directly. Same endpoint, different trigger.

---

### Sync Comparison Table

| Sync Type | Trigger | Frequency | Scope | Notifications? |
|-----------|---------|-----------|-------|----------------|
| Scheduled | GitHub Actions cron | Every 6 hours | All repos | Yes, if alerts found |
| Real-time | README push event | On each push | Single repo | No (user knows) |
| Manual | Pull-to-refresh | User initiated | All repos | No |

---

## Repo Processing Logic

### All Public Repos = Projects

The app automatically considers every public repo as a project. No manual registration needed.

```
┌─────────────────────────────────────────────────────────────────┐
│                     REPO PROCESSING FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GitHub API: GET /users/{username}/repos?type=public            │
│                              │                                  │
│                              ▼                                  │
│                ┌─────────────────────────┐                      │
│                │   For each public repo  │                      │
│                └────────────┬────────────┘                      │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│   ┌───────────┐      ┌─────────────┐     ┌─────────────┐       │
│   │ Has       │      │ Has README  │     │ No README   │       │
│   │ LAUNCHPAD │      │ but no      │     │ at all      │       │
│   │ block ✓   │      │ LAUNCHPAD   │     │             │       │
│   └─────┬─────┘      └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│   ┌───────────┐      ┌─────────────┐     ┌─────────────┐       │
│   │ Parse &   │      │ Action Item │     │ Action Item │       │
│   │ display   │      │ "Add status │     │ "Add README"│       │
│   │ normally  │      │  block"     │     │             │       │
│   └───────────┘      └─────────────┘     └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### README LAUNCHPAD Block Format

Each repo should have this block in its README.md:

```markdown
# Project Name

Description of the project.

<!-- LAUNCHPAD:START -->
```json
{
  "stage": "building",
  "progress": 40,
  "complexity": "F",
  "lastUpdated": "2026-01-17",
  "targetDate": "2026-01-30",
  "nextAction": "Finish Quick Launch module",
  "blocker": null,
  "demoUrl": null,
  "techStack": ["React", "Tauri", "Tailwind"],
  "shipped": false,
  "linkedinPosted": false
}
```
<!-- LAUNCHPAD:END -->

## Features
...rest of README...
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | Yes | `idea` \| `building` \| `testing` \| `live` \| `paused` |
| `progress` | number | Yes | 0-100 percentage |
| `complexity` | string | No | `E` (easy) \| `F` (full effort) |
| `lastUpdated` | date | Yes | YYYY-MM-DD, when status was last updated |
| `targetDate` | date | No | YYYY-MM-DD, target completion date |
| `nextAction` | string | Yes | What to do in next work session |
| `blocker` | string | No | What's blocking progress (null if none) |
| `demoUrl` | string | No | Live demo URL |
| `techStack` | array | No | Technologies used |
| `shipped` | boolean | No | Has it been shipped/released? |
| `linkedinPosted` | boolean | No | Has LinkedIn announcement been made? |

### Health Score Calculation

Each repo gets a health score based on completeness:

| Check | Points | Action Item if Missing |
|-------|--------|------------------------|
| README exists | 10 | "Add README.md" |
| LAUNCHPAD block present | 20 | "Add LAUNCHPAD status block to README" |
| `stage` defined | 10 | "Set project stage" |
| `nextAction` defined | 15 | "Define next action" |
| `targetDate` set (if not live) | 10 | "Set target date" |
| `progress` updated within 14 days | 15 | "Update progress (stale)" |
| `demoUrl` present (if stage=live) | 10 | "Add demo URL" |
| `techStack` defined | 10 | "Add tech stack" |

**Health Status**:
```
🟢 80-100  Healthy      - Good to go
🟡 50-79   Needs work   - Some fields missing
🔴 0-49    Incomplete   - Needs setup
```

---

## Notification System

### Notification Triggers

| Trigger | Condition | Message | When Sent |
|---------|-----------|---------|-----------|
| **Stale Project** | No commits in X days (default: 7) | "Numbers Game untouched for 7 days" | Morning (8 AM) |
| **Target Approaching** | Target date within 3 days | "Desktop App target in 3 days" | Morning |
| **Target Missed** | Target date passed | "Voice Task was due yesterday" | Day after |
| **Low Health** | Health score < 50 | "Primno needs setup" | On detection |
| **Ready to Ship** | Progress ≥ 90% | "Numbers Game ready to ship!" | On detection |
| **LinkedIn Reminder** | Shipped but not posted | "Posted 3 days ago, LinkedIn pending" | 3 days after ship |
| **Weekly Digest** | Every Sunday | Summary of all projects | Sunday 6 PM |

### FCM Notification Structure

```typescript
interface LaunchpadNotification {
  type: 'stale' | 'deadline' | 'health' | 'ship_ready' | 'linkedin' | 'digest';
  title: string;
  body: string;
  data: {
    projectName?: string;
    projectUrl?: string;
    action?: 'view' | 'snooze' | 'ship';
  };
}

// Example
{
  type: 'stale',
  title: '😴 Numbers Game needs attention',
  body: 'No activity for 7 days. Progress: 85% - almost there!',
  data: {
    projectName: 'numbers-game',
    projectUrl: 'https://github.com/user/numbers-game',
    action: 'view'
  }
}
```

### Notification Settings (User Configurable)

```typescript
interface NotificationPreferences {
  enabled: boolean;
  quietHoursStart: string;  // "22:00"
  quietHoursEnd: string;    // "07:00"
  
  triggers: {
    staleProject: {
      enabled: boolean;
      daysThreshold: number;  // default: 7
    };
    targetApproaching: {
      enabled: boolean;
      daysThreshold: number;  // default: 3
    };
    weeklyDigest: {
      enabled: boolean;
      dayOfWeek: number;  // 0=Sunday
      time: string;       // "18:00"
    };
    shipReady: boolean;
    linkedinReminder: boolean;
  };
}
```

---

## App Screens

### 1. Home Dashboard

```
┌─────────────────────────────────────────┐
│ ≡  LAUNCHPAD                        🔔  │
├─────────────────────────────────────────┤
│                                         │
│  Good evening, Arun                     │
│  Saturday, Jan 17                       │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🎯 RECOMMENDED NOW                  ││
│  │                                     ││
│  │ Numbers Game                        ││
│  │ ████████████████░░░░ 85%           ││
│  │ "Add leaderboard"                   ││
│  │ ⏱️ ~2 hours to ship                 ││
│  │                                     ││
│  │ [START SESSION]                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  📊 REPO HEALTH                         │
│  ┌─────────────────────────────────────┐│
│  │ 🟢 Healthy      5 repos             ││
│  │ 🟡 Needs work   4 repos             ││
│  │ 🔴 Incomplete   3 repos             ││
│  └─────────────────────────────────────┘│
│                                         │
│  📈 PROJECT STAGES                      │
│  ┌────────┬────────┬────────┬────────┐ │
│  │ 💡     │ 🔨     │ 🧪     │ 🚀     │ │
│  │ Idea   │ Build  │ Test   │ Live   │ │
│  │   2    │   5    │   2    │   2    │ │
│  └────────┴────────┴────────┴────────┘ │
│                                         │
│  🔴 ACTION ITEMS (7)                    │
│  ┌─────────────────────────────────────┐│
│  │ 📝 medical-reports                  ││
│  │    "Add LAUNCHPAD block to README"  ││
│  │                                     ││
│  │ 📝 primno                           ││
│  │    "Add README.md"                  ││
│  │                                     ││
│  │ [View all 7 items]                  ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  🏠        📂        🚀        ⚙️       │
│ Home    Projects    Ship    Settings    │
└─────────────────────────────────────────┘
```

### 2. Projects List

```
┌─────────────────────────────────────────┐
│ ←  PROJECTS                     🔍  ↕️  │
├─────────────────────────────────────────┤
│                                         │
│ [All] [💡] [🔨] [🧪] [🚀] [🔴 Action]   │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🎮 Numbers Game         🟢  E  🧪  ││
│  │ ████████████████░░░░ 85%           ││
│  │ Target: Jan 20 (3 days)             ││
│  │ Next: Add leaderboard               ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🖥️ Desktop Command Center  🟢  F  🔨 ││
│  │ ████████░░░░░░░░░░░░ 40%           ││
│  │ Target: Jan 30 (13 days)            ││
│  │ Next: Finish Quick Launch module    ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🏥 Medical Reports      🔴  -  💡  ││
│  │ ░░░░░░░░░░░░░░░░░░░░ --            ││
│  │ ⚠️ Add LAUNCHPAD block              ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🎵 Castronix Music      🟢  E  🚀  ││
│  │ ████████████████████ 100%          ││
│  │ 🟢 Cinder: Live                     ││
│  │ 🟡 Red Dot: Upcoming                ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  🏠        📂        🚀        ⚙️       │
└─────────────────────────────────────────┘
```

### 3. Project Detail

```
┌─────────────────────────────────────────┐
│ ←  Desktop Command Center          ⋮    │
├─────────────────────────────────────────┤
│                                         │
│  🔨 BUILDING                   🟢  F   │
│  ████████░░░░░░░░░░░░ 40%              │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📅 Target       Jan 30 (13 days)    ││
│  │ 🕐 Last commit  3 days ago          ││
│  │ 📊 Last update  Jan 15              ││
│  │ 🔗 GitHub       Public ✓            ││
│  │ 🌐 Demo         Not deployed        ││
│  └─────────────────────────────────────┘│
│                                         │
│  📌 NEXT ACTION                         │
│  ┌─────────────────────────────────────┐│
│  │ Finish Quick Launch module          ││
│  └─────────────────────────────────────┘│
│                                         │
│  🚫 BLOCKER                             │
│  ┌─────────────────────────────────────┐│
│  │ None                                ││
│  └─────────────────────────────────────┘│
│                                         │
│  🛠️ TECH STACK                          │
│  [React] [Tauri] [Tailwind]             │
│                                         │
│  📋 HEALTH CHECKLIST                    │
│  ☑️ README exists                       │
│  ☑️ LAUNCHPAD block                     │
│  ☑️ Stage defined                       │
│  ☑️ Next action set                     │
│  ☑️ Target date set                     │
│  ☐ Demo URL (not required yet)          │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🔗 Open GitHub    🚀 Ship Project  ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  🏠        📂        🚀        ⚙️       │
└─────────────────────────────────────────┘
```

### 4. Ship Wizard

```
┌─────────────────────────────────────────┐
│ ←  Ship: Numbers Game                   │
├─────────────────────────────────────────┤
│                                         │
│  🚀 SHIPPING CHECKLIST                  │
│                                         │
│  Pre-flight                             │
│  ┌─────────────────────────────────────┐│
│  │ ☑️ Code complete                    ││
│  │ ☑️ README with LAUNCHPAD block      ││
│  │ ☑️ Demo URL working                 ││
│  │ ☐ Screenshots in repo               ││
│  │ ☐ GitHub repo public                ││
│  │ ☐ Production deployed               ││
│  └─────────────────────────────────────┘│
│                                         │
│  [✓ Verify All]                         │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  📝 LINKEDIN POST DRAFT                 │
│  ┌─────────────────────────────────────┐│
│  │ 🎮 Just shipped: Numbers Game       ││
│  │                                     ││
│  │ A mental math challenge I built to  ││
│  │ sharpen arithmetic skills.          ││
│  │                                     ││
│  │ Tech: React, Tailwind, Vercel       ││
│  │ Time: 2 weekends                    ││
│  │                                     ││
│  │ 🔗 Try it: [demo-url]               ││
│  │ 💻 Source: [github-url]             ││
│  │                                     ││
│  │ #buildinpublic #react #indiedev     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [✏️ Edit] [📋 Copy] [📤 Share]         │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │       ✅ MARK AS SHIPPED            ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

### 5. Settings

```
┌─────────────────────────────────────────┐
│ ←  SETTINGS                             │
├─────────────────────────────────────────┤
│                                         │
│  👤 ACCOUNT                             │
│  ┌─────────────────────────────────────┐│
│  │ GitHub: arun-xxx                    ││
│  │ Last sync: 2 hours ago      [Sync]  ││
│  │                           [Logout]  ││
│  └─────────────────────────────────────┘│
│                                         │
│  🔔 NOTIFICATIONS                       │
│  ┌─────────────────────────────────────┐│
│  │ Push notifications           [ON ]  ││
│  │                                     ││
│  │ Quiet hours                  [ON ]  ││
│  │   10:00 PM - 7:00 AM                ││
│  │                                     ││
│  │ ─────────────────────────────────   ││
│  │                                     ││
│  │ Stale project alert          [ON ]  ││
│  │   After: [7 days      ▼]            ││
│  │                                     ││
│  │ Target approaching           [ON ]  ││
│  │   Before: [3 days     ▼]            ││
│  │                                     ││
│  │ Weekly digest                [ON ]  ││
│  │   Day: [Sunday        ▼]            ││
│  │   Time: [6:00 PM      ▼]            ││
│  │                                     ││
│  │ Ship ready alert             [ON ]  ││
│  │ LinkedIn reminder            [ON ]  ││
│  └─────────────────────────────────────┘│
│                                         │
│  ⏰ WORK SCHEDULE                       │
│  ┌─────────────────────────────────────┐│
│  │ Used for smart recommendations      ││
│  │                                     ││
│  │ Weekdays:   8 PM - 11 PM            ││
│  │ Weekends:   10 AM - 1 PM            ││
│  │             8 PM - 11 PM            ││
│  │                          [Edit]     ││
│  └─────────────────────────────────────┘│
│                                         │
│  🎨 APPEARANCE                          │
│  ┌─────────────────────────────────────┐│
│  │ Theme              [Dark        ▼]  ││
│  └─────────────────────────────────────┘│
│                                         │
│  📖 ABOUT                               │
│  ┌─────────────────────────────────────┐│
│  │ Version 1.0.0                       ││
│  │ Made by Castronix                   ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

---

## Data Structures

### Project (Processed)

```typescript
interface Project {
  // From GitHub API
  name: string;              // repo name
  fullName: string;          // user/repo
  url: string;               // github URL
  description: string;       // repo description
  isPublic: boolean;
  lastCommit: string;        // ISO date
  stars: number;
  
  // From LAUNCHPAD block (if present)
  launchpad: {
    stage: 'idea' | 'building' | 'testing' | 'live' | 'paused';
    progress: number;
    complexity: 'E' | 'F' | null;
    lastUpdated: string;
    targetDate: string | null;
    nextAction: string;
    blocker: string | null;
    demoUrl: string | null;
    techStack: string[];
    shipped: boolean;
    linkedinPosted: boolean;
  } | null;
  
  // Calculated
  health: {
    score: number;           // 0-100
    status: 'healthy' | 'needs_work' | 'incomplete';
    actionItems: string[];
  };
  
  // Metadata
  lastSynced: string;        // ISO date
}
```

### Cached State (Vercel KV)

```typescript
interface CachedState {
  projects: Project[];
  lastFullSync: string;      // ISO date
  syncCount: number;
  
  // For comparison (detect changes)
  projectHashes: {
    [repoName: string]: string;  // hash of project state
  };
}
```

### User Preferences (Firestore)

```typescript
interface UserPreferences {
  githubUsername: string;
  fcmToken: string;
  
  notifications: NotificationPreferences;
  
  workSchedule: {
    weekdays: { start: string; end: string }[];
    weekends: { start: string; end: string }[];
  };
  
  theme: 'dark' | 'light';
  
  createdAt: string;
  updatedAt: string;
}
```

---

## API Endpoints

### Base URL
```
https://launchpad-api.vercel.app
```

### Endpoints

#### `POST /api/sync`

Syncs repos from GitHub.

**Request:**
```json
{
  "trigger": "scheduled" | "push" | "manual",
  "repo": "user/repo-name",  // optional, for single repo sync
  "full": true | false
}
```

**Response:**
```json
{
  "success": true,
  "synced": 12,
  "alerts": 3,
  "timestamp": "2026-01-17T10:00:00Z"
}
```

#### `GET /api/projects`

Get all processed projects.

**Response:**
```json
{
  "projects": [...],
  "lastSync": "2026-01-17T10:00:00Z",
  "summary": {
    "total": 12,
    "byStage": { "idea": 2, "building": 5, "testing": 2, "live": 3 },
    "byHealth": { "healthy": 6, "needs_work": 4, "incomplete": 2 }
  }
}
```

#### `GET /api/health`

Get action items across all repos.

**Response:**
```json
{
  "actionItems": [
    {
      "repo": "medical-reports",
      "items": ["Add LAUNCHPAD block to README"]
    },
    {
      "repo": "primno",
      "items": ["Add README.md"]
    }
  ],
  "totalCount": 7
}
```

#### `POST /api/notify`

Send FCM notification (internal use).

**Request:**
```json
{
  "type": "stale",
  "projectName": "numbers-game",
  "title": "...",
  "body": "..."
}
```

---

## Build Phases

### Phase 1: Foundation (Weekend 1)

- [ ] Set up React Native project with dark theme
- [ ] Implement GitHub OAuth login
- [ ] Create Vercel backend with `/api/sync` and `/api/projects`
- [ ] Build basic dashboard showing repo list
- [ ] Set up Vercel KV for caching

### Phase 2: Core Features (Weekend 2)

- [ ] Implement README parsing (LAUNCHPAD block extraction)
- [ ] Add health score calculation
- [ ] Build project list with filters
- [ ] Build project detail screen
- [ ] Add pull-to-refresh manual sync

### Phase 3: Notifications (Weekend 3)

- [ ] Set up Firebase project (FCM + Firestore)
- [ ] Implement FCM token registration
- [ ] Create GitHub Actions scheduled workflow
- [ ] Build notification trigger logic
- [ ] Add notification settings screen

### Phase 4: Ship Wizard (Weekend 4)

- [ ] Build ship wizard screen
- [ ] Implement shipping checklist
- [ ] Create LinkedIn post generator
- [ ] Add share functionality

### Phase 5: Polish & Deploy (Week 5)

- [ ] Real-time sync (push trigger workflow)
- [ ] Work schedule & smart recommendations
- [ ] UI polish and animations
- [ ] Play Store submission
- [ ] Create README template for other repos

---

## Cost Analysis

| Service | Free Tier Limit | Your Usage | Monthly Cost |
|---------|-----------------|------------|--------------|
| Vercel Serverless | 100K invocations | ~500 | $0 |
| Vercel KV | 3K requests, 256MB | ~500 req, <1MB | $0 |
| GitHub Actions | 2000 mins/month | ~120 mins | $0 |
| Firebase FCM | Unlimited | ~1000/month | $0 |
| Firebase Firestore | 1GB, 50K reads/day | <1MB, ~100/day | $0 |
| Play Store | $25 one-time | Once | $25 |

**Total: $25 one-time, $0/month recurring**

---

## Files to Create

### Backend (Vercel)

```
launchpad-api/
├── api/
│   ├── sync.ts
│   ├── projects.ts
│   ├── health.ts
│   ├── notify.ts
│   └── webhook.ts
├── lib/
│   ├── github.ts
│   ├── parser.ts
│   ├── health.ts
│   ├── notifications.ts
│   └── kv.ts
├── vercel.json
├── package.json
└── tsconfig.json
```

### Mobile App (React Native)

```
launchpad-app/
├── src/
│   ├── screens/
│   │   ├── Dashboard.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ShipWizard.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── ProjectCard.tsx
│   │   ├── HealthBadge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ActionItem.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── notifications.ts
│   ├── stores/
│   │   └── projectStore.ts
│   └── theme/
│       └── dark.ts
├── android/
├── app.json
└── package.json
```

### GitHub Actions (in a central repo)

```
launchpad-scheduler/
├── .github/
│   └── workflows/
│       └── sync.yml
└── README.md
```

### Per-Project Workflow (template)

```
.github/
└── workflows/
    └── notify-launchpad.yml
```

---

## Next Steps

1. **Start with Vercel backend** - Get `/api/sync` working
2. **Test GitHub API parsing** - Ensure README parsing works
3. **Build React Native shell** - Dark theme, navigation
4. **Integrate and iterate**

---

## Questions to Resolve

1. Should the app support multiple GitHub accounts?
2. Should there be a web dashboard version too?
3. Any specific projects to exclude from tracking?
4. Preferred notification sound/vibration pattern?

---

*Document created: January 17, 2026*
*Project: Launchpad (#12)*
*Status: Idea → Building*
