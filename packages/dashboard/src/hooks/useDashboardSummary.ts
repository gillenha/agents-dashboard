import { useEffect, useState } from 'react';
import type { DashboardSummary } from '@devpigh/shared';
import { api } from '@/api/client';
import { useSocket } from '@/contexts/SocketContext';

/**
 * Returns the latest dashboard summary.
 * Seeds from the REST endpoint on mount, then live-updates from WebSocket.
 */
export function useDashboardSummary(): { summary: DashboardSummary | null; loading: boolean; error: string | null } {
  const { socket } = useSocket();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial REST fetch
  useEffect(() => {
    api.dashboard.summary()
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  // Live updates via WebSocket
  useEffect(() => {
    if (!socket) return;
    socket.on('dashboard:summary', setSummary);
    return () => { socket.off('dashboard:summary', setSummary); };
  }, [socket]);

  return { summary, loading, error };
}
