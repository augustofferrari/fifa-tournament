import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)

const CONFIG_GYPI = resolve('node_modules/better-sqlite3/build/config.gypi')

function getElectronVersion() {
  return require('electron/package.json').version
}

function getBuiltModuleVersion() {
  if (!existsSync(CONFIG_GYPI)) {
    return null
  }

  const match = readFileSync(CONFIG_GYPI, 'utf8').match(/"node_module_version":\s*(\d+)/)
  return match ? Number(match[1]) : null
}

/**
 * Rebuilds better-sqlite3 from source against Electron's ABI. Running `npm test`
 * (vitest under Node) rebuilds it for Node's ABI, which then crashes the Electron
 * main process on load and surfaces as MachPortRendezvous "parent died" errors.
 */
export function rebuildNativeForElectron() {
  const electronVersion = getElectronVersion()
  console.log(`Rebuilding better-sqlite3 from source for Electron ${electronVersion}…`)

  execFileSync(
    'npm',
    [
      'rebuild',
      'better-sqlite3',
      '--build-from-source',
      '--runtime=electron',
      `--target=${electronVersion}`,
      '--dist-url=https://electronjs.org/headers',
    ],
    { stdio: 'inherit' },
  )
}

/**
 * Rebuilds only when the installed binary is missing or was built for the Node
 * ABI (the common breakage after running tests). Keeps `npm run dev` fast when
 * the binary is already correct.
 */
export function ensureNativeForElectron() {
  const built = getBuiltModuleVersion()
  const nodeAbi = Number(process.versions.modules)

  if (built !== null && built !== nodeAbi) {
    return
  }

  try {
    rebuildNativeForElectron()
  } catch (error) {
    console.warn('Could not rebuild better-sqlite3 for Electron automatically:', error.message)
    console.warn('Run "npm run rebuild:native" manually.')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  rebuildNativeForElectron()
}
