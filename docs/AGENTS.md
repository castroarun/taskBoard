# Taskboard Agent System

This document explains the unified agent system used by Taskboard.

## Overview

Taskboard uses a **unified agent architecture** where all agents and commands are shared from a central location (`_claude-shared`) and can be invoked in two ways:

1. **Automatically** - The Command Center app detects changes and spawns agents
2. **Manually** - You invoke agents directly in Claude Code

---

## Available Agents

### IDE Agents (@invocation)

Use these by typing `@agent-name` in Claude Code:

| Agent | Invocation | Purpose |
|-------|------------|---------|
| **Designer** | `@designer` | Requirements gathering via deep research, skill discovery, systematic questioning |
| **Architect** | `@architect` | System design, PRD creation, HTML mockups, Jira integration |
| **QA** | `@qa` | Test planning - creates TEST-PLAN.csv and TEST_CASES.md |
| **Dev** | `@dev` | Development tracking, dev-log.md maintenance, progress updates |
| **Walkthrough** | `@walkthrough` | Live code walkthroughs, generates WALKTHROUGH.md |

### Commands (/invocation)

Use these by typing `/command` in Claude Code:

| Command | Invocation | Purpose |
|---------|------------|---------|
| **README** | `/readme` | Quality scoring (0-100), badge generation, LAUNCHPAD validation |
| **Git** | `/git` | Git operations, commit standards, LAUNCHPAD sync on push |
| **Docs** | `/docs` | Documentation generation - README, CHANGELOG, portfolio, LinkedIn |
| **Deploy** | `/deploy` | Deployment workflows |
| **New Project** | `/newproject` | Initialize new project with 9-step workflow |

---

## Agent Locations

All agents are stored in the global shared folder:

```
C:\Users\{user}\Documents\Projects\_claude-shared\
├── agents\
│   ├── designer.md
│   ├── architect.md
│   ├── qa.md
│   ├── dev.md
│   └── walkthrough.md
│
└── commands\
    ├── readme.md
    ├── git.md
    ├── docs.md
    ├── deploy.md
    └── newproject.md
```

---

## Execution Modes

### Manual Mode

You invoke agents directly in Claude Code:

```
> @designer help me gather requirements for a new feature

> @architect create the system design

> /readme check my README quality

> /git push with a good commit message
```

### Auto Mode

The Command Center app can automatically invoke agents:

1. You add an instruction to `inbox.md`
2. The app's file watcher detects the change
3. The orchestrator parses the instruction
4. The appropriate agent is spawned via Claude Code CLI
5. The agent executes and updates project files
6. You receive a notification

### Hybrid Mode (Default)

Both modes are enabled. Use whichever is more convenient:
- Quick tasks → Manual invocation
- Background automation → Auto via inbox.md

---

## Configuration

In `config.json`:

```json
{
  "agentExecution": {
    "mode": "hybrid",           // "auto" | "manual" | "hybrid"
    "autoTrigger": "inbox",     // What triggers auto mode
    "claudeCodePath": "claude", // Path to Claude Code CLI
    "timeout": 300000           // 5 min timeout for auto tasks
  }
}
```

---

## Installing Agents in Your IDE

### VS Code with Claude Code Extension

1. Agents are automatically available when you open a project
2. The global `_claude-shared` folder is referenced via CLAUDE.md
3. Type `@agent-name` to invoke any agent

### Setting Up Global Agents

1. Clone or create the `_claude-shared` folder:
   ```bash
   mkdir -p ~/Documents/Projects/_claude-shared/agents
   mkdir -p ~/Documents/Projects/_claude-shared/commands
   ```

2. Add agent files (copy from this repository or create your own)

3. Reference in your global CLAUDE.md:
   ```markdown
   ## Imported Standards
   @C:\Users\{user}\Documents\Projects\_claude-shared\agents\designer.md
   @C:\Users\{user}\Documents\Projects\_claude-shared\agents\architect.md
   ...
   ```

---

## Orchestrator

The `agents/orchestrator.md` file in the Taskboard project handles routing:

| Project Stage | Routed To |
|---------------|-----------|
| Design (conception, discovery, requirements) | @designer |
| Engineering (architecture) | @architect |
| Engineering (qa-planning) | @qa |
| Build (development) | @dev |
| Build (testing) | @qa |
| Launch (ship, announce, walkthrough) | /docs |
| Any stage (git operations) | /git |

---

## Agent Outputs

### @designer
- `idea.md` - Initial concept capture
- `discovery.md` - Research findings
- `APP_PRD.md` - Product requirements document

### @architect
- `ARCHITECTURE.md` - System design
- `mockups/*.html` - HTML mockups
- Task breakdown for development

### @qa
- `TEST-PLAN.csv` - Excel-compatible test cases
- `TEST_CASES.md` - Markdown test cases
- `test-results.md` - Test execution results

### @dev
- `dev-log.md` - Development journal
- Code implementations
- Bug reports

### @walkthrough
- `WALKTHROUGH.md` - Feature documentation

### /readme
- Quality score report
- Badge suggestions
- LAUNCHPAD block updates

### /docs
- `README.md` updates
- `CHANGELOG.md`
- `portfolio-entry.md`
- `linkedin-post.md`
- `retro.md`

---

## Troubleshooting

### Agent not found

1. Check that `_claude-shared` folder exists
2. Verify agent file exists in `agents/` or `commands/`
3. Ensure CLAUDE.md imports the agent

### Auto mode not triggering

1. Check `config.json` has `"mode": "auto"` or `"mode": "hybrid"`
2. Verify inbox.md is being watched
3. Check Claude Code CLI is in PATH

### Agent timeout

1. Increase timeout in config: `"timeout": 600000`
2. Break complex tasks into smaller steps
3. Check for infinite loops in agent logic

---

## Creating Custom Agents

1. Create a new `.md` file in `_claude-shared/agents/`
2. Follow the template structure:
   ```markdown
   # Agent Name - Description

   You are a [role] responsible for [purpose].

   ## When to Use
   ...

   ## Inputs Required
   ...

   ## Process
   ...

   ## Outputs
   ...
   ```

3. Reference in CLAUDE.md to make it available

---

*For more details, see [ARCHITECTURE.md](../.taskboard/docs/2-engineering/ARCHITECTURE.md) Section 14.*
