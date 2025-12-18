#!/bin/bash
# https://docs.anthropic.com/en/docs/claude-code/claude-code-on-the-web#dependency-management

# Only run in remote environments
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

# Install gh CLI via direct download (faster than apt update)
GH_VERSION="2.45.0"
curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_amd64.tar.gz" | tar -xz
mv "gh_${GH_VERSION}_linux_amd64/bin/gh" /usr/local/bin/
rm -rf "gh_${GH_VERSION}_linux_amd64"
