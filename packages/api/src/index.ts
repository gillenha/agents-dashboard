import express from 'express';
import cors from 'cors';
import { InMemoryAgentRepository } from './repositories/in-memory/AgentRepository';
import { InMemoryTaskRepository } from './repositories/in-memory/TaskRepository';
import { InMemoryLogRepository } from './repositories/in-memory/LogRepository';
import { agentRouter } from './routes/v1/agents';
import { taskRouter } from './routes/v1/tasks';
import { dashboardRouter } from './routes/v1/dashboard';
import { seedStore } from './seed';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Instantiate repositories
const agentRepo = new InMemoryAgentRepository();
const taskRepo = new InMemoryTaskRepository();
const logRepo = new InMemoryLogRepository();

// Seed in-memory store
seedStore(agentRepo, taskRepo, logRepo);

// Mount routes
app.use('/api/v1/agents', agentRouter(agentRepo, taskRepo, logRepo));
app.use('/api/v1/tasks', taskRouter(taskRepo));
app.use('/api/v1/dashboard', dashboardRouter(agentRepo, taskRepo));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
});
