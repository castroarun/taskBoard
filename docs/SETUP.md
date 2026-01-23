# Task Board Setup Guide

This guide will help you set up Task Board's Command Center on your machine.

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Rust** (for Tauri) ([install](https://rustup.rs/))
- **pnpm** (recommended) or npm

```bash
# Install pnpm globally
npm install -g pnpm
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/taskboard.git
cd taskboard
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Copy Configuration

```bash
cp config.example.json config.json
```

Edit `config.json` with your settings (see [Configuration Guide](./CONFIGURATION.md)).

### 4. Run in Development Mode

**Browser mode** (no Tauri features):
```bash
cd apps/command-center
pnpm dev
```

**Desktop mode** (full Tauri features):
```bash
cd apps/command-center
pnpm tauri dev
```

---

## Groq API Setup (Voice Transcription)

Task Board uses [Groq](https://groq.com/) for fast voice-to-text transcription. This enables the voice capture feature in the Inbox.

### Step 1: Create Groq Account

1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up with Google, GitHub, or email
3. Verify your email if required

### Step 2: Generate API Key

1. Navigate to **API Keys** in the Groq console
2. Click **Create API Key**
3. Give it a name (e.g., "Task Board")
4. Copy the key immediately (it won't be shown again)

### Step 3: Add to Configuration

Open `config.json` and update the Groq section:

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

### Groq Models

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `whisper-large-v3-turbo` | Fast | High | Recommended default |
| `whisper-large-v3` | Medium | Highest | Maximum accuracy |

### Usage Limits

Groq offers generous free tier:
- ~7,200 seconds/day of audio transcription
- Rate limits apply for burst usage

---

## Data Storage

By default, Task Board stores data in:

| OS | Location |
|----|----------|
| Windows | `C:\Users\{user}\.taskboard\` |
| macOS | `~/.taskboard/` |
| Linux | `~/.taskboard/` |

Files:
- `projects.json` - Project definitions
- `tasks.json` - Task data
- `inbox.md` - Quick instructions

You can change this in `config.json` under `paths.dataFolder`.

---

## Project Folder Structure

Each project should have a `docs/` folder for the Documents view:

```
YourProject/
├── docs/
│   ├── APP_PRD.md          # Product requirements
│   ├── ARCHITECTURE.md     # Technical design
│   ├── DEVELOPMENT-PLAN.md # Build roadmap
│   ├── TEST-PLAN.csv       # QA checklist
│   ├── DEV-CLOCK.md        # Time tracking
│   └── PROJECT-STATUS.md   # Workflow status
├── assets/
│   └── screenshots/        # App screenshots
└── README.md
```

---

## Optional: GitHub Integration

To enable GitHub features:

1. Create a [Personal Access Token](https://github.com/settings/tokens)
2. Update `config.json`:

```json
{
  "integrations": {
    "github": {
      "enabled": true,
      "username": "your-username",
      "defaultVisibility": "private"
    }
  }
}
```

---

## Optional: Jira Integration

To sync with Jira:

1. Create an [API Token](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Update `config.json`:

```json
{
  "integrations": {
    "jira": {
      "enabled": true,
      "url": "https://your-org.atlassian.net",
      "email": "you@example.com",
      "apiToken": "your-api-token",
      "defaultProject": "PROJ"
    }
  }
}
```

---

## Building for Production

```bash
cd apps/command-center
pnpm tauri build
```

Outputs:
- Windows: `target/release/bundle/msi/`
- macOS: `target/release/bundle/dmg/`
- Linux: `target/release/bundle/deb/`

---

## Troubleshooting

### Tauri build fails

Ensure Rust is installed and updated:
```bash
rustup update
```

### Voice capture not working

1. Check microphone permissions
2. Verify Groq API key in `config.json`
3. Check browser/app console for errors

### Documents not loading

In browser dev mode, documents can't be loaded due to security restrictions. Use `pnpm tauri dev` for full functionality.

---

## Next Steps

- Read the [Configuration Guide](./CONFIGURATION.md) for all options
- Check [agents/](../agents/) for AI agent templates
- Join discussions on GitHub Issues
