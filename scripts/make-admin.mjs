// Promotes an existing profile to admin, matched by exact display name.
// Exists because `npx convex run admin:makeAdmin '{"displayName":"..."}'`
// is unreliable on Windows PowerShell — PowerShell 5.1 strips embedded
// double quotes from arguments passed to native executables regardless of
// how they're escaped (backtick, backslash, or a pre-built variable all
// fail the same way). Spawning node directly with an argv array sidesteps
// PowerShell's string-level quoting entirely.
//
// Usage: node scripts/make-admin.mjs "Display Name"
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const displayName = process.argv[2]
if (!displayName) {
  console.error('Usage: node scripts/make-admin.mjs "Display Name"')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const convexBin = require.resolve('convex/package.json').replace('package.json', 'bin/main.js')

const result = spawnSync(
  process.execPath,
  [convexBin, 'run', 'admin:makeAdmin', JSON.stringify({ displayName })],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
