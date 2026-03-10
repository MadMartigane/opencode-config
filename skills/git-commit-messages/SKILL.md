---
name: git-commit-messages
description: Conventional Commits specification for consistent and automated Git history.
version: 1.0.0
---

# Skill: Git Commit Messages

Enforces the **Conventional Commits** specification to ensure a consistent, readable, and machine-parseable Git history.

## Standards

### 1. Message Format
Commit messages must follow this structure:
```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 2. Type (Lowercase)
The type must be one of the following:
- `build`: Changes affecting the build system or external dependencies (e.g., npm, gulp, docker)
- `chore`: Maintenance tasks, library updates, or infra changes that don't modify src/test
- `ci`: Changes to CI configuration and scripts (e.g., GitHub Actions, CI/CD)
- `docs`: Documentation only changes
- `feat`: A new feature
- `fix`: A bug fix
- `perf`: A code change that improves performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `revert`: Reverts a previous commit (include the SHA in the footer)
- `style`: Changes that do not affect the meaning of the code (formatting, linting, etc.)
- `test`: Adding or correcting tests

### 3. Subject (Header)
- **Case**: Must NOT be Sentence-case, Start-Case, PascalCase, or UPPERCASE. Always use **lowercase** or the specific case required by code identifiers.
- **Max Length**: The entire header must not exceed **100 characters**.
- **Punctuation**: Do not end the subject with a period (`.`).
- **Tense**: Use the **imperative present** (e.g., "add", not "added").

### 4. Body
- **Format**: Starts one blank line after the subject.
- **Max Line Length**: 100 characters.
- **Content**: Explain the "why" and "how" of the change if it's not obvious from the subject.

### 5. Footers
- **Format**: Starts one blank line after the body (or subject).
- **Max Line Length**: 100 characters.
- **Breaking Changes**: Must start with `BREAKING CHANGE: ` followed by a space and a description of the impact. Alternatively, add a `!` after the type/scope (e.g., `feat(api)!: ...`).
- **Ticket Reference**: ONLY include a task/ticket identifier in the footer (using the format `ref: <TICKET_ID>`) IF a real ticket ID is explicitly provided in the user request or branch name. If no ticket ID is provided, you MUST omit this footer. NEVER use example placeholders like `ODRER-1234`.
- **Referencing**: Use trailers for issues (e.g., `Refs: #123`) or authors (e.g., `Signed-off-by: Name <email>`).

## Commit Splitting (MANDATORY)

When staged or unstaged changes span **multiple distinct domains** (e.g., a dependency bump alongside a config change, a bug fix alongside a new feature), you MUST split them into separate, focused commits. A single commit MUST represent one cohesive unit of change.

**Decision rule**: If you cannot describe all changes with a single `<type>(<scope>): <subject>` line without using "and" or "also", the changes MUST be split.

**Procedure for splitting**:
1. Identify logical groups of files belonging to the same change domain.
2. Stage only the files for the first group: `git add <files>`.
3. Commit that group with its own message.
4. Repeat for each remaining group.

Never use `git add .` or `git add -A` when changes span multiple domains.

---

## Step-by-Step Procedure

1. **Analysis**: Run `git status` and `git diff` to understand the changes. If changes span multiple distinct domains, **immediately apply the Commit Splitting procedure above** before proceeding.
2. **Type/Scope Determination**:
    - Identify the primary intent (e.g., `feat`, `fix`).
    - Define a scope if it helps clarify the context (e.g., `auth`, `parser`, `ui`).
3. **Drafting**: Create a concise subject line. Ensure it starts with lowercase and uses the imperative tense.
4. **Validation**:
    - Check the 100-character limit for the header and each line of the body/footer.
    - Verify the absence of a trailing period.
    - Check for breaking changes and format them correctly.
5. **Final Review**: Ensure the message matches the repository's existing style while strictly adhering to these standards.
6. **Execution**: Perform the `git commit` with the validated message.
