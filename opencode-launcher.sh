#!/bin/bash
# OpenCode launcher with .env loading
set -a  # Export all variables automatically
source ~/.config/opencode/.env 2>/dev/null || true
set +a  # Stop auto-exporting
exec opencode "$@"