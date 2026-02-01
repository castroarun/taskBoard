# Configuration Guide

Klarity uses a single `config.json` file for all settings. Copy `config.example.json` to get started.

---

## Configuration File Location

```
taskboard/
├── config.json          # Your configuration (git-ignored)
├── config.example.json  # Template with defaults
└── config.schema.json   # JSON schema for validation
```

---

## Configuration Sections

### User Settings

```json
{
  "user": {
    "name": "Your Name",
    "email": "you@example.com",
    "timezone": "UTC",
    "avatar": null,
    "preferences": {
      "theme": "dark",
      "language": "TypeScript",
      "defaultFramework": "Next.js",
      "defaultStyling": "Tailwind",
      "defaultStateManagement": "Zustand"
    }
  }
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `name` | Your display name | Required |
| `email` | Email for notifications | Optional |
| `timezone` | IANA timezone | `UTC` |
| `preferences.theme` | UI theme | `dark` |

---

### Paths

```json
{
  "paths": {
    "projects": "~/Documents/Projects",
    "dataFolder": "~/.taskboard",
    "screenshotsFolder": "assets"
  }
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `projects` | Root folder for your projects | Required |
| `dataFolder` | Where Task Board stores data | `~/.taskboard` |
| `screenshotsFolder` | Subfolder in projects for screenshots | `assets` |

---

### Workflow Phases & Stages

Customize your project workflow with phases and stages:

```json
{
  "workflow": {
    "phases": [
      {
        "id": "design",
        "name": "Design",
        "color": "#8b5cf6",
        "stages": ["conception", "discovery", "requirements"]
      },
      {
        "id": "engineering",
        "name": "Engineering",
        "color": "#3b82f6",
        "stages": ["architecture", "qa-planning", "review"]
      },
      {
        "id": "build",
        "name": "Build",
        "color": "#22c55e",
        "stages": ["development", "testing", "staging"]
      },
      {
        "id": "launch",
        "name": "Launch",
        "color": "#f59e0b",
        "stages": ["ship", "announce", "walkthrough"]
      },
      {
        "id": "closure",
        "name": "Closure",
        "color": "#6b7280",
        "stages": ["documentation", "portfolio", "retrospective"]
      }
    ]
  }
}
```

**Phase Properties:**

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (used in code) |
| `name` | Display name |
| `color` | Hex color for UI |
| `stages` | Array of stage names within this phase |

**Default Workflow:**

```
Design          Engineering       Build           Launch          Closure
┌──────────┐   ┌──────────┐     ┌──────────┐   ┌──────────┐    ┌──────────┐
│conception│ → │architecture│ → │development│ → │   ship   │ → │  docs    │
│discovery │   │qa-planning │   │ testing  │   │ announce │   │portfolio │
│requiremts│   │  review   │   │ staging  │   │walkthrough│   │  retro   │
└──────────┘   └──────────┘     └──────────┘   └──────────┘    └──────────┘
```

---

### Priorities

```json
{
  "workflow": {
    "priorities": [
      { "id": "P0", "name": "Critical", "color": "#ef4444" },
      { "id": "P1", "name": "High", "color": "#f97316" },
      { "id": "P2", "name": "Medium", "color": "#eab308" },
      { "id": "P3", "name": "Low", "color": "#6b7280" }
    ]
  }
}
```

---

### Complexity Levels

```json
{
  "workflow": {
    "complexities": [
      { "id": "XS", "name": "Extra Small", "hours": "< 2h" },
      { "id": "S", "name": "Small", "hours": "2-4h" },
      { "id": "M", "name": "Medium", "hours": "4-8h" },
      { "id": "L", "name": "Large", "hours": "1-2 days" },
      { "id": "XL", "name": "Extra Large", "hours": "2+ days" }
    ]
  }
}
```

---

### Document Categories

Configure which documents appear in the Documents view:

```json
{
  "documents": {
    "categories": [
      {
        "id": "design",
        "name": "Design",
        "icon": "pencil",
        "defaultFiles": ["APP_PRD.md", "DESIGN.md"]
      },
      {
        "id": "engineering",
        "name": "Engineering",
        "icon": "cog",
        "defaultFiles": ["ARCHITECTURE.md", "DEVELOPMENT-PLAN.md", "TEST-PLAN.csv"]
      },
      {
        "id": "build",
        "name": "Build",
        "icon": "wrench",
        "defaultFiles": ["DEV-CLOCK.md", "PROJECT-STATUS.md", "CHANGELOG.md"]
      },
      {
        "id": "launch",
        "name": "Launch",
        "icon": "rocket",
        "defaultFiles": ["PLAY_STORE_LISTING.md", "LINKEDIN-POST.md", "PRIVACY_POLICY.md"]
      },
      {
        "id": "other",
        "name": "Other",
        "icon": "document",
        "defaultFiles": ["GLOSSARY.md"]
      }
    ]
  }
}
```

**Available Icons:** `pencil`, `cog`, `wrench`, `rocket`, `document`, `folder`, `star`

---

### Approval Mandates

Require certain documents to be approved before proceeding to the next phase:

```json
{
  "documents": {
    "approvalMandatory": {
      "beforeEngineering": ["APP_PRD.md"],
      "beforeBuild": ["ARCHITECTURE.md"],
      "beforeLaunch": ["TEST-PLAN.csv"]
    }
  }
}
```

This creates a gate: the project can't move to Engineering until `APP_PRD.md` is marked as approved.

---

### Agent Templates

Configure AI agent prompts for automation:

```json
{
  "agents": {
    "enabled": true,
    "templates": {
      "orchestrator": "agents/orchestrator.md",
      "design": "agents/design-agent.md",
      "architect": "agents/architect-agent.md",
      "dev": "agents/dev-agent.md",
      "git": "agents/git-agent.md",
      "qa": "agents/qa-agent.md",
      "docs": "agents/docs-agent.md",
      "readme": "agents/readme-agent.md"
    }
  }
}
```

**Available Agents:**

| Agent | Purpose |
|-------|---------|
| `orchestrator` | Coordinates overall workflow |
| `design` | PRD writing, UX research |
| `architect` | Technical design, API specs |
| `dev` | Code implementation |
| `git` | Git operations, commits, PRs |
| `qa` | Testing, test plans |
| `docs` | Documentation writing |
| `readme` | README generation |

See [agents/](../agents/) for template files.

---

### Integrations

#### Groq (Voice Transcription)

```json
{
  "integrations": {
    "groq": {
      "enabled": true,
      "apiKey": "gsk_your_api_key_here",
      "model": "whisper-large-v3-turbo",
      "useFor": ["voiceTranscription"]
    }
  }
}
```

Get your API key at [console.groq.com/keys](https://console.groq.com/keys).

#### GitHub

```json
{
  "integrations": {
    "github": {
      "enabled": false,
      "username": null,
      "defaultVisibility": "private"
    }
  }
}
```

#### Jira

```json
{
  "integrations": {
    "jira": {
      "enabled": false,
      "url": null,
      "email": null,
      "apiToken": null,
      "defaultProject": null
    }
  }
}
```

---

### Notifications

```json
{
  "notifications": {
    "enabled": true,
    "desktop": true,
    "sound": false,
    "reminders": {
      "staleProject": 7,
      "approvalPending": 1,
      "blockedTask": 1
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `staleProject` | Days before warning about inactive project |
| `approvalPending` | Days before reminding about pending approval |
| `blockedTask` | Days before highlighting blocked tasks |

---

### UI Settings

```json
{
  "ui": {
    "theme": "dark",
    "accentColor": "#6366f1",
    "compactMode": false,
    "showWelcome": true,
    "defaultView": "pipeline",
    "cardSize": "medium"
  }
}
```

| Field | Options |
|-------|---------|
| `theme` | `dark` (only dark theme currently) |
| `accentColor` | Any hex color |
| `defaultView` | `pipeline`, `inbox`, `docs` |
| `cardSize` | `small`, `medium`, `large` |

---

### Advanced Settings

```json
{
  "advanced": {
    "logActions": true,
    "fileWatchDebounce": 500,
    "autoSaveInterval": 30000,
    "maxRecentProjects": 10,
    "backupEnabled": true,
    "backupInterval": 86400000
  }
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `logActions` | Log user actions for debugging | `true` |
| `fileWatchDebounce` | Delay (ms) before reloading on file change | `500` |
| `autoSaveInterval` | Auto-save interval (ms) | `30000` |
| `maxRecentProjects` | Number of recent projects to track | `10` |
| `backupEnabled` | Enable automatic backups | `true` |
| `backupInterval` | Backup frequency (ms), default 24h | `86400000` |

---

## Environment-Specific Config

For different environments, you can use:

```
config.json           # Default (git-ignored)
config.dev.json       # Development overrides
config.prod.json      # Production overrides
```

---

## Schema Validation

The `config.schema.json` file provides JSON Schema validation. Your editor should automatically validate `config.json` against it.

To validate manually:
```bash
npx ajv validate -s config.schema.json -d config.json
```

---

## Migrating Configuration

When upgrading Task Board, check `config.example.json` for new options. Add any new fields to your `config.json` to enable new features.
