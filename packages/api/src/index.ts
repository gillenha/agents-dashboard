import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { AgentStatus } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import { InMemoryAgentRepository } from './repositories/in-memory/AgentRepository';
import { InMemoryTaskRepository } from './repositories/in-memory/TaskRepository';
import { InMemoryLogRepository } from './repositories/in-memory/LogRepository';
import { agentRouter } from './routes/v1/agents';
import { taskRouter } from './routes/v1/tasks';
import { dashboardRouter } from './routes/v1/dashboard';
import { seedStore } from './seed';
import { startSimulation } from './simulation';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ?? 3001;

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// Instantiate repositories and wire up socket.io
const agentRepo = new InMemoryAgentRepository();
const taskRepo = new InMemoryTaskRepository();
const logRepo = new InMemoryLogRepository();

agentRepo.setIO(io);
taskRepo.setIO(io);
logRepo.setIO(io);

// Seed in-memory store
seedStore(agentRepo, taskRepo, logRepo);

// Mount routes
app.use('/api/v1/agents', agentRouter(agentRepo, taskRepo, logRepo));
app.use('/api/v1/tasks', taskRouter(taskRepo));
app.use('/api/v1/dashboard', dashboardRouter(agentRepo, taskRepo));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[ws] Client connected: ${socket.id}`);

  socket.on('agent:subscribe', ({ agentId }) => {
    socket.join(`agent:${agentId}`);
  });

  socket.on('agent:unsubscribe', ({ agentId }) => {
    socket.leave(`agent:${agentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[ws] Client disconnected: ${socket.id}`);
  });
});

// Broadcast dashboard summary every 5 seconds
async function broadcastSummary() {
  const [agents, completedLast24h, allLast24h] = await Promise.all([
    agentRepo.findAll(),
    taskRepo.findCompletedSince(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    taskRepo.findSince(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  ]);

  const agentsByStatus: Record<AgentStatus, number> = { idle: 0, running: 0, error: 0, offline: 0 };
  for (const agent of agents) {
    agentsByStatus[agent.status]++;
  }

  const failedLast24h = allLast24h.filter((t) => t.status === 'failed').length;
  const errorRate = allLast24h.length > 0 ? failedLast24h / allLast24h.length : 0;

  io.emit('dashboard:summary', {
    totalAgents: agents.length,
    agentsByStatus,
    tasksCompletedLast24h: completedLast24h.length,
    errorRate: Math.round(errorRate * 1000) / 1000,
    totalTasksLast24h: allLast24h.length,
  });
}

setInterval(() => { broadcastSummary().catch(console.error); }, 5000);

server.listen(PORT, () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
  startSimulation(agentRepo, taskRepo, logRepo);
});
