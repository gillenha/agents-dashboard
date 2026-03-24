import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { cagConfig } from './clients/cag';
import type { ClientConfig } from './clients/cag';
import { useSimulation } from './hooks/useSimulation';
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

  const { state: simState, start: startSim } = useSimulation();

  // Auto-select Marcus Webb when simulation starts
  useEffect(() => {
    if (simState.running) {
      setSelectedId('marcus-webb');
    }
  }, [simState.running]);

  if (!config) {
    return <Navigate to="/" replace />;
  }

  // Replace the static marcus-webb entry with the live sim contact when active
  const displayContacts = simState.simContact
    ? [
        simState.simContact,
        ...config.contacts.filter((c) => c.id !== 'marcus-webb'),
      ]
    : config.contacts;

  // Resolve the selected contact — use simContact when applicable
  const selectedContact =
    selectedId === 'marcus-webb' && simState.simContact
      ? simState.simContact
      : config.contacts.find((c) => c.id === selectedId) ?? null;

  const isSimView = selectedId === 'marcus-webb' && simState.simContact !== null;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.clientInfo}>
          <span className={styles.clientName}>{config.name}</span>
          <span className={styles.clientLocation}>{config.location}</span>
        </div>

        <button
          className={styles.runButton}
          onClick={startSim}
          disabled={simState.running}
        >
          {simState.running ? '● Running...' : '▶ Run Live Demo'}
        </button>

        <div className={styles.poweredBy}>
          <span className={styles.poweredByLabel}>Powered by</span>
          <span className={styles.brand}>devpigh</span>
        </div>
      </header>

      <div className={styles.columns}>
        <div className={styles.colLeft}>
          <InquiryFeed
            contacts={displayContacts}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className={styles.colCenter}>
          <ContactTimeline
            contact={selectedContact}
            isSimulation={isSimView}
            showThinking={isSimView && simState.thinking}
          />
        </div>
        <div className={styles.colRight}>
          <EscalationQueue contacts={displayContacts} onSelect={setSelectedId} />
        </div>
      </div>
    </div>
  );
}
