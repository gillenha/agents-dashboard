import type {
  Agent,
  AgentLog,
  CreateAgentInput,
  CreateTaskInput,
  LogLevel,
  Task,
  UpdateAgentInput,
} from '@devpigh/shared';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
}

export interface IAgentRepository {
  findAll(): Promise<Agent[]>;
  findById(id: string): Promise<Agent | null>;
  create(input: CreateAgentInput): Promise<Agent>;
  update(id: string, input: UpdateAgentInput): Promise<Agent | null>;
  delete(id: string): Promise<boolean>;
}

export interface ITaskRepository {
  findByAgentId(agentId: string, opts: PaginationOptions): Promise<PagedResult<Task>>;
  findAll(opts: PaginationOptions): Promise<PagedResult<Task>>;
  findById(id: string): Promise<Task | null>;
  create(agentId: string, input: CreateTaskInput): Promise<Task>;
  update(id: string, patch: Partial<Task>): Promise<Task | null>;
  findCompletedSince(since: Date): Promise<Task[]>;
  findSince(since: Date): Promise<Task[]>;
}

export interface ILogRepository {
  findByAgentId(
    agentId: string,
    opts: PaginationOptions & { level?: LogLevel }
  ): Promise<PagedResult<AgentLog>>;
  create(
    agentId: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<AgentLog>;
}
