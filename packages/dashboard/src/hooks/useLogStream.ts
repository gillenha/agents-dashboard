import { useEffect, useState } from 'react';
import type { AgentLog } from '@devpigh/shared';
import { useSocket } from '@/contexts/SocketContext';

const MAX_BUFFER = 100;

/**
 * Subscribes to log:new events.
 * Returns a buffer of recent logs (newest first, max 100).
 * If agentId is provided, only logs for that agent are included.
 */
export function useLogStream(agentId?: string): AgentLog[] {
  const { socket } = useSocket();
  const [logs, setLogs] = useState<AgentLog[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handler = (log: AgentLog) => {
      if (agentId && log.agentId !== agentId) return;
      setLogs((prev) => [log, ...prev].slice(0, MAX_BUFFER));
    };

    socket.on('log:new', handler);
    return () => { socket.off('log:new', handler); };
  }, [socket, agentId]);

  return logs;
}
