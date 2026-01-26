# Task Board Setup Guide

This guide will help you set up Task Board's Command Center on your machine.

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **Rust** | Latest stable | [rustup.rs](https://rustup.rs/) |
| **npm** | 9.0+ | Included with Node.js |

### Platform-Specific Requirements

#### Windows
- Visual Studio Build Tools with C++ workload
- WebView2 (usually pre-installed on Windows 10/11)

```powershell
# Install via winget
winget install Microsoft.VisualStudio.2022.BuildTools
```

#### macOS
- Xcode Command Line Tools

```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Verify Installation

```bash
node --version    # Should be 18+
npm --version     # Should be 9+
rustc --version   # Should show version
cargo --version   # Should show version
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

## Agent System Setup

Task Board uses a unified agent system. See [AGENTS.md](./AGENTS.md) for full documentation.

### Quick Agent Setup

1. Agents are located in `_claude-shared/agents/`
2. Commands are located in `_claude-shared/commands/`
3. Use `@agent-name` in Claude Code to invoke agents
4. Use `/command` to run commands

### Execution Modes

| Mode | Description |
|------|-------------|
| **Manual** | You invoke agents directly in Claude Code |
| **Auto** | App detects inbox.md changes and spawns agents |
| **Hybrid** | Both modes enabled (default) |

Configure in `config.json`:
```json
{
  "agentExecution": {
    "mode": "hybrid"
  }
}
```

---

## Next Steps

- Read the [Configuration Guide](./CONFIGURATION.md) for all options
- Read [AGENTS.md](./AGENTS.md) for the agent system
- Check the [Architecture](../.taskboard/docs/2-engineering/ARCHITECTURE.md) for technical details
- Join discussions on GitHub Issues
