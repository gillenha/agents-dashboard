import { useEffect, useState } from 'react';
import type { Agent, AgentLog, DashboardSummary } from '@devpigh/shared';
import { api } from '../../api/client';
import { MetricCard } from '../../components/MetricCard/MetricCard';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import styles from './Overview.module.css';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Overview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, agentsData] = await Promise.all([
          api.dashboard.summary(),
          api.agents.list(),
        ]);
        setSummary(summaryData);
        setAgents(agentsData);

        // Fetch recent logs from running/error agents
        const targetAgents = agentsData
          .filter((a) => a.status === 'running' || a.status === 'error')
          .slice(0, 3);
        const logResults = await Promise.all(
          targetAgents.map((a) => api.agents.logs(a.id, 1, 5))
        );
        const allLogs = logResults.flatMap((r) => r.data);
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(allLogs.slice(0, 10));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!summary) return null;

  const totalAgents = summary.totalAgents;
  const errorRatePct = (summary.errorRate * 100).toFixed(1);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Overview</h1>

      <div className={styles.metricsGrid}>
        <MetricCard
          label="Total Agents"
          value={totalAgents}
          delta={`${summary.agentsByStatus.running} running`}
          deltaType="positive"
        />
        <MetricCard
          label="Tasks (24h)"
          value={summary.totalTasksLast24h}
          delta={`${summary.tasksCompletedLast24h} completed`}
          deltaType="positive"
        />
        <MetricCard
          label="Error Rate"
          value={`${errorRatePct}%`}
          delta={summary.agentsByStatus.error > 0 ? `${summary.agentsByStatus.error} agent${summary.agentsByStatus.error > 1 ? 's' : ''} in error` : 'No errors'}
          deltaType={summary.agentsByStatus.error > 0 ? 'negative' : 'positive'}
        />
        <MetricCard
          label="Offline Agents"
          value={summary.agentsByStatus.offline}
          delta="Requires attention"
          deltaType={summary.agentsByStatus.offline > 0 ? 'negative' : 'neutral'}
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Agent Status</div>
          <div className={styles.statusList}>
            {(['running', 'idle', 'error', 'offline'] as const).map((status) => {
              const count = summary.agentsByStatus[status];
              const pct = totalAgents > 0 ? (count / totalAgents) * 100 : 0;
              return (
                <div key={status}>
                  <div className={styles.statusRow}>
                    <div className={styles.statusLeft}>
                      <StatusBadge status={status} />
                    </div>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                  <div className={styles.statusBar}>
                    <div
                      className={`${styles.statusBarFill} ${styles[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent Activity</div>
          {logs.length === 0 ? (
            <div className={styles.loading}>No recent activity</div>
          ) : (
            <div className={styles.activityList}>
              {logs.map((log) => {
                const agent = agents.find((a) => a.id === log.agentId);
                return (
                  <div key={log.id} className={styles.activityItem}>
                    <span className={`${styles.activityDot} ${styles[log.level]}`} />
                    <div className={styles.activityBody}>
                      <div className={styles.activityMessage}>{log.message}</div>
                      <div className={styles.activityMeta}>
                        <span>{agent?.name ?? log.agentId}</span>
                        <span>·</span>
                        <span>{timeAgo(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
