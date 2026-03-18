import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import styles from './Layout.module.css';

export interface LayoutProps {}

export function Layout(_props: LayoutProps) {
  return (
    <div className={styles.root}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
