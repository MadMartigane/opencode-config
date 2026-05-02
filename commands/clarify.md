---
name: clarify
description: Clarify and challenge the user's request before proceeding
---

$1

This is a **CLARIFICATION SESSION**. Your goal is to produce a complete, precise, and actionable understanding of the request — with minimal user input.

## Phase 1: Autonomous Investigation (MANDATORY FIRST STEP)

Before asking ANY question, you MUST:
1. **Search the codebase**: Use `explore` to find relevant code, patterns, dependencies, and architecture.
2. **Search documentation**: Check README, docs, AGENTS.md, and any project-specific context files.
3. **Search the web** (if applicable): Look up best practices, known issues, or official docs for the technologies involved.

You MUST NOT ask a question that can be answered by reading code, documentation, or a quick web search.

## Phase 2: Gap Analysis

After investigation, analyze what remains unclear:
- **Clear**: You have enough context to produce a precise specification → Skip questions, go to Phase 3.
- **Partially clear**: Some ambiguities remain → Ask ONLY the questions you could NOT resolve yourself.
- **Unclear**: Critical information is missing → Ask the minimum set of targeted questions.

## Phase 3: Reformulation

Produce a structured reformulation of the request:

```markdown
## Clarified Request

### What
[1-2 sentence summary of what needs to be done]

### Context (from investigation)
[Key findings from codebase, docs, web — concise, factual]

### Scope
- **In scope**: [list]
- **Out of scope**: [list]

### Constraints
[Technical constraints, patterns to follow, compatibility requirements]

### Open Questions (if any)
[ONLY the questions you could NOT resolve yourself. If none, write "None — ready for planning."]
```

## Rules

- **Be autonomous**: Gather as much information as possible before asking.
- **Be concise**: No filler. Every word must add value.
- **Be honest**: If the request is already clear, say so and produce the reformulation directly.
- **Do NOT plan or implement**: This session is about understanding, not solving.
- **Do NOT ask for the sake of asking**: Questions are a last resort, not a default behavior.
- **WAIT for explicit trigger**: After presenting the clarified request, STOP. Do not proceed to planning or implementation. The user must explicitly invoke `/plan` or `/plan-thinker` to move to the next phase.
