#!/usr/bin/env bash
# install.sh — copy this Claude Code template into a target Next.js app.
#
# Mirrors README.md's "How to use it" steps 1-2, but never overwrites a file
# that already exists in the target (existing CLAUDE.md, .claude/settings.json,
# etc. are left alone and reported so you can merge them by hand).
#
# Usage: ./install.sh <path-to-your-app>

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <path-to-your-app>" >&2
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  echo "Error: target directory '$TARGET' does not exist." >&2
  exit 1
fi

if [[ ! -f "$TARGET/package.json" ]]; then
  echo "Error: '$TARGET' has no package.json — is this a Next.js app root?" >&2
  exit 1
fi

TARGET="$(cd "$TARGET" && pwd)"

copied=()
skipped=()

# copy_dir SRC DEST [--exclude BASENAME] — recursive copy, file by file, never
# overwrites an existing file. --exclude skips any file with that exact basename
# (used for machine-local files like .claude/settings.local.json, which are
# gitignored and never meant to be shipped to a downstream project).
copy_dir() {
  local src="$1" dest="$2" exclude=""
  if [[ "${3:-}" == "--exclude" ]]; then
    exclude="$4"
  fi
  mkdir -p "$dest"
  while IFS= read -r -d '' file; do
    if [[ -n "$exclude" && "$(basename "$file")" == "$exclude" ]]; then
      continue
    fi
    local rel="${file#"$src"/}"
    local out="$dest/$rel"
    if [[ -e "$out" ]]; then
      skipped+=("$out")
    else
      mkdir -p "$(dirname "$out")"
      cp "$file" "$out"
      copied+=("$out")
    fi
  done < <(find "$src" -type f -print0)
}

copy_file() {
  local src="$1" dest="$2"
  if [[ -e "$dest" ]]; then
    skipped+=("$dest")
  else
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    copied+=("$dest")
  fi
}

echo "==> Copying .claude/ ..."
copy_dir "$SRC_DIR/.claude" "$TARGET/.claude" --exclude "settings.local.json"

echo "==> Copying scripts/ ..."
copy_dir "$SRC_DIR/scripts" "$TARGET/scripts"

echo "==> Copying top-level files ..."
copy_file "$SRC_DIR/CLAUDE.md" "$TARGET/CLAUDE.md"
copy_file "$SRC_DIR/eslint.config.mjs" "$TARGET/eslint.config.mjs"
copy_file "$SRC_DIR/.env.example" "$TARGET/.env.example"

echo ""
echo "Copied ${#copied[@]} file(s)."
if [[ ${#skipped[@]} -gt 0 ]]; then
  echo ""
  echo "Skipped ${#skipped[@]} file(s) that already exist in the target — merge these by hand:"
  for f in "${skipped[@]}"; do
    echo "   - $f"
  done
fi

# ---- wire predev into package.json (additive only, never touches existing scripts) ----
echo ""
echo "==> Wiring predev into $TARGET/package.json ..."
node - "$TARGET/package.json" <<'EOF'
const fs = require("fs");
const path = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
pkg.scripts = pkg.scripts || {};

let changed = false;
if (!pkg.scripts.predev) {
  pkg.scripts.predev = "node scripts/predev-check.mjs";
  changed = true;
} else {
  console.warn(`predev script already exists — leaving it as-is: ${pkg.scripts.predev}`);
}
if (!pkg.scripts["predev:strict"]) {
  pkg.scripts["predev:strict"] = "node scripts/predev-check.mjs --strict";
  changed = true;
}
if (!pkg.scripts.dev) {
  pkg.scripts.dev = "next dev --turbopack";
  changed = true;
}

if (changed) {
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log("package.json updated.");
} else {
  console.log("package.json already had predev/predev:strict/dev — nothing to change.");
}
EOF

echo ""
echo "Done. Next steps:"
echo "  1. Make sure @eslint/eslintrc is a devDependency (create-next-app installs it by default):"
echo "       pnpm add -D @eslint/eslintrc"
echo "  2. Merge real values into $TARGET/.env.example / .env.local for your stack."
echo "  3. Verify the predev hook actually blocks:"
echo "       cd $TARGET && rm -f .env.local"
echo "       echo '{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"npm run dev\"}}' | node .claude/hooks/predev-guard.mjs; echo \"exit: \$?\""
