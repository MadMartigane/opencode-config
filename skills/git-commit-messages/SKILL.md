# Skill: Git Commit Messages

Enforces Conventional Commits format for professional Git messages.

## Standards
Format: `<type>(<scope>): <description>`

**Rules for `<description>`:**
- Entire description in lowercase: no uppercase letters anywhere (starts lowercase).
- No period at end.
- Imperative present (e.g., `add` not `added`).

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Example: `feat(auth): add jwt validation logic`

## Generation Protocol
- Analyze `git diff` autonomously.
- Correct user messages to lowercase/imperative (e.g., "Add Feature" → "add feature").
- Strict enforcement: Never commit violating formats.