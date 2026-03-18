import { v4 as uuidv4 } from 'uuid';
import type { AgentLog, LogLevel } from '@devpigh/shared';
import type { ILogRepository, PagedResult, PaginationOptions } from '../interfaces';

export class InMemoryLogRepository implements ILogRepository {
  private logs: Map<string, AgentLog> = new Map();

  async findByAgentId(
    agentId: string,
    opts: PaginationOptions & { level?: LogLevel }
  ): Promise<PagedResult<AgentLog>> {
    let all = Array.from(this.logs.values())
      .filter((l) => l.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (opts.level) {
      all = all.filter((l) => l.level === opts.level);
    }

    const start = (opts.page - 1) * opts.limit;
    return {
      data: all.slice(start, start + opts.limit),
      total: all.length,
    };
  }

  async create(
    agentId: string,
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {}
  ): Promise<AgentLog> {
    const log: AgentLog = {
      id: uuidv4(),
      agentId,
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.logs.set(log.id, log);
    return log;
  }

  _seed(log: AgentLog): void {
    this.logs.set(log.id, log);
  }
}
