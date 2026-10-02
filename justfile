# Just recipes
# variables
name := 'curios-themes'
owner := 'CuriosLabs'

# Default option list available recipes.
default:
  @just --list

# Linting AI agents skill TS files.
lint:
  @echo 'Linting TypeScript files...'
  NODE_PATH=$(npm root -g) eslint -c ./.agents/skills/brave-tools/scripts/eslint.config.mjs ./.agents/skills/brave-tools/scripts/*.ts && echo 'brave-tools: SUCCESS'
  NODE_PATH=$(npm root -g) eslint -c ./.agents/skills/email/scripts/eslint.config.mjs ./.agents/skills/email/scripts/*.ts && echo 'Email-Skill: SUCCESS'
  NODE_PATH=$(npm root -g) eslint -c ./.pi/agent/extensions/eslint.config.mjs ./.pi/agent/extensions/*.ts && echo 'Pi Extensions: SUCCESS'
  NODE_PATH=$(npm root -g) eslint -c ./.pi/agent/extensions/eslint.config.mjs ./.config/opencode/plugins/*.ts && echo 'Opencode Plugins: SUCCESS'

# Complete publish process: lint, tag and finally push on github.
publish VERSION:
  @if git rev-parse "{{VERSION}}" >/dev/null 2>&1; then echo "Warning: Tag {{VERSION}} already exists."; exit 1; fi
  #git checkout testing
  @just lint
  @just tag {{VERSION}}

# Update version number, create Git commit and tag and push it.
tag VERSION:
  git commit -a -m "Release {{VERSION}}"
  git pull
  @echo "Tagging version: {{VERSION}}"
  git tag -a {{VERSION}} -m "Release {{VERSION}}"
  git push origin {{VERSION}}

# Remove Git tag locally and remotely
removetag VERSION:
  git tag -d {{VERSION}}
  git push --delete origin {{VERSION}}
