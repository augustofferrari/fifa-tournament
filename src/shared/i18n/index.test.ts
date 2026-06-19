import { describe, expect, it } from 'vitest'
import { translate } from './index'

describe('translate', () => {
  it('returns Spanish strings by default', () => {
    expect(translate('nav.dashboard', 'es')).toBe('Panel')
  })

  it('returns English strings when requested', () => {
    expect(translate('nav.dashboard', 'en')).toBe('Dashboard')
  })

  it('interpolates parameters', () => {
    expect(
      translate('players.deleteConfirm', 'es', { name: 'Lionel' }),
    ).toBe('¿Eliminar a Lionel? Esta acción no se puede deshacer.')
  })

  it('falls back to the key when a translation is missing', () => {
    expect(translate('missing.key', 'es')).toBe('missing.key')
  })
})
