---
name: git-commit-messages
description: Conventional Commits specification for consistent and automated Git history.
version: 1.0.0
---

# Skill: Git Commit Messages

Enforce the Conventional Commits specification to ensure a consistent, readable, and machine-parseable Git history.

## 1. Message Format

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## 2. Structural Rules

### Header `<type>(<scope>): <subject>`

- **Length**: Maximum 100 characters.
- **Type**: Must be lowercase. Allowed values:
  - `feat`: New feature
  - `fix`: Bug fix
  - `build`: Build system or external dependencies
  - `chore`: Maintenance, library updates, infra changes
  - `ci`: CI configuration and scripts
  - `docs`: Documentation only
  - `perf`: Performance improvement
  - `refactor`: Code change that neither fixes a bug nor adds a feature
  - `revert`: Reverts a previous commit
  - `style`: Formatting, linting, no code meaning change
  - `test`: Adding or correcting tests
- **Scope**: Optional. Must be lowercase and indicate the context (e.g., `api`, `ui`).
- **Subject**:
  - Use imperative, present tense (e.g., "add", not "added" or "adds").
  - Use lowercase (except for specific code identifiers).
  - Do NOT end with a period (`.`).

### Body

- **Spacing**: Must be separated from the header by one blank line.
- **Length**: Wrap lines at 100 characters.
- **Content**: Explain the "why" and "how" of the change. Do not repeat the "what" (the code diff).

### Footers

- **Spacing**: Must be separated from the body (or header) by one blank line.
- **Length**: Wrap lines at 100 characters.
- **Breaking Changes**: Must start with `BREAKING CHANGE:` followed by a description. Alternatively, append `!` to the type/scope (e.g., `feat(api)!: ...`).
- **References**: Use `Refs: <ID>` for issues/tickets. ONLY include real ticket IDs provided in the prompt or branch name. NEVER invent or use placeholder IDs. Use standard trailers for authors (e.g., `Signed-off-by: Name <email>`).

## 3. Commit Splitting (Mandatory)

A single commit MUST represent exactly **one cohesive unit of change**.

- **Rule**: If the changes require "and" or "also" in the subject line, they MUST be split into multiple commits.
- **Execution**:
  1. Identify logical groups of files.
  2. Stage and commit each group separately (`git add <specific-files>`).
  3. NEVER use `git add .` or `git add -A` when changes span multiple domains (e.g., mixing a feature with a dependency bump).

## 4. Execution Workflow

1. **Analyze**: Run `git status` and `git diff` to evaluate pending changes.
2. **Split**: Apply the Commit Splitting rule if changes span multiple domains.
3. **Draft**: Formulate the message following the Structural Rules.
4. **Commit**: Execute `git commit -m "<message>"` (use a heredoc for multi-line messages).
