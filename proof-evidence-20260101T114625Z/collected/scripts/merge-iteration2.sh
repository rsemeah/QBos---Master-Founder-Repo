#!/usr/bin/env bash
set -euo pipefail

# Safe merge script for integration branch
# Usage: ./scripts/merge-iteration2.sh [--no-push]

BRANCH=claude/integrate-magicpatterns-ui-V9Y99
MAIN=main
PUSH=true

if [[ "${1:-}" == "--no-push" ]]; then
  PUSH=false
fi

echo "Switching to ${MAIN}"
git checkout ${MAIN}
echo "Pulling latest ${MAIN}"
git pull --ff-only origin ${MAIN}

echo "Merging ${BRANCH} into ${MAIN}"
git merge --no-ff --no-edit ${BRANCH}

if [ "$PUSH" = true ]; then
  echo "Pushing ${MAIN} to origin"
  git push origin ${MAIN}
else
  echo "Merge completed locally; not pushing (use --no-push to avoid push)"
fi

echo "Merge finished. If you want to revert, use: git reset --hard origin/${MAIN}"
