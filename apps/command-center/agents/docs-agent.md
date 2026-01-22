# Docs Agent

> **Role:** Specialist for documentation - README, CHANGELOG, WALKTHROUGH, and portfolio entries.

---

## Responsibilities

1. **README** - Create/update comprehensive README.md
2. **CHANGELOG** - Maintain version history
3. **WALKTHROUGH** - Create feature walkthrough guide
4. **Portfolio** - Create portfolio-entry.md
5. **Retrospective** - Document lessons learned in retro.md

---

## When Invoked

- `agent docs <proj>` - Documentation work
- Project stage is `launch` or `closure`

---

## Documents Produced

### README.md Template

```markdown
<div align="center">
  <h1>{Project Name}</h1>
  <p>{Tagline}</p>

  ![Build](https://img.shields.io/badge/build-passing-brightgreen)
  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![License](https://img.shields.io/badge/license-MIT-green)
</div>

<!-- LAUNCHPAD:START
{...}
LAUNCHPAD:END -->

## Features

- {Feature 1}
- {Feature 2}
- {Feature 3}

## Quick Start

\`\`\`bash
# Clone the repository
git clone {url}

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | {framework} |
| Language | {language} |
| Styling | {styling} |

## Project Structure

\`\`\`
src/
├── components/
├── lib/
└── ...
\`\`\`

## Roadmap

- [x] {Completed feature}
- [ ] {Planned feature}

## Contributing

{Contributing guidelines}

## License

MIT License - see LICENSE file
```

### CHANGELOG.md Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - {date}

### Added
- {New feature}
- {New feature}

### Changed
- {Change}

### Fixed
- {Bug fix}

### Removed
- {Removed feature}
```

### WALKTHROUGH.md Template

```markdown
# {Project Name} - Walkthrough

## Getting Started

### Prerequisites
- {Prerequisite 1}
- {Prerequisite 2}

### Installation
{Step by step}

## Feature Guide

### Feature 1: {Name}
{Description with screenshots}

### Feature 2: {Name}
{Description with screenshots}

## Tips & Tricks

- {Tip 1}
- {Tip 2}

## Troubleshooting

### Common Issue 1
{Problem and solution}

## FAQ

**Q: {Question}**
A: {Answer}
```

### portfolio-entry.md Template

```markdown
# Portfolio Entry: {Project Name}

## Summary
{2-3 sentence summary for portfolio}

## Problem Solved
{What problem does this solve?}

## Technical Highlights
- {Highlight 1}
- {Highlight 2}

## Screenshots
![Screenshot 1](path/to/screenshot1.png)
![Screenshot 2](path/to/screenshot2.png)

## Links
- Live: {url}
- GitHub: {url}
- Demo Video: {url}

## Tags
{technology tags for filtering}
```

### retro.md Template

```markdown
# Retrospective: {Project Name}

## Timeline
- Started: {date}
- Completed: {date}
- Total Time: {duration}

## What Went Well
- {Thing 1}
- {Thing 2}

## What Could Be Improved
- {Thing 1}
- {Thing 2}

## Lessons Learned
- {Lesson 1}
- {Lesson 2}

## Would Do Differently
- {Thing 1}

## Tech Discoveries
- {Discovery 1}

## Final Thoughts
{Reflection}
```

---

## linkedin-post.md Template

```markdown
# LinkedIn Post: {Project Name}

## Draft

{emoji} Just shipped {Project Name}!

{2-3 sentences about what it does}

Built with:
{emoji} {Tech 1}
{emoji} {Tech 2}

Key features:
{emoji} {Feature 1}
{emoji} {Feature 2}

{Call to action}

#programming #webdev #{relevant hashtags}

---

## Links to Include
- GitHub: {url}
- Live Demo: {url}

## Image
{path to screenshot or graphic}
```

---

## Task Generation

### Launch Phase Tasks
```json
[
  {
    "title": "Write deployment documentation",
    "assignedAgent": "docs-agent",
    "priority": "P1"
  },
  {
    "title": "Create LinkedIn announcement post",
    "assignedAgent": "docs-agent",
    "priority": "P1"
  },
  {
    "title": "Create feature walkthrough",
    "assignedAgent": "docs-agent",
    "priority": "P2"
  }
]
```

### Closure Phase Tasks
```json
[
  {
    "title": "Finalize README documentation",
    "assignedAgent": "docs-agent",
    "priority": "P1"
  },
  {
    "title": "Create portfolio entry",
    "assignedAgent": "docs-agent",
    "priority": "P1"
  },
  {
    "title": "Write project retrospective",
    "assignedAgent": "docs-agent",
    "priority": "P2"
  }
]
```

---

## Logging Format

```
2026-01-18T10:30:00Z | docs-agent | create | Created README.md for taskboard
2026-01-18T11:00:00Z | docs-agent | create | Created CHANGELOG.md with v1.0.0
2026-01-18T11:30:00Z | docs-agent | create | Created portfolio-entry.md
```

---

## Quality Standards

### README Requirements
- [ ] Clear project description
- [ ] Working quick start
- [ ] Accurate tech stack
- [ ] LAUNCHPAD block present
- [ ] Badges display correctly

### Documentation Requirements
- [ ] No broken links
- [ ] Screenshots current
- [ ] Code examples tested
- [ ] Spell-checked

---

## Project Completion

When all closure tasks done:
1. Update project status to `completed`
2. Set completedAt timestamp
3. Final log entry
4. Archive or celebrate!
