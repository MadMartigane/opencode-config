# Skill: Git Cleaner

This skill allows the agent to clean the Git history of a branch by performing rebases and squashes of commits in a professional manner.

## Capabilities

### 1. Branch Rebase
- Always perform `git fetch origin` before rebasing.
- **Identify the target branch (base)** according to the following priority hierarchy:
  1. `release/next` (if it exists on the remote)
  2. `develop` (if it exists on the remote and `release/next` is absent)
  3. `main` or `master` (as a last resort)
- Use `git rebase origin/<target_branch>`.
- In case of conflict, the agent must stop and list the conflicting files.

### 2. Commit Squash
- Calculate the number of commits to squash from the divergence point with the target branch.
- Use the `soft reset` method to preserve changes in the index:
  1. `git reset --soft HEAD~<N>` (where N is the number of commits).
  2. `git commit -m "<clean_message>"` (see commit message standards below).
- Alternatively, use `git rebase -i` if the environment allows it, but `soft reset` is more reliable for agent automation.

## Commit Message Standards

Commit messages must follow the **Conventional Commits** format with strict style constraints:
`<type>(<scope>): <description>`

**Mandatory style rules for `<description>`:**
- **Never capitalize** the beginning of the description.
- **Never use a period** at the end of the description.
- Use imperative present tense (e.g., `add` instead of `added` or `adds`).

Allowed types:
- `feat`: New feature.
- `fix`: Bug fix.
- `docs`: Documentation.
- `style`: Formatting, missing semicolons, etc. (no code changes).
- `refactor`: Code refactoring.
- `test`: Adding or modifying tests.
- `chore`: Maintenance tasks.

Example: `feat(auth): add jwt validation logic` (not `Feat(auth): Add JWT validation logic.`)

## Step-by-Step Procedure for the Agent

1. **Analysis**: Check the current status (`git status`) and history (`git log --oneline -n 10`).
2. **Identification**: Determine the base branch and the number of commits unique to the current branch.
3. **Rebase Action**: Rebase onto the updated base branch.
4. **Squash Action**: If requested or necessary for cleanliness, squash the commits.
5. **Verification**: Ensure tests still pass (if configured) and that the history is clean.
