import type {
  Agent,
  AgentLog,
  DashboardSummary,
  LogLevel,
  PaginatedResponse,
  Task,
  CreateAgentInput,
  UpdateAgentInput,
  CreateTaskInput,
} from '@devpigh/shared';

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  agents: {
    list: () => request<Agent[]>('/agents'),
    get: (id: string) => request<Agent>(`/agents/${id}`),
    create: (body: CreateAgentInput) =>
      request<Agent>('/agents', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: UpdateAgentInput) =>
      request<Agent>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/agents/${id}`, { method: 'DELETE' }),
    tasks: (id: string, page = 1, limit = 20) =>
      request<PaginatedResponse<Task>>(`/agents/${id}/tasks?page=${page}&limit=${limit}`),
    logs: (id: string, page = 1, limit = 50, level?: LogLevel) =>
      request<PaginatedResponse<AgentLog>>(
        `/agents/${id}/logs?page=${page}&limit=${limit}${level ? `&level=${level}` : ''}`
      ),
    createTask: (id: string, body: CreateTaskInput) =>
      request<Task>(`/agents/${id}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  },
  tasks: {
    list: (page = 1, limit = 20) =>
      request<PaginatedResponse<Task>>(`/tasks?page=${page}&limit=${limit}`),
  },
  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
  },
};
