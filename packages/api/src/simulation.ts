import type { AgentStatus, LogLevel } from '@devpigh/shared';
import type { IAgentRepository, ILogRepository, ITaskRepository } from './repositories/interfaces';

const LOG_MESSAGES: Record<AgentStatus, { level: LogLevel; messages: string[] }[]> = {
  running: [
    { level: 'info', messages: ['Processing batch', 'Heartbeat OK', 'Task progressing normally', 'Checkpoint saved'] },
    { level: 'warn', messages: ['High memory usage detected', 'Slow response from upstream', 'Retry attempt 1/3'] },
  ],
  idle: [
    { level: 'info', messages: ['Waiting for next task', 'Agent idle', 'Polling for work'] },
  ],
  error: [
    { level: 'error', messages: ['Unhandled exception caught', 'Connection refused', 'Task execution failed'] },
    { level: 'warn',  messages: ['Attempting recovery', 'Backing off before retry'] },
  ],
  offline: [
    { level: 'warn', messages: ['Heartbeat missed', 'Agent unreachable'] },
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function startSimulation(
  agentRepo: IAgentRepository,
  taskRepo:  ITaskRepository,
  logRepo:   ILogRepository
): void {
  async function tick() {
    const agents = await agentRepo.findAll();
    if (agents.length === 0) return;

    const action = randomInt(0, 2);

    if (action === 0) {
      const candidates = agents.filter((a) => a.status === 'running' || a.status === 'idle');
      if (candidates.length > 0) {
        const agent = pick(candidates);
        const newStatus: AgentStatus = agent.status === 'running' ? 'idle' : 'running';
        await agentRepo.update(agent.id, {
          status: newStatus,
          lastHeartbeat: new Date().toISOString(),
        });
      }
    } else if (action === 1) {
      const allTasks = await taskRepo.findAll({ page: 1, limit: 100 });
      const queued  = allTasks.data.filter((t) => t.status === 'queued');
      const running = allTasks.data.filter((t) => t.status === 'running');

      if (queued.length > 0) {
        const task = pick(queued);
        await taskRepo.update(task.id, {
          status:    'running',
          startedAt: new Date().toISOString(),
        });
      } else if (running.length > 0) {
        const task    = pick(running);
        const succeed = Math.random() > 0.2;
        await taskRepo.update(task.id, {
          status:      succeed ? 'completed' : 'failed',
          completedAt: new Date().toISOString(),
          output:      succeed ? { rowsProcessed: randomInt(100, 5000) } : null,
          error:       succeed ? null : 'Simulation: task failed unexpectedly',
        });
      }
    } else {
      const active = agents.filter((a) => a.status !== 'offline');
      if (active.length > 0) {
        const agent   = pick(active);
        const options = LOG_MESSAGES[agent.status];
        const group   = pick(options);
        const message = pick(group.messages);
        await logRepo.create(agent.id, group.level, message, { simulated: true });
      }
    }
  }

  function schedule() {
    const delay = randomInt(3000, 8000);
    setTimeout(async () => {
      try { await tick(); } catch { /* swallow simulation errors */ }
      schedule();
    }, delay);
  }

  schedule();
  console.log('[simulation] Started');
}
