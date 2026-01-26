# LinkedIn Posts for Klarity Launch

## Post #1: Launch Post (~1,200 chars)

---

**"What's your ticket number?"**

That question kills AI-assisted development flow.

I was using Jira + MCP to manage my Claude coding sessions. The idea was clean:
→ Claude creates review tasks
→ I review in Jira
→ Claude reads my feedback

**The problem?** Jira is one-way.

Code talks TO Jira.
But Jira doesn't talk BACK to code.

When I leave a comment, Claude doesn't see it next session. I'm copy-pasting feedback. The loop is broken.

So I built **Klarity** — a personal task board for AI-assisted development.

**What makes it different:**

📋 **5-phase pipeline** (Design → Engineering → Build → Launch → Closure)
Instead of sprint boards, see exactly which phase each project is in.

💬 **Bidirectional communication**
Inbox, project reviews, task comments — Claude checks all three at session start.

📁 **File-based storage**
JSON files. Git-friendly. No database. No server costs.

⌨️ **Keyboard-first**
Ctrl+K for everything. No mouse required.

🎤 **Voice capture**
Record ideas, auto-transcribe to inbox.

The result? Review time cut in half. Zero context switching. True human-AI collaboration loop.

Full breakdown of the architecture and features: [ARTICLE LINK]

---

Are you using project management tools with AI coding assistants? What's working (or not)?

---

## Post #2: Deep Dive - Bidirectional Communication (~900 chars)

---

The hidden feature in my task board that changed everything:

**Bidirectional AI communication.**

Most AI coding workflows are one-way:
→ You give instructions
→ AI executes
→ You review output
→ Repeat

But what about persistent feedback? What about "remember this for next session"?

In **Klarity**, I have three channels to talk to Claude:

**1. Inbox** (session-level)
```markdown
## Active Instructions
- [ ] Focus on calendar view today
- [ ] Don't touch auth module
```
Claude checks this FIRST every session.

**2. Project Reviews** (project-level)
```json
{
  "content": "Timeline blocks are overlapping",
  "forClaude": true,
  "resolved": false
}
```
Feedback attached to specific projects.

**3. Task Comments** (task-level)
```json
{
  "content": "Use mockup at /mockups/calendar.html",
  "forClaude": true
}
```
Instructions on specific tasks.

**Why this matters:**

When I leave feedback at 11pm and start a new session at 9am, Claude already knows what I thought. No re-explaining. No copy-pasting from Jira comments.

The context persists. The collaboration loop closes.

This is what "AI-native" project management looks like.

Full article with all features: [ARTICLE LINK]

---

What feedback mechanisms do you use with AI coding assistants?

---

## Posting Schedule

| Day | Post | Focus |
|-----|------|-------|
| Day 1 | Post #1 (Launch) | Problem-solution overview |
| Day 1 | Article published | Full feature breakdown |
| Day 3-4 | Post #2 (Deep Dive) | Bidirectional communication feature |

## Hashtags to Use

```
#AIAssistedDevelopment #DeveloperTools #ProductivityTools #SoftwareEngineering #IndieHacker #BuildInPublic #ClaudeAI #Tauri #React #TypeScript
```

## Engagement Strategy

1. Respond to all comments within 2 hours
2. Ask follow-up questions to commenters
3. Share in relevant communities:
   - r/programming
   - r/webdev
   - Hacker News (Show HN)
   - Indie Hackers
4. Cross-post teaser on Twitter/X
