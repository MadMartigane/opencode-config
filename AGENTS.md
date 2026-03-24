# Language Policy

- **French**: Use for all user interactions and primary agent prompts.
- **English**: Use for source code (comments, documentation), commit messages, and subagent instructions (via the `task` tool).

# Workspace Rules

- **Current Directory Only**: Always operate directly in the current working directory.
- **No Symlink Access**: Never access or modify files through the `~/.config/opencode` path.
