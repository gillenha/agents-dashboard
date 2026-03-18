export type AgentStatus = 'idle' | 'running' | 'error' | 'offline';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';
export type LogLevel = 'info' | 'warn' | 'error';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  type: string;
  lastHeartbeat: string; // ISO timestamp
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  agentId: string;
  status: TaskStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  agentId: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalAgents: number;
  agentsByStatus: Record<AgentStatus, number>;
  tasksCompletedLast24h: number;
  errorRate: number;
  totalTasksLast24h: number;
}

export interface CreateAgentInput {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface UpdateAgentInput {
  name?: string;
  status?: AgentStatus;
  type?: string;
  config?: Record<string, unknown>;
  lastHeartbeat?: string;
}

export interface CreateTaskInput {
  input: Record<string, unknown>;
}

// ── Agent-facing API request/response types ───────────────────────────────────

export interface AgentRegisterRequest {
  name: string;
  type: string;
  metadata?: Record<string, unknown>;
}
export type AgentRegisterResponse = Agent;

export interface HeartbeatRequest {
  /** 'busy' maps to the internal 'running' status */
  status?: 'idle' | 'busy';
}
export type HeartbeatResponse = Agent;

export type TaskPollResponse = Task | null;

export interface TaskResultRequest {
  status: 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
}
export type TaskResultResponse = Task;

export type {
  AgentStatusPayload,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './events';
