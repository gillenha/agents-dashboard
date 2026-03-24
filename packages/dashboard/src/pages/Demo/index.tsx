import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { cagConfig } from './clients/cag';
import type { ClientConfig } from './clients/cag';
import InquiryFeed from './components/InquiryFeed';
import ContactTimeline from './components/ContactTimeline';
import EscalationQueue from './components/EscalationQueue';
import styles from './Demo.module.css';

const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  cag: cagConfig,
};

export default function Demo() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const config = clientSlug ? CLIENT_CONFIGS[clientSlug] : undefined;

  const [selectedId, setSelectedId] = useState<string | null>(
    config?.contacts[0]?.id ?? null,
  );

  if (!config) {
    return <Navigate to="/" replace />;
  }

  const selectedContact = config.contacts.find((c) => c.id === selectedId) ?? null;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.clientInfo}>
          <span className={styles.clientName}>{config.name}</span>
          <span className={styles.clientLocation}>{config.location}</span>
        </div>
        <div className={styles.poweredBy}>
          <span className={styles.poweredByLabel}>Powered by</span>
          <span className={styles.brand}>devpigh</span>
        </div>
      </header>

      <div className={styles.columns}>
        <div className={styles.colLeft}>
          <InquiryFeed
            contacts={config.contacts}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className={styles.colCenter}>
          <ContactTimeline contact={selectedContact} />
        </div>
        <div className={styles.colRight}>
          <EscalationQueue contacts={config.contacts} onSelect={setSelectedId} />
        </div>
      </div>
    </div>
  );
}
