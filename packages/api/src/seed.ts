import { v4 as uuidv4 } from 'uuid';
import type { Agent, AgentLog, Task } from '@devpigh/shared';
import type { InMemoryAgentRepository } from './repositories/in-memory/AgentRepository';
import type { InMemoryLogRepository } from './repositories/in-memory/LogRepository';
import type { InMemoryTaskRepository } from './repositories/in-memory/TaskRepository';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function minutesAgo(n: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
}

export function seedStore(
  agentRepo: InMemoryAgentRepository,
  taskRepo: InMemoryTaskRepository,
  logRepo: InMemoryLogRepository
): void {
  const agents: Agent[] = [
    {
      id: 'agent-001',
      name: 'Data Ingestion Agent',
      status: 'running',
      type: 'ingestion',
      lastHeartbeat: minutesAgo(1),
      config: { source: 's3://data-bucket', batchSize: 100, schedule: '*/5 * * * *' },
      createdAt: daysAgo(14),
      updatedAt: minutesAgo(1),
    },
    {
      id: 'agent-002',
      name: 'Report Generator',
      status: 'idle',
      type: 'reporting',
      lastHeartbeat: minutesAgo(8),
      config: { outputFormat: 'pdf', recipients: ['team@example.com'], timezone: 'UTC' },
      createdAt: daysAgo(10),
      updatedAt: minutesAgo(8),
    },
    {
      id: 'agent-003',
      name: 'Anomaly Detector',
      status: 'error',
      type: 'monitoring',
      lastHeartbeat: hoursAgo(2),
      config: { threshold: 0.95, windowSize: 60, alertChannel: 'slack' },
      createdAt: daysAgo(7),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'agent-004',
      name: 'Model Trainer',
      status: 'running',
      type: 'ml',
      lastHeartbeat: minutesAgo(3),
      config: { modelType: 'xgboost', epochs: 100, learningRate: 0.01, gpuEnabled: true },
      createdAt: daysAgo(5),
      updatedAt: minutesAgo(3),
    },
    {
      id: 'agent-005',
      name: 'Legacy Sync Agent',
      status: 'offline',
      type: 'sync',
      lastHeartbeat: daysAgo(2),
      config: { target: 'postgres://legacy-db', syncInterval: 3600 },
      createdAt: daysAgo(30),
      updatedAt: daysAgo(2),
    },
  ];

  agents.forEach((a) => agentRepo._seed(a));

  const tasks: Task[] = [
    // agent-001 tasks
    {
      id: uuidv4(), agentId: 'agent-001', status: 'completed',
      input: { batch: 1, source: 'partition-2024-01' },
      output: { rowsProcessed: 4820, duration: 12.4 },
      startedAt: hoursAgo(3), completedAt: hoursAgo(2),
      error: null, createdAt: hoursAgo(3),
    },
    {
      id: uuidv4(), agentId: 'agent-001', status: 'completed',
      input: { batch: 2, source: 'partition-2024-02' },
      output: { rowsProcessed: 5100, duration: 13.1 },
      startedAt: hoursAgo(2), completedAt: hoursAgo(1),
      error: null, createdAt: hoursAgo(2),
    },
    {
      id: uuidv4(), agentId: 'agent-001', status: 'running',
      input: { batch: 3, source: 'partition-2024-03' },
      output: null, startedAt: minutesAgo(15), completedAt: null,
      error: null, createdAt: minutesAgo(15),
    },
    // agent-002 tasks
    {
      id: uuidv4(), agentId: 'agent-002', status: 'completed',
      input: { reportType: 'weekly', period: '2024-W10' },
      output: { pages: 12, fileSize: '2.4MB', url: '/reports/w10.pdf' },
      startedAt: hoursAgo(6), completedAt: hoursAgo(5),
      error: null, createdAt: hoursAgo(6),
    },
    {
      id: uuidv4(), agentId: 'agent-002', status: 'queued',
      input: { reportType: 'monthly', period: '2024-02' },
      output: null, startedAt: null, completedAt: null,
      error: null, createdAt: minutesAgo(5),
    },
    // agent-003 tasks
    {
      id: uuidv4(), agentId: 'agent-003', status: 'failed',
      input: { windowStart: hoursAgo(4), windowEnd: hoursAgo(3) },
      output: null, startedAt: hoursAgo(3), completedAt: hoursAgo(2),
      error: 'Connection timeout: could not reach metrics endpoint after 3 retries',
      createdAt: hoursAgo(3),
    },
    {
      id: uuidv4(), agentId: 'agent-003', status: 'failed',
      input: { windowStart: hoursAgo(5), windowEnd: hoursAgo(4) },
      output: null, startedAt: hoursAgo(4), completedAt: hoursAgo(3),
      error: 'Connection timeout: could not reach metrics endpoint after 3 retries',
      createdAt: hoursAgo(4),
    },
    {
      id: uuidv4(), agentId: 'agent-003', status: 'completed',
      input: { windowStart: hoursAgo(8), windowEnd: hoursAgo(7) },
      output: { anomaliesDetected: 3, severity: 'medium' },
      startedAt: hoursAgo(7), completedAt: hoursAgo(7),
      error: null, createdAt: hoursAgo(8),
    },
    // agent-004 tasks
    {
      id: uuidv4(), agentId: 'agent-004', status: 'running',
      input: { dataset: 'train-v3', hyperparams: { n_estimators: 300 } },
      output: null, startedAt: hoursAgo(1), completedAt: null,
      error: null, createdAt: hoursAgo(1),
    },
    {
      id: uuidv4(), agentId: 'agent-004', status: 'completed',
      input: { dataset: 'train-v2', hyperparams: { n_estimators: 200 } },
      output: { accuracy: 0.923, f1: 0.911, modelPath: '/models/xgb-v2.pkl' },
      startedAt: daysAgo(1), completedAt: hoursAgo(20),
      error: null, createdAt: daysAgo(1),
    },
    {
      id: uuidv4(), agentId: 'agent-004', status: 'completed',
      input: { dataset: 'train-v1', hyperparams: { n_estimators: 100 } },
      output: { accuracy: 0.891, f1: 0.876, modelPath: '/models/xgb-v1.pkl' },
      startedAt: daysAgo(2), completedAt: daysAgo(2),
      error: null, createdAt: daysAgo(2),
    },
    // agent-005 tasks
    {
      id: uuidv4(), agentId: 'agent-005', status: 'failed',
      input: { tables: ['users', 'orders', 'products'] },
      output: null, startedAt: daysAgo(2), completedAt: daysAgo(2),
      error: 'Agent went offline during execution',
      createdAt: daysAgo(2),
    },
    {
      id: uuidv4(), agentId: 'agent-001', status: 'completed',
      input: { batch: 0, source: 'partition-2024-00' },
      output: { rowsProcessed: 3900, duration: 10.8 },
      startedAt: hoursAgo(5), completedAt: hoursAgo(4),
      error: null, createdAt: hoursAgo(5),
    },
    {
      id: uuidv4(), agentId: 'agent-002', status: 'completed',
      input: { reportType: 'daily', period: '2024-03-10' },
      output: { pages: 4, fileSize: '0.8MB', url: '/reports/daily-0310.pdf' },
      startedAt: hoursAgo(10), completedAt: hoursAgo(10),
      error: null, createdAt: hoursAgo(10),
    },
    {
      id: uuidv4(), agentId: 'agent-004', status: 'queued',
      input: { dataset: 'train-v4', hyperparams: { n_estimators: 500 } },
      output: null, startedAt: null, completedAt: null,
      error: null, createdAt: minutesAgo(2),
    },
  ];

  tasks.forEach((t) => taskRepo._seed(t));

  const logs: AgentLog[] = [
    { id: uuidv4(), agentId: 'agent-001', level: 'info', message: 'Started batch processing for partition-2024-03', timestamp: minutesAgo(15), metadata: { batch: 3 } },
    { id: uuidv4(), agentId: 'agent-001', level: 'info', message: 'Connected to S3 source successfully', timestamp: minutesAgo(14), metadata: {} },
    { id: uuidv4(), agentId: 'agent-001', level: 'info', message: 'Processed 1000 rows', timestamp: minutesAgo(12), metadata: { progress: '25%' } },
    { id: uuidv4(), agentId: 'agent-001', level: 'warn', message: 'Slow read detected on partition chunk 7', timestamp: minutesAgo(10), metadata: { latencyMs: 3200 } },
    { id: uuidv4(), agentId: 'agent-001', level: 'info', message: 'Processed 2500 rows', timestamp: minutesAgo(8), metadata: { progress: '60%' } },

    { id: uuidv4(), agentId: 'agent-002', level: 'info', message: 'Agent idle, waiting for next scheduled task', timestamp: minutesAgo(8), metadata: {} },
    { id: uuidv4(), agentId: 'agent-002', level: 'info', message: 'Completed weekly report for W10', timestamp: hoursAgo(5), metadata: { reportId: 'w10' } },

    { id: uuidv4(), agentId: 'agent-003', level: 'error', message: 'Connection timeout: could not reach metrics endpoint after 3 retries', timestamp: hoursAgo(2), metadata: { endpoint: 'http://metrics:9090', retries: 3 } },
    { id: uuidv4(), agentId: 'agent-003', level: 'warn', message: 'Metrics endpoint response time elevated', timestamp: hoursAgo(2), metadata: { responseTimeMs: 8400 } },
    { id: uuidv4(), agentId: 'agent-003', level: 'error', message: 'Task failed, agent entering error state', timestamp: hoursAgo(2), metadata: { taskId: 'task-err' } },
    { id: uuidv4(), agentId: 'agent-003', level: 'info', message: 'Starting anomaly detection window', timestamp: hoursAgo(7), metadata: { window: '1h' } },

    { id: uuidv4(), agentId: 'agent-004', level: 'info', message: 'Training started: dataset=train-v3, estimators=300', timestamp: hoursAgo(1), metadata: { epoch: 0 } },
    { id: uuidv4(), agentId: 'agent-004', level: 'info', message: 'Epoch 10/100 — loss: 0.421', timestamp: minutesAgo(50), metadata: { epoch: 10, loss: 0.421 } },
    { id: uuidv4(), agentId: 'agent-004', level: 'info', message: 'Epoch 25/100 — loss: 0.312', timestamp: minutesAgo(35), metadata: { epoch: 25, loss: 0.312 } },
    { id: uuidv4(), agentId: 'agent-004', level: 'info', message: 'Epoch 50/100 — loss: 0.241', timestamp: minutesAgo(20), metadata: { epoch: 50, loss: 0.241 } },

    { id: uuidv4(), agentId: 'agent-005', level: 'error', message: 'Agent lost heartbeat, marking as offline', timestamp: daysAgo(2), metadata: {} },
    { id: uuidv4(), agentId: 'agent-005', level: 'warn', message: 'Sync task interrupted mid-execution', timestamp: daysAgo(2), metadata: { tablesCompleted: ['users'] } },
  ];

  logs.forEach((l) => logRepo._seed(l));
}
