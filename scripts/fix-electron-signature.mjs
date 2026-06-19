import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ELECTRON_APP = resolve('node_modules/electron/dist/Electron.app')

/**
 * On macOS (especially Apple Silicon) the locally installed Electron binary can
 * end up with an invalid code signature after native rebuilds or running the
 * binary from restricted shells. An invalid signature makes macOS kill the
 * helper (GPU/renderer) processes, surfacing as:
 *   bootstrap_look_up ... MachPortRendezvousServer ... Permission denied (1100)
 *   No rendezvous client, terminating process (parent died?)
 * Re-signing ad-hoc (`-`) restores a valid signature.
 */
export function fixElectronSignature() {
  if (process.platform !== 'darwin') {
    return
  }

  if (!existsSync(ELECTRON_APP)) {
    return
  }

  if (isSignatureValid()) {
    return
  }

  console.log('Electron code signature invalid — re-signing ad-hoc…')

  try {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', ELECTRON_APP], {
      stdio: 'inherit',
    })
    console.log('Electron re-signed successfully.')
  } catch (error) {
    console.warn('Could not re-sign Electron automatically:', error.message)
  }
}

function isSignatureValid() {
  try {
    execFileSync('codesign', ['--verify', '--deep', '--strict', ELECTRON_APP], {
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixElectronSignature()
}
