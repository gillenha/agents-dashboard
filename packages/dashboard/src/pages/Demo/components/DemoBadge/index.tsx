import type { ContactStatus } from '../../clients/cag';
import styles from './DemoBadge.module.css';

interface DemoBadgeProps {
  status: ContactStatus;
}

const LABELS: Record<ContactStatus, string> = {
  new: 'New',
  tour_scheduled: 'Tour Scheduled',
  follow_up_sent: 'Follow-up Sent',
  escalated: 'Escalated',
  resolved: 'Resolved',
};

const STATUS_CLASS: Record<ContactStatus, string> = {
  new: styles.new,
  tour_scheduled: styles.tourScheduled,
  follow_up_sent: styles.followUpSent,
  escalated: styles.escalated,
  resolved: styles.resolved,
};

export default function DemoBadge({ status }: DemoBadgeProps) {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {LABELS[status]}
    </span>
  );
}
