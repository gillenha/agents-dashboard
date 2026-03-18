import { useEffect, useState } from 'react';
import type { AgentStatus } from '@devpigh/shared';
import { useSocket } from '@/contexts/SocketContext';

export interface AgentStatusUpdate {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: string;
}

/**
 * Subscribes to agent:status events.
 * Returns a map of agentId → latest status update.
 * If agentId is provided, subscribes to that agent's room on the server.
 */
export function useAgentUpdates(agentId?: string): Map<string, AgentStatusUpdate> {
  const { socket } = useSocket();
  const [updates, setUpdates] = useState<Map<string, AgentStatusUpdate>>(new Map());

  useEffect(() => {
    if (!socket) return;

    if (agentId) {
      socket.emit('agent:subscribe', { agentId });
    }

    const handler = (payload: AgentStatusUpdate) => {
      if (agentId && payload.agentId !== agentId) return;
      setUpdates((prev) => new Map(prev).set(payload.agentId, payload));
    };

    socket.on('agent:status', handler);

    return () => {
      socket.off('agent:status', handler);
      if (agentId) {
        socket.emit('agent:unsubscribe', { agentId });
      }
    };
  }, [socket, agentId]);

  return updates;
}
