import type { Task } from '@devpigh/shared';
import styles from './TaskResultPanel.module.css';

interface HealthResult {
  url: string;
  status_code: number;
  response_time_ms: number;
  healthy: boolean;
}

function isHealthCheckerOutput(output: Record<string, unknown>): output is { results: HealthResult[] } {
  if (!Array.isArray(output.results) || output.results.length === 0) return false;
  const first = output.results[0] as Record<string, unknown>;
  return typeof first.url === 'string' && typeof first.healthy === 'boolean';
}

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

export interface TaskResultPanelProps {
  task: Task;
}

export function TaskResultPanel({ task }: TaskResultPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Started</span>
          <span className={styles.metaValue}>{formatDate(task.startedAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Completed</span>
          <span className={styles.metaValue}>{formatDate(task.completedAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Duration</span>
          <span className={styles.metaValue}>{formatDuration(task.startedAt, task.completedAt)}</span>
        </div>
      </div>

      {task.status === 'failed' && task.error && (
        <div className={styles.errorBlock}>
          <span className={styles.errorBlockLabel}>Error</span>
          <pre className={styles.errorBlockText}>{task.error}</pre>
        </div>
      )}

      {task.status === 'completed' && task.output && (
        isHealthCheckerOutput(task.output) ? (
          <div className={styles.resultSection}>
            <div className={styles.sectionLabel}>Results</div>
            <div className={styles.tableWrap}>
              <table className={styles.resultTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>URL</th>
                    <th className={styles.th}>Status Code</th>
                    <th className={styles.th}>Response Time</th>
                    <th className={styles.th}>Healthy</th>
                  </tr>
                </thead>
                <tbody>
                  {task.output.results.map((r, i) => (
                    <tr key={i}>
                      <td className={styles.tdUrl}>{r.url}</td>
                      <td className={styles.tdCode}>{r.status_code}</td>
                      <td className={styles.tdTime}>{r.response_time_ms}ms</td>
                      <td className={styles.tdHealthy}>
                        <span className={r.healthy ? styles.healthyBadge : styles.unhealthyBadge}>
                          <span className={styles.dot} />
                          {r.healthy ? 'healthy' : 'unhealthy'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.sectionLabel}>Output</div>
            <pre className={styles.jsonOutput}>{JSON.stringify(task.output, null, 2)}</pre>
          </div>
        )
      )}

      {task.status === 'completed' && !task.output && (
        <div className={styles.emptyOutput}>No output recorded.</div>
      )}
    </div>
  );
}
