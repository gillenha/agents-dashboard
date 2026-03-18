import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './TopBar.module.css';

function buildCrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: 'devpigh', path: '/' }];

  let current = '';
  for (const part of parts) {
    current += `/${part}`;
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    crumbs.push({ label, path: current });
  }
  return crumbs;
}

export function TopBar() {
  const location = useLocation();
  const crumbs = buildCrumbs(location.pathname);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={styles.topbar}>
      <nav className={styles.breadcrumbs}>
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className={styles.crumbGroup}>
            {i > 0 && <span className={styles.separator}>/</span>}
            <Link to={crumb.path} className={styles.crumb}>
              {crumb.label}
            </Link>
          </span>
        ))}
      </nav>

      <div className={styles.right}>
        <div className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${styles.online}`} />
          Live
        </div>
        <span className={styles.time}>{time}</span>
      </div>
    </header>
  );
}
