import { useState, useRef, useCallback, useEffect } from 'react';
import type { Contact, TimelineEvent } from '../clients/cag';
import { marcusWebbSimFlow } from '../clients/cag';

const SIM_CONTACT_BASE = {
  id: 'marcus-webb',
  name: 'Marcus Webb',
  channel: 'SMS' as const,
  status: 'new' as const,
  preview: 'New inquiry — processing...',
  timeline: [] as TimelineEvent[],
};

export interface SimState {
  running: boolean;
  simContact: Contact | null;
  thinking: boolean;
}

export function useSimulation() {
  const [state, setState] = useState<SimState>({
    running: false,
    simContact: null,
    thinking: false,
  });

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const start = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const startTime = new Date().toISOString();

    setState({
      running: true,
      simContact: { ...SIM_CONTACT_BASE, timestamp: startTime },
      thinking: false,
    });

    marcusWebbSimFlow.forEach((step, i) => {
      const isLastStep = i === marcusWebbSimFlow.length - 1;

      const t = setTimeout(() => {
        setState((prev) => {
          if (!prev.simContact) return prev;

          let simContact = prev.simContact;
          const now = new Date().toISOString();

          if (step.event) {
            const event: TimelineEvent = {
              id: step.event.id,
              timestamp: now,
              actor: step.event.actor,
              type: step.event.type,
              message: step.event.message,
            };
            simContact = {
              ...simContact,
              timestamp: now,
              timeline: [...simContact.timeline, event],
            };
          }

          if (step.statusUpdate) {
            simContact = { ...simContact, status: step.statusUpdate };
          }

          if (step.previewUpdate) {
            simContact = { ...simContact, preview: step.previewUpdate };
          }

          return {
            running: !isLastStep,
            simContact,
            thinking: step.thinking !== undefined ? step.thinking : prev.thinking,
          };
        });
      }, step.delayMs);

      timeoutsRef.current.push(t);
    });
  }, []);

  return { state, start };
}
