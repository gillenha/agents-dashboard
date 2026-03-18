import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

export interface SidebarProps {}

const navItems = [
  {
    label: 'Overview',
    path: '/',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1"/>
        <rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/>
        <rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Agents',
    path: '/agents',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="5" r="3"/>
        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
      </svg>
    ),
  },
  {
    label: 'Tasks',
    path: '/tasks',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12M2 8h8M2 12h10"/>
      </svg>
    ),
  },
];

export function Sidebar(_props: SidebarProps) {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>devpigh</span>
        <span className={styles.logoSub}>v1</span>
      </div>

      <div className={styles.nav}>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navItem}${isActive ? ` ${styles.active}` : ''}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.statusDot}>
          <span className={styles.dot} />
          API connected
        </span>
      </div>
    </nav>
  );
}
