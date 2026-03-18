import type { AgentLog, AgentStatus, DashboardSummary, Task } from './index';

export interface AgentStatusPayload {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: string;
}

export interface ServerToClientEvents {
  'agent:status': (payload: AgentStatusPayload) => void;
  'task:update': (payload: Task) => void;
  'log:new': (payload: AgentLog) => void;
  'dashboard:summary': (payload: DashboardSummary) => void;
}

export interface ClientToServerEvents {
  'agent:subscribe': (payload: { agentId: string }) => void;
  'agent:unsubscribe': (payload: { agentId: string }) => void;
}

export interface InterServerEvents {}
export interface SocketData {}
