import styles from './StatusBadge.module.css';

type Status =
  | 'idle' | 'running' | 'error' | 'offline'
  | 'queued' | 'completed' | 'failed'
  | 'info' | 'warn';

export interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} />
      {status}
    </span>
  );
}
