---
name: clean-code
description: Clean code principles for producing readable and maintainable code.
version: 1.0.0
---

# Clean Code Skill for Coding Sub-Agent

## Overarching Mindset
As a sub-agent for simple code tasks, produce code that's like good art—intuitively readable, maintainable, and elegant without needing explanations. Prioritize quality and cleanliness in every output, assuming architecture is pre-decided by the main agent. If project rules (e.g., style guides) are provided or detectable, apply them consistently.

## Rules by Category

### Mindset & Process
- **LeBlanc's Law (Later Equals Never)**: Don't delay cleanliness; for isolated tasks, always generate clean code in one pass. No "later" iterations unless specified—output polished, readable code immediately. Enrichment: In reasoning, plan to refine before final output.
- **The Primal Conundrum**: Prioritize clean, maintainable code over quick hacks, even in simple tasks. Cleanliness ensures long-term speed and ease. Enrichment: If a task seems rushed, still focus on quality—e.g., break complex logic into small pieces.
- **Boy Scout Rule**: When editing or extending code, leave it better than found: improve naming, remove minor smells without changing logic. Enrichment: For sub-agent, apply incrementally in provided snippets; e.g., rename variables if unclear.
- **Scaling Up Myth**: Implement only what's needed for the current task; prepare for easy extension. Enrichment: Keep code minimal—avoid over-generalizing unless instructed.
- **Successive Refinement**: Generate working code, then refine for cleanliness in your reasoning steps. Enrichment: Structure thoughts as "Draft → Refine" to ensure final output is iterated for quality.

### Naming
- **Effective Naming Practices**: Use intention-revealing, searchable, and descriptive names that explain purpose, what, and how—self-documenting without comments. Avoid single-letter or cryptic names; prefer long, consistent ones. Treat naming as a priority skill; spend reasoning time on choices. Enrichment: E.g., `calculate_total_price(items)` not `calc(items)` or `i`; apply project conventions (e.g., camelCase in JS).

### Functions
- **Functions Do One Thing**: Each function performs one task well. Enrichment: For simple tasks, decompose if needed—e.g., separate validation from processing.
- **Command Query Separation**: Functions either change state (command) or return info (query), not both. Enrichment: E.g., `get_user()` returns data; `update_user()` modifies. Avoid side effects in queries.
- **Prefer Early Returns**: Use early returns to handle edge cases upfront, avoiding nested if/else. Split functions further if needed to flatten logic. Enrichment: E.g., Instead of deep nesting: if (condition) { if (sub) { ... } else { ... } }, do: if (!condition) return; if (!sub) return error; // main logic. This improves readability in web/async flows.

### Error Handling
- **Use Exceptions for Errors**: Prefer exceptions over return codes. Enrichment: In languages like Python/JS, throw descriptive errors.
- **Write Try-Catch First**: Plan error handling early in code structure. Enrichment: For sub-agent, include in initial draft.
- **Provide Context with Exceptions**: Include meaningful messages/context. Enrichment: E.g., `raise ValueError("Invalid input: expected positive number")`.
- **Wrap Third-Party Exceptions**: Wrap external errors in custom ones. Enrichment: If using libs in task, isolate for cleanliness.

### Classes & Objects
- **Law of Demeter**: Avoid deep access chains; talk only to direct dependencies. Enrichment: E.g., No `obj.a.b.c()`—pass or extract needed data.
- **Objects vs. Data Structures**: Objects hide data/expose behavior; DTOs expose data. Enrichment: Use appropriately in simple classes.
- **Classes Should Be Small**: Keep classes focused and small. Enrichment: Align with single task scope.
- **Single Responsibility Principle (SRP)**: One reason to change per class/module. Enrichment: For sub-agent, ensure generated classes/functions stick to one job.
- **Open-Closed Principle**: Prefer extension over modification. Enrichment: If extending code, use inheritance/composition without altering originals.
- **Dependency Injection (DI)**: Delegate dependency creation externally. Enrichment: Use in simple setups; e.g., pass params instead of hardcoding.

### Data & Mutation
- **Mutation Control**: Prefer immutability: copy data/objects, treat as read-only. Enrichment: Reduces bugs in shared state (common in web).

### Boundaries
- **Boundaries with Third-Party Code**: Use wrappers for external interfaces. Enrichment: In tasks with libs, adapt for isolation.

### Additional (Web Dev)
- **DRY (Don't Repeat Yourself)**: Avoid code duplication; extract reusable helpers. Enrichment: In web tasks, reuse logic like validators; keeps simple code maintainable.
- **KISS (Keep It Simple, Stupid)**: Favor simple solutions; avoid unnecessary complexity. Enrichment: For sub-agent, stick to straightforward implementations.
- **Avoid Side Effects**: Write pure functions without hidden changes. Enrichment: Enhances predictability, especially in JS/web event handlers.
