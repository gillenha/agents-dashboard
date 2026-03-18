-- Clear existing data (idempotent re-seed)
TRUNCATE TABLE agent_logs, tasks, agents CASCADE;

-- ============================================================
-- Agents (fixed UUIDs so tasks can reference them)
-- ============================================================
INSERT INTO agents (id, name, status, type, last_heartbeat, config, created_at, updated_at) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Data Ingestion Agent', 'running', 'ingestion',
  NOW() - INTERVAL '1 minute',
  '{"source": "s3://data-bucket", "batchSize": 100, "schedule": "*/5 * * * *"}',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '1 minute'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Report Generator', 'idle', 'reporting',
  NOW() - INTERVAL '8 minutes',
  '{"outputFormat": "pdf", "recipients": ["team@example.com"], "timezone": "UTC"}',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 minutes'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Anomaly Detector', 'error', 'monitoring',
  NOW() - INTERVAL '2 hours',
  '{"threshold": 0.95, "windowSize": 60, "alertChannel": "slack"}',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '2 hours'
),
(
  '00000000-0000-0000-0000-000000000004',
  'Model Trainer', 'running', 'ml',
  NOW() - INTERVAL '3 minutes',
  '{"modelType": "xgboost", "epochs": 100, "learningRate": 0.01, "gpuEnabled": true}',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 minutes'
),
(
  '00000000-0000-0000-0000-000000000005',
  'Legacy Sync Agent', 'offline', 'sync',
  NOW() - INTERVAL '2 days',
  '{"target": "postgres://legacy-db", "syncInterval": 3600}',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '2 days'
);

-- ============================================================
-- Tasks
-- ============================================================
INSERT INTO tasks (agent_id, status, input, output, started_at, completed_at, error, created_at) VALUES
-- agent-001 tasks
(
  '00000000-0000-0000-0000-000000000001', 'completed',
  '{"batch": 1, "source": "partition-2024-01"}',
  '{"rowsProcessed": 4820, "duration": 12.4}',
  NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', NULL,
  NOW() - INTERVAL '3 hours'
),
(
  '00000000-0000-0000-0000-000000000001', 'completed',
  '{"batch": 2, "source": "partition-2024-02"}',
  '{"rowsProcessed": 5100, "duration": 13.1}',
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NULL,
  NOW() - INTERVAL '2 hours'
),
(
  '00000000-0000-0000-0000-000000000001', 'running',
  '{"batch": 3, "source": "partition-2024-03"}',
  NULL,
  NOW() - INTERVAL '15 minutes', NULL, NULL,
  NOW() - INTERVAL '15 minutes'
),
(
  '00000000-0000-0000-0000-000000000001', 'completed',
  '{"batch": 0, "source": "partition-2024-00"}',
  '{"rowsProcessed": 3900, "duration": 10.8}',
  NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', NULL,
  NOW() - INTERVAL '5 hours'
),
-- agent-002 tasks
(
  '00000000-0000-0000-0000-000000000002', 'completed',
  '{"reportType": "weekly", "period": "2024-W10"}',
  '{"pages": 12, "fileSize": "2.4MB", "url": "/reports/w10.pdf"}',
  NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', NULL,
  NOW() - INTERVAL '6 hours'
),
(
  '00000000-0000-0000-0000-000000000002', 'queued',
  '{"reportType": "monthly", "period": "2024-02"}',
  NULL, NULL, NULL, NULL,
  NOW() - INTERVAL '5 minutes'
),
(
  '00000000-0000-0000-0000-000000000002', 'completed',
  '{"reportType": "daily", "period": "2024-03-10"}',
  '{"pages": 4, "fileSize": "0.8MB", "url": "/reports/daily-0310.pdf"}',
  NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours', NULL,
  NOW() - INTERVAL '10 hours'
),
-- agent-003 tasks
(
  '00000000-0000-0000-0000-000000000003', 'failed',
  '{"windowStart": "placeholder", "windowEnd": "placeholder"}',
  NULL,
  NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours',
  'Connection timeout: could not reach metrics endpoint after 3 retries',
  NOW() - INTERVAL '3 hours'
),
(
  '00000000-0000-0000-0000-000000000003', 'failed',
  '{"windowStart": "placeholder", "windowEnd": "placeholder"}',
  NULL,
  NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours',
  'Connection timeout: could not reach metrics endpoint after 3 retries',
  NOW() - INTERVAL '4 hours'
),
(
  '00000000-0000-0000-0000-000000000003', 'completed',
  '{"windowStart": "placeholder", "windowEnd": "placeholder"}',
  '{"anomaliesDetected": 3, "severity": "medium"}',
  NOW() - INTERVAL '7 hours', NOW() - INTERVAL '7 hours', NULL,
  NOW() - INTERVAL '8 hours'
),
-- agent-004 tasks
(
  '00000000-0000-0000-0000-000000000004', 'running',
  '{"dataset": "train-v3", "hyperparams": {"n_estimators": 300}}',
  NULL,
  NOW() - INTERVAL '1 hour', NULL, NULL,
  NOW() - INTERVAL '1 hour'
),
(
  '00000000-0000-0000-0000-000000000004', 'completed',
  '{"dataset": "train-v2", "hyperparams": {"n_estimators": 200}}',
  '{"accuracy": 0.923, "f1": 0.911, "modelPath": "/models/xgb-v2.pkl"}',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours', NULL,
  NOW() - INTERVAL '1 day'
),
(
  '00000000-0000-0000-0000-000000000004', 'completed',
  '{"dataset": "train-v1", "hyperparams": {"n_estimators": 100}}',
  '{"accuracy": 0.891, "f1": 0.876, "modelPath": "/models/xgb-v1.pkl"}',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL,
  NOW() - INTERVAL '2 days'
),
(
  '00000000-0000-0000-0000-000000000004', 'queued',
  '{"dataset": "train-v4", "hyperparams": {"n_estimators": 500}}',
  NULL, NULL, NULL, NULL,
  NOW() - INTERVAL '2 minutes'
),
-- agent-005 tasks
(
  '00000000-0000-0000-0000-000000000005', 'failed',
  '{"tables": ["users", "orders", "products"]}',
  NULL,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
  'Agent went offline during execution',
  NOW() - INTERVAL '2 days'
);

-- ============================================================
-- Logs
-- ============================================================
INSERT INTO agent_logs (agent_id, level, message, timestamp, metadata) VALUES
('00000000-0000-0000-0000-000000000001', 'info', 'Started batch processing for partition-2024-03', NOW() - INTERVAL '15 minutes', '{"batch": 3}'),
('00000000-0000-0000-0000-000000000001', 'info', 'Connected to S3 source successfully',            NOW() - INTERVAL '14 minutes', '{}'),
('00000000-0000-0000-0000-000000000001', 'info', 'Processed 1000 rows',                            NOW() - INTERVAL '12 minutes', '{"progress": "25%"}'),
('00000000-0000-0000-0000-000000000001', 'warn', 'Slow read detected on partition chunk 7',         NOW() - INTERVAL '10 minutes', '{"latencyMs": 3200}'),
('00000000-0000-0000-0000-000000000001', 'info', 'Processed 2500 rows',                            NOW() - INTERVAL '8 minutes',  '{"progress": "60%"}'),

('00000000-0000-0000-0000-000000000002', 'info', 'Agent idle, waiting for next scheduled task',    NOW() - INTERVAL '8 minutes',  '{}'),
('00000000-0000-0000-0000-000000000002', 'info', 'Completed weekly report for W10',                NOW() - INTERVAL '5 hours',    '{"reportId": "w10"}'),

('00000000-0000-0000-0000-000000000003', 'error', 'Connection timeout: could not reach metrics endpoint after 3 retries', NOW() - INTERVAL '2 hours', '{"endpoint": "http://metrics:9090", "retries": 3}'),
('00000000-0000-0000-0000-000000000003', 'warn',  'Metrics endpoint response time elevated',       NOW() - INTERVAL '2 hours',    '{"responseTimeMs": 8400}'),
('00000000-0000-0000-0000-000000000003', 'error', 'Task failed, agent entering error state',       NOW() - INTERVAL '2 hours',    '{"taskId": "task-err"}'),
('00000000-0000-0000-0000-000000000003', 'info',  'Starting anomaly detection window',             NOW() - INTERVAL '7 hours',    '{"window": "1h"}'),

('00000000-0000-0000-0000-000000000004', 'info', 'Training started: dataset=train-v3, estimators=300', NOW() - INTERVAL '1 hour',    '{"epoch": 0}'),
('00000000-0000-0000-0000-000000000004', 'info', 'Epoch 10/100 — loss: 0.421',                    NOW() - INTERVAL '50 minutes', '{"epoch": 10, "loss": 0.421}'),
('00000000-0000-0000-0000-000000000004', 'info', 'Epoch 25/100 — loss: 0.312',                    NOW() - INTERVAL '35 minutes', '{"epoch": 25, "loss": 0.312}'),
('00000000-0000-0000-0000-000000000004', 'info', 'Epoch 50/100 — loss: 0.241',                    NOW() - INTERVAL '20 minutes', '{"epoch": 50, "loss": 0.241}'),

('00000000-0000-0000-0000-000000000005', 'error', 'Agent lost heartbeat, marking as offline',      NOW() - INTERVAL '2 days',     '{}'),
('00000000-0000-0000-0000-000000000005', 'warn',  'Sync task interrupted mid-execution',           NOW() - INTERVAL '2 days',     '{"tablesCompleted": ["users"]}');
