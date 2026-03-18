import { Router } from 'express';
import type { IAgentRepository, ILogRepository, ITaskRepository } from '../../repositories/interfaces';
import type { CreateAgentInput, LogLevel, UpdateAgentInput } from '@devpigh/shared';

export function agentRouter(
  agentRepo: IAgentRepository,
  taskRepo: ITaskRepository,
  logRepo: ILogRepository
): Router {
  const router = Router();

  // GET /agents
  router.get('/', async (_req, res) => {
    const agents = await agentRepo.findAll();
    res.json(agents);
  });

  // GET /agents/:id
  router.get('/:id', async (req, res) => {
    const agent = await agentRepo.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  });

  // POST /agents
  router.post('/', async (req, res) => {
    const body = req.body as CreateAgentInput;
    if (!body.name || !body.type) {
      return res.status(400).json({ error: 'name and type are required' });
    }
    const agent = await agentRepo.create(body);
    res.status(201).json(agent);
  });

  // PUT /agents/:id
  router.put('/:id', async (req, res) => {
    const body = req.body as UpdateAgentInput;
    const agent = await agentRepo.update(req.params.id, body);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  });

  // DELETE /agents/:id
  router.delete('/:id', async (req, res) => {
    const deleted = await agentRepo.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Agent not found' });
    res.status(204).send();
  });

  // GET /agents/:id/tasks
  router.get('/:id/tasks', async (req, res) => {
    const agent = await agentRepo.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));

    const result = await taskRepo.findByAgentId(req.params.id, { page, limit });
    res.json({
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });

  // POST /agents/:id/tasks
  router.post('/:id/tasks', async (req, res) => {
    const agent = await agentRepo.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const input = req.body?.input ?? req.body;
    const task = await taskRepo.create(req.params.id, { input });
    res.status(201).json(task);
  });

  // GET /agents/:id/logs
  router.get('/:id/logs', async (req, res) => {
    const agent = await agentRepo.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const level = req.query.level as LogLevel | undefined;

    const result = await logRepo.findByAgentId(req.params.id, { page, limit, level });
    res.json({
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });

  return router;
}
