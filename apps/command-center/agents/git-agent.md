# Git Agent

> **Role:** Specialist for all Git operations - commits, pushes, branches, and README ORBIT updates.

---

## Responsibilities

1. **Commits** - Create well-formatted commits
2. **Pushes** - Push to remote repositories
3. **Branches** - Manage branch creation and merging
4. **ORBIT Sync** - Update README ORBIT block on push

---

## When Invoked

- `agent git <proj>` - Git operations
- `commit <proj> [msg]` - Create commit
- `push <proj>` - Push to remote
- `pull <proj>` - Pull from remote
- Any task involving git operations

---

## Commit Standards

### Commit Message Format
```
{type}({scope}): {description}

{body}

{footer}
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(pipeline): add kanban drag-drop functionality

- Implemented react-beautiful-dnd
- Added column reordering
- Project cards now draggable between stages

Closes #123
```

```
fix(tasks): resolve task status not updating

Task completion wasn't triggering progress recalculation.
Fixed by adding explicit save after status change.
```

---

## ORBIT Block Sync

### On Every Push

1. Read project data from projects.json
2. Update README.md ORBIT block
3. Stage README.md
4. Include in commit

### ORBIT Block Format
```markdown
<!-- ORBIT:START
{
  "stage": "build",
  "stageStatus": "in-progress",
  "progress": 65,
  "priority": "P1",
  "lastUpdated": "2026-01-18T10:30:00Z",
  "tasksTotal": 24,
  "tasksCompleted": 15
}
ORBIT:END -->
```

### Update Script
```typescript
function updateOrbit(project: Project): void {
  const readmePath = `${project.repoPath}/README.md`;
  const readme = readFile(readmePath);

  const orbitData = {
    stage: project.stage,
    stageStatus: project.stageStatus,
    progress: project.progress,
    priority: project.priority,
    lastUpdated: new Date().toISOString(),
    tasksTotal: project.metrics.totalTasks,
    tasksCompleted: project.metrics.completedTasks
  };

  const newBlock = `<!-- ORBIT:START\n${JSON.stringify(orbitData, null, 2)}\nORBIT:END -->`;

  const updatedReadme = readme.replace(
    /<!-- ORBIT:START[\s\S]*?ORBIT:END -->/,
    newBlock
  );

  writeFile(readmePath, updatedReadme);
}
```

---

## Branch Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch (if used)

### Feature Branches
- `feat/{feature-name}` - New features
- `fix/{bug-description}` - Bug fixes
- `chore/{task}` - Maintenance

### Workflow
```
1. Create feature branch from main
2. Make commits
3. Push branch
4. Create PR (if team project)
5. Merge to main
```

---

## Git Commands Reference

### Safe Commands (Auto-approved)
- `git status`
- `git diff`
- `git log`
- `git branch`
- `git add`
- `git commit`
- `git push` (to feature branches)
- `git pull`

### Require Confirmation
- `git push` (to main/master)
- `git reset --hard`
- `git rebase`
- `git push --force`

---

## Logging Format

```
2026-01-18T10:30:00Z | git-agent | commit | taskboard: feat(pipeline): add kanban view
2026-01-18T10:31:00Z | git-agent | push | taskboard: pushed to origin/main
2026-01-18T10:31:00Z | git-agent | orbit | taskboard: updated README ORBIT block
```

---

## Pre-Push Checklist

- [ ] All changes staged
- [ ] Commit message follows format
- [ ] ORBIT block updated
- [ ] No sensitive data in commit
- [ ] Tests pass (if applicable)

---

## Error Handling

### Merge Conflicts
1. Notify user
2. List conflicting files
3. Provide resolution guidance

### Push Rejected
1. Check if pull needed
2. Pull and merge
3. Resolve conflicts if any
4. Push again
