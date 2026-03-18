import type { Pool, QueryResult } from 'pg';
import type { Server } from 'socket.io';
import type { Agent, AgentStatus, CreateAgentInput, UpdateAgentInput } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import type { IAgentRepository } from '../interfaces';
import { pool as defaultPool } from '../../db/pool';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): Agent {
  return {
    id:            row.id as string,
    name:          row.name as string,
    status:        row.status as AgentStatus,
    type:          row.type as string,
    lastHeartbeat: (row.last_heartbeat as Date).toISOString(),
    config:        row.config as Record<string, unknown>,
    createdAt:     (row.created_at as Date).toISOString(),
    updatedAt:     (row.updated_at as Date).toISOString(),
  };
}

export class PostgresAgentRepository implements IAgentRepository {
  private io: IO | null = null;
  private pool: Pool;

  constructor(p: Pool = defaultPool) {
    this.pool = p;
  }

  setIO(io: IO): void {
    this.io = io;
  }

  async findAll(): Promise<Agent[]> {
    const result: QueryResult = await this.pool.query(
      'SELECT * FROM agents ORDER BY created_at DESC'
    );
    return result.rows.map(mapRow);
  }

  async findById(id: string): Promise<Agent | null> {
    const result: QueryResult = await this.pool.query(
      'SELECT * FROM agents WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<Agent | null> {
    const result: QueryResult = await this.pool.query(
      'SELECT * FROM agents WHERE name = $1 LIMIT 1',
      [name]
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  }

  async findStale(olderThan: Date): Promise<Agent[]> {
    const result: QueryResult = await this.pool.query(
      `SELECT * FROM agents WHERE status != 'offline' AND last_heartbeat < $1`,
      [olderThan.toISOString()]
    );
    return result.rows.map(mapRow);
  }

  async create(input: CreateAgentInput): Promise<Agent> {
    const result: QueryResult = await this.pool.query(
      `INSERT INTO agents (name, type, config)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.name, input.type, JSON.stringify(input.config ?? {})]
    );
    const agent = mapRow(result.rows[0]);
    this.io?.emit('agent:status', {
      agentId: agent.id,
      status:  agent.status,
      lastHeartbeat: agent.lastHeartbeat,
    });
    return agent;
  }

  async update(id: string, input: UpdateAgentInput): Promise<Agent | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.name          !== undefined) { fields.push(`name = $${idx++}`);           values.push(input.name); }
    if (input.status        !== undefined) { fields.push(`status = $${idx++}`);         values.push(input.status); }
    if (input.type          !== undefined) { fields.push(`type = $${idx++}`);           values.push(input.type); }
    if (input.config        !== undefined) { fields.push(`config = $${idx++}`);         values.push(JSON.stringify(input.config)); }
    if (input.lastHeartbeat !== undefined) { fields.push(`last_heartbeat = $${idx++}`); values.push(input.lastHeartbeat); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result: QueryResult = await this.pool.query(
      `UPDATE agents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return null;

    const agent = mapRow(result.rows[0]);
    if (this.io && input.status !== undefined) {
      this.io.emit('agent:status', {
        agentId: agent.id,
        status:  agent.status,
        lastHeartbeat: agent.lastHeartbeat,
      });
    }
    return agent;
  }

  async delete(id: string): Promise<boolean> {
    const result: QueryResult = await this.pool.query(
      'DELETE FROM agents WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
