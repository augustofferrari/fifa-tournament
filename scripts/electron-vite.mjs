import { spawnSync } from 'node:child_process'
import { fixElectronSignature } from './fix-electron-signature.mjs'
import { ensureNativeForElectron } from './rebuild-native.mjs'

delete process.env.ELECTRON_RUN_AS_NODE

const command = process.argv[2]

if (command !== 'dev' && command !== 'preview') {
  console.error('Usage: node scripts/electron-vite.mjs <dev|preview>')
  process.exit(1)
}

ensureNativeForElectron()
fixElectronSignature()

const result = spawnSync('electron-vite', [command], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

process.exit(result.status ?? 1)
