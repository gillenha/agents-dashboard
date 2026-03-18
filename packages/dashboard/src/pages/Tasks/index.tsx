import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Agent, PaginatedResponse, Task } from '@devpigh/shared';
import { api } from '@/api/client';
import { StatusBadge } from '@/components';
import styles from './Tasks.module.css';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function Tasks() {
  const [result, setResult] = useState<PaginatedResponse<Task> | null>(null);
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.agents.list().then((list) => {
      setAgents(new Map(list.map((a) => [a.id, a])));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api.tasks.list(page)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Tasks</h1>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Error</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(result?.data ?? []).map((task) => {
                const agent = agents.get(task.agentId);
                return (
                  <tr key={task.id}>
                    <td className={styles.mono}>{task.id.slice(0, 8)}…</td>
                    <td>
                      {agent ? (
                        <Link to={`/agents/${task.agentId}`} className={styles.agentLink}>
                          {agent.name}
                        </Link>
                      ) : (
                        <span className={styles.mono}>{task.agentId}</span>
                      )}
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                    <td className={styles.mono}>{formatDate(task.startedAt)}</td>
                    <td className={styles.mono}>{formatDuration(task.startedAt, task.completedAt)}</td>
                    <td>{task.error ? <span className={styles.errorText}>{task.error}</span> : '—'}</td>
                    <td className={styles.mono}>{formatDate(task.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {result && result.totalPages > 1 && (
          <div className={styles.pagination}>
            <span>Page {page} of {result.totalPages} — {result.total} tasks</span>
            <div className={styles.paginationBtns}>
              <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <button className={styles.pageBtn} disabled={page === result.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
