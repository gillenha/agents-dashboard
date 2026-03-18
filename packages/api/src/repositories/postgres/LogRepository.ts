import type { Pool, QueryResult } from 'pg';
import type { Server } from 'socket.io';
import type { AgentLog, LogLevel } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import type { ILogRepository, PagedResult, PaginationOptions } from '../interfaces';
import { pool as defaultPool } from '../../db/pool';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): AgentLog {
  return {
    id:        row.id as string,
    agentId:   row.agent_id as string,
    level:     row.level as LogLevel,
    message:   row.message as string,
    timestamp: (row.timestamp as Date).toISOString(),
    metadata:  row.metadata as Record<string, unknown>,
  };
}

export class PostgresLogRepository implements ILogRepository {
  private io: IO | null = null;
  private pool: Pool;

  constructor(p: Pool = defaultPool) {
    this.pool = p;
  }

  setIO(io: IO): void {
    this.io = io;
  }

  async findByAgentId(
    agentId: string,
    opts: PaginationOptions & { level?: LogLevel }
  ): Promise<PagedResult<AgentLog>> {
    const offset = (opts.page - 1) * opts.limit;

    let dataQuery: string;
    let countQuery: string;
    let params: unknown[];

    if (opts.level) {
      dataQuery  = 'SELECT * FROM agent_logs WHERE agent_id = $1 AND level = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4';
      countQuery = 'SELECT COUNT(*)::int AS total FROM agent_logs WHERE agent_id = $1 AND level = $2';
      params = [agentId, opts.level, opts.limit, offset];
    } else {
      dataQuery  = 'SELECT * FROM agent_logs WHERE agent_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3';
      countQuery = 'SELECT COUNT(*)::int AS total FROM agent_logs WHERE agent_id = $1';
      params = [agentId, opts.limit, offset];
    }

    const [dataResult, countResult]: [QueryResult, QueryResult] = await Promise.all([
      this.pool.query(dataQuery, params),
      this.pool.query(countQuery, opts.level ? [agentId, opts.level] : [agentId]),
    ]);

    return { data: dataResult.rows.map(mapRow), total: countResult.rows[0].total };
  }

  async create(
    agentId: string,
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {}
  ): Promise<AgentLog> {
    const result: QueryResult = await this.pool.query(
      `INSERT INTO agent_logs (agent_id, level, message, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [agentId, level, message, JSON.stringify(metadata)]
    );
    const log = mapRow(result.rows[0]);
    this.io?.emit('log:new', log);
    return log;
  }
}
