#!/bin/bash
# https://docs.anthropic.com/en/docs/claude-code/claude-code-on-the-web#dependency-management

# Only run in remote environments
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

apt update && apt install gh -y
cd "$CLAUDE_PROJECT_DIR/app" && pnpm install
