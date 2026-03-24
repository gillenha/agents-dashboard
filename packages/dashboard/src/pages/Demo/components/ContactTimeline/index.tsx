import type { Contact, TimelineEvent } from '../../clients/cag';
import DemoBadge from '../DemoBadge';
import { formatDateTime } from '../../utils';
import styles from './ContactTimeline.module.css';

interface ContactTimelineProps {
  contact: Contact | null;
}

const ACTOR_LABEL: Record<string, string> = {
  Applicant: 'Applicant',
  IntakeAgent: 'Intake Agent',
  SchedulingAgent: 'Scheduling Agent',
  CommunicationAgent: 'Communication Agent',
  EscalationAgent: 'Escalation Agent',
};

function TimelineItem({ event }: { event: TimelineEvent }) {
  const isApplicant = event.actor === 'Applicant';
  const isSms = event.type === 'sms';

  if (!isSms) {
    return (
      <div className={styles.systemEvent}>
        <span className={styles.systemTime}>{formatDateTime(event.timestamp)}</span>
        <span className={styles.systemActor}>{ACTOR_LABEL[event.actor] ?? event.actor}</span>
        <span className={styles.systemDot}>·</span>
        <span className={styles.systemMessage}>{event.message}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.bubble} ${isApplicant ? styles.bubbleLeft : styles.bubbleRight}`}>
      <div className={styles.bubbleMeta}>
        <span className={styles.bubbleActor}>
          {isApplicant ? 'Applicant' : ACTOR_LABEL[event.actor] ?? event.actor}
        </span>
        <span className={styles.bubbleTime}>{formatDateTime(event.timestamp)}</span>
      </div>
      <div className={`${styles.bubbleText} ${isApplicant ? styles.bubbleTextLeft : styles.bubbleTextRight}`}>
        {event.message}
      </div>
    </div>
  );
}

export default function ContactTimeline({ contact }: ContactTimelineProps) {
  if (!contact) {
    return (
      <div className={styles.empty}>
        <p>Select an inquiry to view the conversation timeline.</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.contactName}>{contact.name}</span>
          <span className={styles.channel}>{contact.channel}</span>
        </div>
        <DemoBadge status={contact.status} />
      </div>

      {contact.escalationReason && (
        <div className={styles.escalationBanner}>
          <span className={styles.escalationIcon}>⚠️</span>
          <span>{contact.escalationReason}</span>
        </div>
      )}

      <div className={styles.events}>
        {contact.timeline.map((event) => (
          <TimelineItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
