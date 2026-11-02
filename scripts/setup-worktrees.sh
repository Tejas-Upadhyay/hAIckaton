#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Keep an existing staged change from being swept into the scaffold commit.
if ! git diff --cached --quiet; then
  echo "Existing staged changes found. Commit or unstage them before running this script."
  exit 1
fi

git add -- .gitignore .env.example package.json vite.config.js index.html \
  src server tests docs scripts AGENTS.md README.md plan.md prompts.txt

if ! git diff --cached --quiet; then
  git commit -m "chore: scaffold StormGuard app and agent contracts"
fi

mkdir -p .worktrees
if [ ! -f .worktrees/backend/.git ]; then
  git worktree add -b work/backend .worktrees/backend HEAD
fi
if [ ! -f .worktrees/frontend/.git ]; then
  git worktree add -b work/frontend .worktrees/frontend HEAD
fi

git worktree list
