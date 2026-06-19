import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from '@shared/constants'

export interface NavItem {
  labelKey: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/' },
  { labelKey: 'nav.players', path: '/players' },
  { labelKey: 'nav.tournaments', path: '/tournaments' },
  { labelKey: 'nav.ranking', path: '/ranking' },
  { labelKey: 'nav.headToHead', path: '/head-to-head' },
  { labelKey: 'nav.stickers', path: '/stickers' },
  { labelKey: 'nav.settings', path: '/settings' },
]

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">⚽</span>
        <span className="sidebar__title">{APP_NAME}</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
