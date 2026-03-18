import { v4 as uuidv4 } from 'uuid';
import type { Server } from 'socket.io';
import type { CreateTaskInput, Task } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import type { ITaskRepository, PagedResult, PaginationOptions } from '../interfaces';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private io: IO | null = null;

  setIO(io: IO): void {
    this.io = io;
  }

  async findByAgentId(agentId: string, opts: PaginationOptions): Promise<PagedResult<Task>> {
    const all = Array.from(this.tasks.values())
      .filter((t) => t.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return this._paginate(all, opts);
  }

  async findAll(opts: PaginationOptions): Promise<PagedResult<Task>> {
    const all = Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return this._paginate(all, opts);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(agentId: string, input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: uuidv4(),
      agentId,
      status: 'queued',
      input: input.input,
      output: null,
      startedAt: null,
      completedAt: null,
      error: null,
      createdAt: now,
    };
    this.tasks.set(task.id, task);
    this.io?.emit('task:update', task);
    return task;
  }

  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated: Task = { ...existing, ...patch };
    this.tasks.set(id, updated);
    this.io?.emit('task:update', updated);
    return updated;
  }

  async pollNext(agentId: string): Promise<Task | null> {
    const queued = Array.from(this.tasks.values())
      .filter((t) => t.agentId === agentId && t.status === 'queued')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (queued.length === 0) return null;

    const updated: Task = { ...queued[0], status: 'running', startedAt: new Date().toISOString() };
    this.tasks.set(updated.id, updated);
    this.io?.emit('task:update', updated);
    return updated;
  }

  async findCompletedSince(since: Date): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= since
    );
  }

  async findSince(since: Date): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => new Date(t.createdAt) >= since
    );
  }

  private _paginate(items: Task[], opts: PaginationOptions): PagedResult<Task> {
    const start = (opts.page - 1) * opts.limit;
    return {
      data: items.slice(start, start + opts.limit),
      total: items.length,
    };
  }

  _seed(task: Task): void {
    this.tasks.set(task.id, task);
  }
}
