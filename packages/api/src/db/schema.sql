-- Agents
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  status        VARCHAR(20)  NOT NULL CHECK (status IN ('idle', 'running', 'error', 'offline')),
  type          VARCHAR(100) NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  config        JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID         NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status        VARCHAR(20)  NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  input         JSONB        NOT NULL DEFAULT '{}',
  output        JSONB,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Agent logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID         NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  level      VARCHAR(10)  NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message    TEXT         NOT NULL,
  timestamp  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  metadata   JSONB        NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_status          ON agents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id_status  ON tasks(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at       ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_agent_id_ts       ON agent_logs(agent_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level             ON agent_logs(level);
