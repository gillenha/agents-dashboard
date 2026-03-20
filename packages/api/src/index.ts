import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { AgentStatus } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import { createRepositories } from './repositories';
import { agentApiRouter }  from './routes/v1/agentApi';
import { agentRouter }     from './routes/v1/agents';
import { taskRouter }      from './routes/v1/tasks';
import { dashboardRouter } from './routes/v1/dashboard';
import { startSimulation } from './simulation';
import { pool } from './db/pool';

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT ?? 3001;

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// Composition root — picks postgres or in-memory based on USE_DB env var
const { agentRepo, taskRepo, logRepo } = createRepositories();
agentRepo.setIO(io);
taskRepo.setIO(io);
logRepo.setIO(io);

// Mount routes — agent API before CRUD router so /register and /heartbeat match first
app.use('/api/v1/agents',    agentApiRouter(agentRepo, taskRepo));
app.use('/api/v1/agents',    agentRouter(agentRepo, taskRepo, logRepo));
app.use('/api/v1/tasks',     taskRouter(taskRepo));
app.use('/api/v1/dashboard', dashboardRouter(agentRepo, taskRepo));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Serve dashboard static files in production
if (process.env.NODE_ENV === 'production') {
  const dashboardDist = path.join(__dirname, '../../dashboard/dist');
  app.use(express.static(dashboardDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dashboardDist, 'index.html'));
  });
}

// Global Express error handler — must be last middleware, catches next(err) from route handlers
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[express] Unhandled route error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[ws] Client connected: ${socket.id}`);

  socket.on('agent:subscribe',   ({ agentId }) => socket.join(`agent:${agentId}`));
  socket.on('agent:unsubscribe', ({ agentId }) => socket.leave(`agent:${agentId}`));
  socket.on('disconnect', () => console.log(`[ws] Client disconnected: ${socket.id}`));
});

// Broadcast dashboard summary every 5 seconds
async function broadcastSummary() {
  try {
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
    const errorRate     = allLast24h.length > 0 ? failedLast24h / allLast24h.length : 0;

    io.emit('dashboard:summary', {
      totalAgents: agents.length,
      agentsByStatus,
      tasksCompletedLast24h: completedLast24h.length,
      errorRate: Math.round(errorRate * 1000) / 1000,
      totalTasksLast24h: allLast24h.length,
    });
  } catch (err) {
    console.error('[broadcastSummary] Error:', err);
  }
}

setInterval(() => { broadcastSummary(); }, 5000);

// Heartbeat monitor — runs every 30s, marks agents offline if last_heartbeat > 90s ago
async function checkHeartbeats() {
  try {
    const staleThreshold = new Date(Date.now() - 90 * 1000);
    const staleAgents = await agentRepo.findStale(staleThreshold);
    for (const agent of staleAgents) {
      await agentRepo.update(agent.id, { status: 'offline' });
      console.log(`[heartbeat] Agent ${agent.id} (${agent.name}) marked offline`);
    }
  } catch (err) {
    console.error('[checkHeartbeats] Error:', err);
  }
}

setInterval(() => { checkHeartbeats(); }, 30_000);

server.listen(PORT, async () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    startSimulation(agentRepo, taskRepo, logRepo);
  }

  // Startup diagnostic — logs DB user, tables, and permissions to help diagnose Cloud Run issues
  if (process.env.USE_DB !== 'memory') {
    try {
      const result = await pool.query('SELECT current_user, current_database()');
      console.log('[db] Connected as:', result.rows[0]);
      const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
      console.log('[db] Tables:', tables.rows.map(r => r.tablename));
      const perms = await pool.query("SELECT has_table_privilege(current_user, 'agents', 'SELECT') as can_select");
      console.log('[db] Can SELECT agents:', perms.rows[0].can_select);
    } catch (err) {
      console.error('[db] Startup diagnostic FAILED:', err);
    }
  }
});
