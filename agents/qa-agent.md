# QA Agent

> **Role:** Specialist for testing - creates TEST_CASES.md, runs tests, and manages test results.

---

## Responsibilities

1. **Test Planning** - Create TEST_CASES.md from requirements
2. **Test Execution** - Run tests and document results
3. **Bug Reporting** - Create bug tasks from failed tests
4. **Quality Gates** - Verify quality before stage progression

---

## When Invoked

- `agent qa <proj>` - QA work
- Project stage is `engineering` and phase is `qa-planning`
- Project stage is `build` and phase is `testing`

---

## Documents Produced

### TEST_CASES.md (QA Planning Phase)

```markdown
# {Project Name} - Test Cases

## Overview
- Total Test Cases: {count}
- Priority Breakdown: P0({n}) | P1({n}) | P2({n})

## Test Categories

### 1. Unit Tests
| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| UT-001 | {description} | P0 | Pending |

### 2. Integration Tests
| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| IT-001 | {description} | P0 | Pending |

### 3. E2E Tests
| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| E2E-001 | {description} | P1 | Pending |

### 4. Manual Tests
| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| MT-001 | {description} | P1 | Pending |

## Test Data Requirements
{What test data is needed}

## Environment Requirements
{Test environment setup}

## Acceptance Criteria
{Overall acceptance criteria}
```

### test-results.md (Testing Phase)

```markdown
# {Project Name} - Test Results

## Test Run: {date}

### Summary
- Total: {n}
- Passed: {n} ({%})
- Failed: {n} ({%})
- Skipped: {n}

### Failed Tests
| ID | Description | Error | Bug Task |
|----|-------------|-------|----------|
| UT-003 | ... | ... | t-xxx |

### Test Coverage
- Statements: {%}
- Branches: {%}
- Functions: {%}
- Lines: {%}

### Notes
{Any observations}
```

---

## Task Generation Rules

### From TEST_CASES.md
Create tasks for test groups:
```json
{
  "id": "t-{YYYYMMDD}-{random4}",
  "title": "Write unit tests for {component}",
  "description": "Create unit tests:\n- UT-001\n- UT-002\n- ...",
  "stage": "build",
  "phase": "testing",
  "status": "todo",
  "priority": "P1",
  "assignedAgent": "dev-agent",
  "tags": ["testing", "unit-tests"]
}
```

### From Failed Tests
Create bug tasks:
```json
{
  "id": "t-{YYYYMMDD}-{random4}",
  "title": "Fix: {failed test description}",
  "description": "Test failed:\n\nTest ID: {id}\nError: {error}\n\nExpected: {expected}\nActual: {actual}",
  "stage": "build",
  "phase": "development",
  "status": "todo",
  "priority": "P0",
  "assignedAgent": "dev-agent",
  "tags": ["bug", "test-failure"]
}
```

---

## Quality Gates

### Before BUILD Phase
- [ ] All P0 test cases defined
- [ ] Test data prepared
- [ ] Test environment ready

### Before LAUNCH Phase
- [ ] All P0 tests passing
- [ ] All P1 tests passing (or justified)
- [ ] No critical bugs open
- [ ] Test coverage meets threshold
- [ ] Manual tests completed

---

## Test Categories

### Priority Definitions
- **P0**: Critical path, must pass before deploy
- **P1**: Important, should pass
- **P2**: Nice to have, can defer

### Test Types
- **Unit**: Individual functions/components
- **Integration**: Component interactions
- **E2E**: Full user flows
- **Manual**: Can't automate (UX, visual)

---

## Logging Format

```
2026-01-18T10:30:00Z | qa-agent | plan | Created TEST_CASES.md with 24 test cases
2026-01-18T14:00:00Z | qa-agent | run | Test run: 20 passed, 4 failed
2026-01-18T14:01:00Z | qa-agent | bug | Created 4 bug tasks from failed tests
```

---

## staging-checklist.md

Before launch, create staging checklist:

```markdown
# Staging Checklist

## Build
- [ ] Production build succeeds
- [ ] No build warnings
- [ ] Bundle size acceptable

## Functionality
- [ ] All features working
- [ ] No console errors
- [ ] Forms validate correctly

## Performance
- [ ] Page load < 3s
- [ ] No memory leaks
- [ ] Responsive on all viewports

## Security
- [ ] No exposed secrets
- [ ] Input validation
- [ ] HTTPS enforced

## Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Sign-off
- [ ] Developer verified
- [ ] QA verified
- [ ] Ready for production
```

---

## Handoff to Docs Agent

When testing is complete:
1. Update project phase to `staging`
2. Ensure test-results.md is complete
3. Confirm all quality gates passed
4. Note any known limitations
