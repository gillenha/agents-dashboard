import type { Contact } from '../../clients/cag';
import DemoBadge from '../DemoBadge';
import { formatDateTime } from '../../utils';
import styles from './EscalationQueue.module.css';

interface EscalationQueueProps {
  contacts: Contact[];
  onSelect: (id: string) => void;
}

export default function EscalationQueue({ contacts, onSelect }: EscalationQueueProps) {
  const escalated = contacts.filter((c) => c.status === 'escalated');

  return (
    <div className={styles.queue}>
      <div className={styles.header}>
        <span className={styles.title}>Escalations</span>
        {escalated.length > 0 && (
          <span className={styles.badge}>{escalated.length}</span>
        )}
      </div>

      {escalated.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✓</span>
          <p className={styles.emptyText}>No active escalations</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {escalated.map((c) => (
            <li
              key={c.id}
              className={styles.item}
              onClick={() => onSelect(c.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.name}>{c.name}</span>
                <DemoBadge status={c.status} />
              </div>
              <p className={styles.reason}>{c.escalationReason}</p>
              <span className={styles.time}>{formatDateTime(c.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.divider} />

      <div className={styles.statsHeader}>
        <span className={styles.statsTitle}>Activity Summary</span>
      </div>
      <div className={styles.stats}>
        {(['resolved', 'tour_scheduled', 'follow_up_sent', 'new'] as const).map((status) => {
          const count = contacts.filter((c) => c.status === status).length;
          const label: Record<string, string> = {
            resolved: 'Resolved',
            tour_scheduled: 'Tours Booked',
            follow_up_sent: 'Awaiting Reply',
            new: 'New Inquiries',
          };
          return (
            <div key={status} className={styles.stat}>
              <span className={styles.statCount}>{count}</span>
              <span className={styles.statLabel}>{label[status]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
