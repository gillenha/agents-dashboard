import { Router } from 'express';
import type { ITaskRepository } from '../../repositories/interfaces';

export function taskRouter(taskRepo: ITaskRepository): Router {
  const router = Router();

  // GET /tasks/:taskId
  router.get('/:taskId', async (req, res) => {
    const task = await taskRepo.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  // GET /tasks
  router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));

    const result = await taskRepo.findAll({ page, limit });
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
