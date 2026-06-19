import { NavLink } from 'react-router-dom'
import { APP_NAME } from '@shared/constants'

export interface NavItem {
  label: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Players', path: '/players' },
  { label: 'Tournaments', path: '/tournaments' },
  { label: 'Ranking', path: '/ranking' },
  { label: 'Stickers', path: '/stickers' },
  { label: 'Settings', path: '/settings' },
]

export function Sidebar() {
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
