import type { Server } from 'socket.io';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import type { IAgentRepository, ILogRepository, ITaskRepository } from './interfaces';

import { InMemoryAgentRepository } from './in-memory/AgentRepository';
import { InMemoryTaskRepository } from './in-memory/TaskRepository';
import { InMemoryLogRepository }  from './in-memory/LogRepository';

import { PostgresAgentRepository } from './postgres/AgentRepository';
import { PostgresTaskRepository }  from './postgres/TaskRepository';
import { PostgresLogRepository }   from './postgres/LogRepository';

import { seedStore } from '../seed';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface RepositoryBundle {
  agentRepo: IAgentRepository & { setIO(io: IO): void };
  taskRepo:  ITaskRepository  & { setIO(io: IO): void };
  logRepo:   ILogRepository   & { setIO(io: IO): void };
}

export function createRepositories(): RepositoryBundle {
  const useDb = process.env.USE_DB ?? 'postgres';

  if (useDb === 'memory') {
    const agentRepo = new InMemoryAgentRepository();
    const taskRepo  = new InMemoryTaskRepository();
    const logRepo   = new InMemoryLogRepository();
    seedStore(agentRepo, taskRepo, logRepo);
    console.log('[repos] Using in-memory store (seeded)');
    return { agentRepo, taskRepo, logRepo };
  }

  console.log('[repos] Using postgres store');
  return {
    agentRepo: new PostgresAgentRepository(),
    taskRepo:  new PostgresTaskRepository(),
    logRepo:   new PostgresLogRepository(),
  };
}
