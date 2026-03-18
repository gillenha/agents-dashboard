import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Agent, AgentLog, LogLevel, PaginatedResponse, Task } from '@devpigh/shared';
import { api } from '@/api/client';
import { StatusBadge } from '@/components';
import styles from './AgentDetail.module.css';

type Tab = 'overview' | 'tasks' | 'logs' | 'config';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<PaginatedResponse<Task> | null>(null);
  const [taskPage, setTaskPage] = useState(1);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<PaginatedResponse<AgentLog> | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [logLevel, setLogLevel] = useState<LogLevel | undefined>(undefined);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.agents.get(id)
      .then(setAgent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || tab !== 'tasks') return;
    setTasksLoading(true);
    api.agents.tasks(id, taskPage)
      .then(setTasks)
      .finally(() => setTasksLoading(false));
  }, [id, tab, taskPage]);

  useEffect(() => {
    if (!id || tab !== 'logs') return;
    setLogsLoading(true);
    api.agents.logs(id, logPage, 50, logLevel)
      .then(setLogs)
      .finally(() => setLogsLoading(false));
  }, [id, tab, logPage, logLevel]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.errorState}>{error}</div>;
  if (!agent) return null;

  return (
    <div className={styles.page}>
      <Link to="/agents" className={styles.backLink}>← Back to Agents</Link>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.agentName}>{agent.name}</h1>
          <div className={styles.agentMeta}>
            <StatusBadge status={agent.status} />
            <span className={styles.typeTag}>{agent.type}</span>
            <span className={styles.idText}>{agent.id}</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {(['overview', 'tasks', 'logs', 'config'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab}${tab === t ? ` ${styles.active}` : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className={styles.overviewGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Agent Details</div>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <StatusBadge status={agent.status} />
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Type</span>
                <span className={styles.detailValue}>{agent.type}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Last Heartbeat</span>
                <span className={`${styles.detailValue} ${styles.mono}`}>{formatDate(agent.lastHeartbeat)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Created</span>
                <span className={`${styles.detailValue} ${styles.mono}`}>{formatDate(agent.createdAt)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Updated</span>
                <span className={`${styles.detailValue} ${styles.mono}`}>{formatDate(agent.updatedAt)}</span>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Configuration Preview</div>
            <pre className={styles.configJson}>
              {JSON.stringify(agent.config, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            {tasksLoading ? (
              <div className={styles.loading}>Loading…</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Duration</th>
                    <th>Error</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasks?.data ?? []).map((task) => (
                    <tr key={task.id}>
                      <td className={styles.mono}>{task.id.slice(0, 8)}…</td>
                      <td><StatusBadge status={task.status} /></td>
                      <td className={styles.mono}>{formatDate(task.startedAt)}</td>
                      <td className={styles.mono}>{formatDuration(task.startedAt, task.completedAt)}</td>
                      <td>{task.error ? <span className={styles.errorText}>{task.error}</span> : '—'}</td>
                      <td className={styles.mono}>{formatDate(task.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {tasks && tasks.totalPages > 1 && (
            <div className={styles.pagination}>
              <span>Page {taskPage} of {tasks.totalPages} — {tasks.total} tasks</span>
              <div className={styles.paginationBtns}>
                <button
                  className={styles.pageBtn}
                  disabled={taskPage === 1}
                  onClick={() => setTaskPage((p) => p - 1)}
                >Prev</button>
                <button
                  className={styles.pageBtn}
                  disabled={taskPage === tasks.totalPages}
                  onClick={() => setTaskPage((p) => p + 1)}
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div className={styles.logControls}>
            {([undefined, 'info', 'warn', 'error'] as (LogLevel | undefined)[]).map((lvl) => (
              <button
                key={lvl ?? 'all'}
                className={`${styles.levelBtn}${logLevel === lvl ? ` ${styles.active}` : ''}`}
                onClick={() => { setLogLevel(lvl); setLogPage(1); }}
              >
                {lvl ?? 'All'}
              </button>
            ))}
          </div>
          <div className={styles.logList}>
            {logsLoading ? (
              <div className={styles.loading}>Loading…</div>
            ) : (logs?.data ?? []).length === 0 ? (
              <div className={styles.loading}>No logs</div>
            ) : (
              (logs?.data ?? []).map((log) => (
                <div key={log.id} className={styles.logRow}>
                  <span className={styles.logTime}>{formatDate(log.timestamp)}</span>
                  <span className={styles.logLevel}><StatusBadge status={log.level} /></span>
                  <span className={styles.logMessage}>{log.message}</span>
                </div>
              ))
            )}
          </div>
          {logs && logs.totalPages > 1 && (
            <div className={styles.pagination}>
              <span>Page {logPage} of {logs.totalPages} — {logs.total} logs</span>
              <div className={styles.paginationBtns}>
                <button className={styles.pageBtn} disabled={logPage === 1} onClick={() => setLogPage((p) => p - 1)}>Prev</button>
                <button className={styles.pageBtn} disabled={logPage === logs.totalPages} onClick={() => setLogPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'config' && (
        <div className={styles.configCard}>
          <div className={styles.cardTitle}>Agent Configuration</div>
          <pre className={styles.configJson}>
            {JSON.stringify(agent.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
