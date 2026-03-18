import type { Pool, QueryResult } from 'pg';
import type { Server } from 'socket.io';
import type { CreateTaskInput, Task, TaskStatus } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import type { ITaskRepository, PagedResult, PaginationOptions } from '../interfaces';
import { pool as defaultPool } from '../../db/pool';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): Task {
  return {
    id:          row.id as string,
    agentId:     row.agent_id as string,
    status:      row.status as TaskStatus,
    input:       row.input as Record<string, unknown>,
    output:      row.output as Record<string, unknown> | null,
    startedAt:   row.started_at   ? (row.started_at   as Date).toISOString() : null,
    completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
    error:       row.error as string | null,
    createdAt:   (row.created_at as Date).toISOString(),
  };
}

export class PostgresTaskRepository implements ITaskRepository {
  private io: IO | null = null;
  private pool: Pool;

  constructor(p: Pool = defaultPool) {
    this.pool = p;
  }

  setIO(io: IO): void {
    this.io = io;
  }

  async findByAgentId(agentId: string, opts: PaginationOptions): Promise<PagedResult<Task>> {
    const offset = (opts.page - 1) * opts.limit;
    const [dataResult, countResult]: [QueryResult, QueryResult] = await Promise.all([
      this.pool.query(
        'SELECT * FROM tasks WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [agentId, opts.limit, offset]
      ),
      this.pool.query(
        'SELECT COUNT(*)::int AS total FROM tasks WHERE agent_id = $1',
        [agentId]
      ),
    ]);
    return { data: dataResult.rows.map(mapRow), total: countResult.rows[0].total };
  }

  async findAll(opts: PaginationOptions): Promise<PagedResult<Task>> {
    const offset = (opts.page - 1) * opts.limit;
    const [dataResult, countResult]: [QueryResult, QueryResult] = await Promise.all([
      this.pool.query(
        'SELECT * FROM tasks ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [opts.limit, offset]
      ),
      this.pool.query('SELECT COUNT(*)::int AS total FROM tasks'),
    ]);
    return { data: dataResult.rows.map(mapRow), total: countResult.rows[0].total };
  }

  async findById(id: string): Promise<Task | null> {
    const result: QueryResult = await this.pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  }

  async create(agentId: string, input: CreateTaskInput): Promise<Task> {
    const result: QueryResult = await this.pool.query(
      `INSERT INTO tasks (agent_id, status, input)
       VALUES ($1, 'queued', $2)
       RETURNING *`,
      [agentId, JSON.stringify(input.input)]
    );
    const task = mapRow(result.rows[0]);
    this.io?.emit('task:update', task);
    return task;
  }

  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if ('status'      in patch) { fields.push(`status = $${idx++}`);       values.push(patch.status); }
    if ('startedAt'   in patch) { fields.push(`started_at = $${idx++}`);   values.push(patch.startedAt ?? null); }
    if ('completedAt' in patch) { fields.push(`completed_at = $${idx++}`); values.push(patch.completedAt ?? null); }
    if ('output'      in patch) { fields.push(`output = $${idx++}`);       values.push(patch.output !== null && patch.output !== undefined ? JSON.stringify(patch.output) : null); }
    if ('error'       in patch) { fields.push(`error = $${idx++}`);        values.push(patch.error ?? null); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result: QueryResult = await this.pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return null;

    const task = mapRow(result.rows[0]);
    this.io?.emit('task:update', task);
    return task;
  }

  async findCompletedSince(since: Date): Promise<Task[]> {
    const result: QueryResult = await this.pool.query(
      `SELECT * FROM tasks WHERE status = 'completed' AND completed_at >= $1`,
      [since.toISOString()]
    );
    return result.rows.map(mapRow);
  }

  async findSince(since: Date): Promise<Task[]> {
    const result: QueryResult = await this.pool.query(
      'SELECT * FROM tasks WHERE created_at >= $1',
      [since.toISOString()]
    );
    return result.rows.map(mapRow);
  }
}
