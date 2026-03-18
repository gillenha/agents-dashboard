import styles from './StatusBadge.module.css';

type Status =
  | 'idle' | 'running' | 'error' | 'offline'
  | 'queued' | 'completed' | 'failed'
  | 'info' | 'warn';

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} />
      {status}
    </span>
  );
}
