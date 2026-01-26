# README Agent

> **Role:** Specialist for maintaining README files with best practices, badges, and LAUNCHPAD blocks.

**Primary Command:** `/readme` → `_claude-shared/commands/readme.md`

---

## Responsibilities

1. **Structure** - Ensure README follows best-practice template
2. **Badges** - Add/update shields.io badges for tech stack
3. **LAUNCHPAD Block** - Maintain machine-readable status block
4. **Roadmap** - Keep roadmap section current
5. **Links** - Verify all links are valid

---

## When Invoked

- `agent readme <proj>` - Update project README
- `readme update` - Update README with latest status
- Called automatically by **git-agent** before every push
- `/readme` command in Command Center

---

## Quality Scoring System

The `/readme` command performs a comprehensive quality check with a 0-100 score.

### Scoring Categories

| Category | Points | What's Checked |
|----------|--------|----------------|
| Structure | 25 | Title, tagline, required sections |
| Badges | 15 | 4-7 badges present, valid URLs |
| LAUNCHPAD | 20 | Block present, valid JSON, current data |
| Content | 20 | Descriptions filled, no placeholders |
| Links | 10 | All URLs valid, no 404s |
| Freshness | 10 | Updated within 7 days |

### Health Status

| Score | Status | Badge |
|-------|--------|-------|
| **0-39** | 🔴 Critical | Needs immediate attention |
| **40-59** | 🟠 Needs Work | Missing key elements |
| **60-79** | 🟡 Okay | Functional but improvable |
| **80-100** | 🟢 Healthy | Follows best practices |

### Commands

```bash
/readme check    # Run quality check, show score
/readme fix      # Auto-fix common issues
/readme enhance  # AI suggestions for improvement
/readme full     # Check + Fix + Enhance
```

---

## README Template Structure

```markdown
<p align="center">
  <img src="assets/logo.svg" alt="Logo" width="120" height="120">
</p>

<h1 align="center">Project Name</h1>
<h3 align="center">One-liner tagline</h3>

<p align="center">
  <!-- Badges -->
</p>

<!-- LAUNCHPAD:START -->
{...}
<!-- LAUNCHPAD:END -->

## Why This Project
## How It Works
## Features
## Quick Start
## Project Structure
## Roadmap
## License
```

---

## Badge Standards

### Required Badges (4-7)

| Badge | Template |
|-------|----------|
| Framework | `https://img.shields.io/badge/{Name}-{Version}-{Color}?style=for-the-badge&logo={logo}` |
| Language | TypeScript, Python, etc. |
| License | MIT, Apache, etc. |
| Status | Building, Live, Planning |

### Color Reference

| Tech | Color | Logo |
|------|-------|------|
| React | 61DAFB | react |
| Next.js | 000000 | nextdotjs |
| TypeScript | 3178C6 | typescript |
| Tauri | 24C8DB | tauri |
| Python | 3776AB | python |
| Supabase | 3FCF8E | supabase |
| Claude AI | CC785C | anthropic |

### Example Badge Set

```html
<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>
```

---

## LAUNCHPAD Block

### Format

```markdown
<!-- LAUNCHPAD:START
{
  "stage": "development",
  "stageStatus": "in-progress",
  "progress": 65,
  "priority": "P1",
  "lastUpdated": "2026-01-22T12:00:00Z",
  "tasksTotal": 24,
  "tasksCompleted": 15,
  "nextAction": "Implement drag-drop",
  "blocker": null
}
LAUNCHPAD:END -->
```

### Field Definitions

| Field | Type | Values |
|-------|------|--------|
| `stage` | string | conception, discovery, requirements, architecture, development, testing, staging, ship, announce, live |
| `stageStatus` | string | not-started, in-progress, blocked, completed |
| `progress` | number | 0-100 |
| `priority` | string | P0, P1, P2, P3 |
| `lastUpdated` | ISO date | Auto-generated |
| `tasksTotal` | number | From tasks.json |
| `tasksCompleted` | number | From tasks.json |
| `nextAction` | string | Current focus |
| `blocker` | string\|null | What's blocking progress |

---

## Update Script

```typescript
interface Project {
  stage: string;
  stageStatus: string;
  progress: number;
  priority: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
  };
}

function updateReadmeLaunchpad(project: Project, repoPath: string): void {
  const readmePath = `${repoPath}/README.md`;
  const readme = fs.readFileSync(readmePath, 'utf-8');

  const launchpadData = {
    stage: project.stage,
    stageStatus: project.stageStatus,
    progress: project.progress,
    priority: project.priority,
    lastUpdated: new Date().toISOString(),
    tasksTotal: project.metrics.totalTasks,
    tasksCompleted: project.metrics.completedTasks,
    nextAction: getNextAction(project),
    blocker: getBlocker(project)
  };

  const newBlock = `<!-- LAUNCHPAD:START\n${JSON.stringify(launchpadData, null, 2)}\nLAUNCHPAD:END -->`;

  // Check if LAUNCHPAD block exists
  if (readme.includes('LAUNCHPAD:START')) {
    // Update existing block
    const updatedReadme = readme.replace(
      /<!-- LAUNCHPAD:START[\s\S]*?LAUNCHPAD:END -->/,
      newBlock
    );
    fs.writeFileSync(readmePath, updatedReadme);
  } else {
    // Insert after badges (before first <details> or ## section)
    const insertPoint = readme.indexOf('<details>') !== -1
      ? readme.indexOf('<details>')
      : readme.indexOf('## ');

    const updatedReadme =
      readme.slice(0, insertPoint) +
      newBlock + '\n\n' +
      readme.slice(insertPoint);

    fs.writeFileSync(readmePath, updatedReadme);
  }
}
```

---

## Roadmap Sync

### Auto-Update Rules

1. When task marked complete → Check if milestone completed
2. When milestone completed → Update roadmap checkbox
3. When project ships → Add "Live" badge

### Roadmap Format

```markdown
## Roadmap

- [x] Phase 1: Design
  - [x] Create mockups
  - [x] Define architecture
- [ ] Phase 2: Build
  - [x] Core features
  - [ ] Polish & testing
- [ ] Phase 3: Launch
```

---

## Validation Checklist

Before committing README changes:

- [ ] Title and tagline present
- [ ] 4-7 badges with correct links
- [ ] LAUNCHPAD block with valid JSON
- [ ] All sections have content
- [ ] No broken links
- [ ] Roadmap reflects current state
- [ ] lastUpdated is current

---

## Integration with Git Agent

The **git-agent** calls `/readme check` before every push:

```
git-agent push flow:
1. Stage changes
2. → Call /readme check
3. If score < 50: BLOCK push, suggest /readme fix
4. If score 50-69: Warn user, continue
5. If score >= 70: Proceed normally
6. Update LAUNCHPAD block
7. Stage README.md if modified
8. Create commit
9. Push to remote
```

### Override for Urgent Pushes

```bash
push <proj> --skip-readme  # Bypass README check (logs warning)
```

---

## AI Actions in README Agent

| Action | AI Involvement | Purpose |
|--------|---------------|---------|
| Badge generation | 🤖 Auto | Detect tech stack, generate badges |
| LAUNCHPAD update | 🤖 Auto | Sync from project data |
| Roadmap sync | 🤖 Auto | Match tasks to roadmap items |
| Link validation | 🤖 Auto | Check all URLs are valid |
| Content suggestions | 🤖 AI | Suggest improvements to sections |

---

## Logging Format

```
2026-01-22T12:00:00Z | readme-agent | update | taskboard: Updated LAUNCHPAD block
2026-01-22T12:00:00Z | readme-agent | badges | taskboard: Added 2 new badges
2026-01-22T12:00:00Z | readme-agent | roadmap | taskboard: Checked off "Command Center MVP"
```
