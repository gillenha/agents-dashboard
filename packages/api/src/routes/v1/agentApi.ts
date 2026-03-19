import { Router } from 'express';
import type { IAgentRepository, ITaskRepository } from '../../repositories/interfaces';
import type { AgentRegisterRequest, HeartbeatRequest, TaskResultRequest } from '@devpigh/shared';

export function agentApiRouter(
  agentRepo: IAgentRepository,
  taskRepo: ITaskRepository
): Router {
  const router = Router();

  // ── POST /register ──────────────────────────────────────────────────────────
  // Agents call this on startup. Upserts by name: creates if new, refreshes if existing.
  router.post('/register', async (req, res) => {
    const { name, type, metadata } = req.body as AgentRegisterRequest;
    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    const existing = await agentRepo.findByName(name);
    if (existing) {
      const updated = await agentRepo.update(existing.id, {
        status: 'idle',
        lastHeartbeat: new Date().toISOString(),
      });
      return res.json(updated);
    }
    const agent = await agentRepo.create({ name, type, status: 'idle', config: metadata });
    res.status(201).json(agent);
  });

  // ── POST /:id/heartbeat ──────────────────────────────────────────────────────
  // Agents call this periodically to stay alive and optionally report status.
  router.post('/:id/heartbeat', async (req, res) => {
    const agent = await agentRepo.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { status } = req.body as HeartbeatRequest;
    // Map 'busy' → 'running' to align with internal AgentStatus
    const internalStatus = status === 'busy' ? 'running' : (status ?? 'idle');

    const updated = await agentRepo.update(agent.id, {
      status: internalStatus,
      lastHeartbeat: new Date().toISOString(),
    });
    res.json(updated);
  });

  // ── POST /:id/tasks/poll ─────────────────────────────────────────────────────
  // Atomically dequeues the oldest queued task for this agent and marks it running.
  router.post('/:id/tasks/poll', async (req, res) => {
    const agent = await agentRepo.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const task = await taskRepo.pollNext(agent.id);
    if (!task) return res.status(204).send();
    res.json(task);
  });

  // ── POST /:id/tasks/:taskId/result ──────────────────────────────────────────
  // Agent reports the outcome of a task. Sets agent back to idle.
  router.post('/:id/tasks/:taskId/result', async (req, res) => {
    const [agent, task] = await Promise.all([
      agentRepo.findById(req.params.id),
      taskRepo.findById(req.params.taskId),
    ]);

    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (!task)  return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'running') {
      return res.status(400).json({ error: `Task is not running (current status: ${task.status})` });
    }

    const { status, result, error } = req.body as TaskResultRequest;
    if (status !== 'completed' && status !== 'failed') {
      return res.status(400).json({ error: 'status must be "completed" or "failed"' });
    }

    const now = new Date().toISOString();
    const [updatedTask] = await Promise.all([
      taskRepo.update(task.id, {
        status,
        completedAt: now,
        output: result ?? null,
        error: error ?? null,
      }),
      agentRepo.update(agent.id, { status: 'idle' }),
    ]);

    res.json(updatedTask);
  });

  return router;
}
