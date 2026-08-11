#!/usr/bin/env node
// Claude Code PreToolUse hook for Bash.
// Dispatches based on the command Claude is trying to run.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// The hook contract: stdin receives JSON with { tool_name, tool_input }
const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    // Only care about Bash calls
    if (payload.tool_name !== 'Bash' && payload.tool_name !== 'bash') {
      process.exit(0); // allow
    }

    const cmd = payload.tool_input?.command || '';

    // Pattern match dev server start commands
    const isDevCommand = /\b(next dev|npm run dev|yarn dev|pnpm dev|bun dev)\b/.test(cmd);

    if (isDevCommand) {
      const checkScript = path.join(process.cwd(), 'scripts', 'predev-check.mjs');
      if (fs.existsSync(checkScript)) {
        try {
          // Inherit stderr so the hook runner (and Claude's console) sees it,
          // but capture stdout in case we need it
          execFileSync('node', [checkScript], {
            stdio: ['ignore', 'ignore', 'inherit'],
            cwd: process.cwd()
          });
        } catch (err) {
          // The predev script failed (exit 1).
          // Claude Code hook contract: exit 2 to BLOCK the tool call.
          // The stderr output we inherited is what the user (and Claude) will see as the reason.
          process.stderr.write(`\n[Hook] Blocked by predev-guard: Sanity checks failed.\nFix the issues above before attempting to start the dev server again.\n`);
          process.exit(2);
        }
      }
    }

    // Pass-through for everything else
    process.exit(0);

  } catch (err) {
    // If we crash parsing stdin, fail open rather than blocking Claude's tools
    process.exit(0);
  }
});
