import { Router } from 'express';
import type { AgentStatus } from '@devpigh/shared';
import type { IAgentRepository, ITaskRepository } from '../../repositories/interfaces';

export function dashboardRouter(
  agentRepo: IAgentRepository,
  taskRepo: ITaskRepository
): Router {
  const router = Router();

  // GET /dashboard/summary
  router.get('/summary', async (_req, res) => {
    const [agents, completedLast24h, allLast24h] = await Promise.all([
      agentRepo.findAll(),
      taskRepo.findCompletedSince(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      taskRepo.findSince(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ]);

    const agentsByStatus: Record<AgentStatus, number> = {
      idle: 0,
      running: 0,
      error: 0,
      offline: 0,
    };
    for (const agent of agents) {
      agentsByStatus[agent.status]++;
    }

    const failedLast24h = allLast24h.filter((t) => t.status === 'failed').length;
    const errorRate =
      allLast24h.length > 0 ? failedLast24h / allLast24h.length : 0;

    res.json({
      totalAgents: agents.length,
      agentsByStatus,
      tasksCompletedLast24h: completedLast24h.length,
      errorRate: Math.round(errorRate * 1000) / 1000,
      totalTasksLast24h: allLast24h.length,
    });
  });

  return router;
}
