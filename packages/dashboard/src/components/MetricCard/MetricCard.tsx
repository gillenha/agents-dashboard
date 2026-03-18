import styles from './MetricCard.module.css';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
}

export function MetricCard({ label, value, delta, deltaType = 'neutral' }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {delta && (
        <div className={`${styles.delta} ${deltaType !== 'neutral' ? styles[deltaType] : ''}`}>
          {delta}
        </div>
      )}
    </div>
  );
}
