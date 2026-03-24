import type { Contact } from '../../clients/cag';
import DemoBadge from '../DemoBadge';
import { formatDateTime } from '../../utils';
import styles from './InquiryFeed.module.css';

interface InquiryFeedProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CHANNEL_ICON: Record<string, string> = {
  SMS: '💬',
  Phone: '📞',
  Web: '🌐',
};

export default function InquiryFeed({ contacts, selectedId, onSelect }: InquiryFeedProps) {
  return (
    <div className={styles.feed}>
      <div className={styles.header}>
        <span className={styles.title}>Inquiries</span>
        <span className={styles.count}>{contacts.length}</span>
      </div>
      <ul className={styles.list}>
        {contacts.map((c) => (
          <li
            key={c.id}
            className={`${styles.item} ${c.id === selectedId ? styles.selected : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <div className={styles.row}>
              <span className={styles.name}>{c.name}</span>
              <span className={styles.time}>{formatDateTime(c.timestamp)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.channel}>
                {CHANNEL_ICON[c.channel]} {c.channel}
              </span>
              <DemoBadge status={c.status} />
            </div>
            <p className={styles.preview}>{c.preview}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
