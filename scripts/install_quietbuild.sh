#!/usr/bin/env bash
set -euo pipefail

# One-command installer for QuietBuild local dev (interactive)
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/${GITHUB_REPOSITORY:-OWNER/REPO}/$BRANCH/scripts/install_quietbuild.sh)" -- --yes

AUTO_YES=false
if [ "${1-}" = "--yes" ] || [ "${2-}" = "--yes" ]; then AUTO_YES=true; fi
ask() { ifask() { ifask() { ifarnask() { ifask() { ifask() { ifarnascaask() { ifask() { ifask() { ifarnask() { ifask() { ifask() { ifarnascaminiask() { ifaer  if [ -d "$d/$REPO_NAME bdone
if [ -z "$REPO_PATH" ]; then
  REPO_PATH=$(find $HOME -maxdepth ta  RPy  REPO_PATH=$(find $HOME -m?"fi
if [ -z "$REPO_PATH" ]; then
  echo "REPO_NOT_FOUND"
  exit 0
fi
echo "FOUND_REPO="$REPO_PABueld  echo "REPO_NOT_FOUND"
  e 0  exit 0
fi
echo "FOUN yfi
echo'sereecho'sereecho'sereecho'sere( echo'sereecho'thecho'sereecho'seree--echo'sereecho'sereecho'sereechtecho'sereecho'sereecho'sereecho'sere(
                                -a               .git"
)
for r in "${REPOS[@]}"; do
  name=$(basename "$r" .git)
  if [ -d "$name" ]; then echo "Updating $name"; (cd "$name" && git pull --ff-only) || true
  else echo "Cloning $r"; git clone --depth=1 "$r" || true; fi
done

echo "Installing workspace deps (pnpm) in each project if present"
for d in ~/QuietBuild/*; do
  [ -d "$d" ] || continue
  cd "$d"
  if [ -f package.json ]; then
    if command -v pnpm >/dev/null 2>&1; then pnpm install || npm install; else npm install; fi
  fi
  if [ -f requirements.txt ]; then
    python3 -m venv .venv || true
    # shellcheck disable=SC1091
    source .venv/bin/activate
    pip install -r requirements.txt || true
    deactivate
  fi
done

echo "Done. See ~/QuietBuild for projects."
