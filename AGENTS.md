# Language Policy

- **User Interaction**: All interactions with the user (primary agents) are in **French**.
- **Source Code**: All code comments, documentation, and commit messages must be in **English**.
- **Internal Delegation**: Instructions sent to subagents (like `Git-Expert`) via the `task` tool must be in **English** to ensure maximum performance and model compatibility.
- **Technical Prompts**: Primary agent prompts are in French, while subagent prompts are in English.

# Working Directory

- **Configuration Repository**: This project is the source of truth for OpenCode configuration. The `~/.config/opencode` path is a symbolic link pointing to this repository. Always work directly in this repository (the current working directory) - never attempt to edit files through the `~/.config/opencode` path. Treat this directory as a standalone project that happens to be linked from the config location.
