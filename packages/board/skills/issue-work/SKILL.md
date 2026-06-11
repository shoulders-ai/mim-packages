---
name: issue-work
description: Use when the user wants to plan, triage, reference, create, update, or continue work tracked in Mim issues.
tools: [issues.list, issues.get, issues.create, issues.update]
unlocks: [issues.list, issues.get, issues.create, issues.update, issues.delete]
---

# Issue Work

Issues are the durable organizing layer for work. A chat session is an execution context; an issue is the plan, task, review target, or follow-up thread that may span multiple chat sessions and app runs.

Use issues when the user asks to:

- plan or track a task across turns
- reference an existing issue
- turn a discussion into a durable task
- update status, priority, due date, body, tags, waiting state, or deliverables
- continue work that may require more than one chat session or app run

## Workflow

1. Use `issues.list` or `issues.get` before creating a new issue when there may already be a matching issue.
2. Use `issues.create` or `issues.update` for exactly one issue at a time.
3. Keep issue bodies concise and operational: objective, current plan, decisions, blockers, and next action.
4. Prefer updating the issue over creating duplicates.
5. Use `issues.delete` only when the user explicitly asks to remove an issue.

## Issue Body Shape

Use this structure when creating or substantially rewriting an issue body:

```markdown
## Objective

## Current Plan

## Decisions

## Blockers

## Next Action
```

Do not expose internal storage details unless the user asks. If an issue is missing or stale, say so directly and either create a new issue or update the closest existing issue.
