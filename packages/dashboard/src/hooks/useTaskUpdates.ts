import { useEffect, useState } from 'react';
import type { Task } from '@devpigh/shared';
import { useSocket } from '@/contexts/SocketContext';

/**
 * Subscribes to task:update events.
 * Returns a map of taskId → latest Task.
 * If agentId is provided, only tasks belonging to that agent are tracked.
 */
export function useTaskUpdates(agentId?: string): Map<string, Task> {
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const handler = (task: Task) => {
      if (agentId && task.agentId !== agentId) return;
      setTasks((prev) => new Map(prev).set(task.id, task));
    };

    socket.on('task:update', handler);
    return () => { socket.off('task:update', handler); };
  }, [socket, agentId]);

  return tasks;
}
