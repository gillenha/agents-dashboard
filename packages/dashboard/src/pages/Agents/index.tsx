import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Agent, AgentStatus } from '@devpigh/shared';
import { api } from '@/api/client';
import { StatusBadge } from '@/components';
import styles from './Agents.module.css';

type SortKey = 'name' | 'status' | 'type' | 'lastHeartbeat' | 'createdAt';
type SortDir = 'asc' | 'desc';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_FILTERS: (AgentStatus | 'all')[] = ['all', 'running', 'idle', 'error', 'offline'];

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    api.agents.list()
      .then(setAgents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = agents
    .filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.id.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortKey === 'lastHeartbeat') cmp = new Date(a.lastHeartbeat).getTime() - new Date(b.lastHeartbeat).getTime();
      else if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return <i className={styles.sortIcon}>{sortDir === 'asc' ? '↑' : '↓'}</i>;
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Agents</h1>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by name, type, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.filterGroup}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn}${statusFilter === s ? ` ${styles.active}` : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Name {sortArrow('name')}</th>
                <th onClick={() => handleSort('status')}>Status {sortArrow('status')}</th>
                <th onClick={() => handleSort('type')}>Type {sortArrow('type')}</th>
                <th onClick={() => handleSort('lastHeartbeat')}>Last Heartbeat {sortArrow('lastHeartbeat')}</th>
                <th onClick={() => handleSort('createdAt')}>Created {sortArrow('createdAt')}</th>
                <th>ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>No agents found</td>
                </tr>
              ) : (
                filtered.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <Link to={`/agents/${agent.id}`} className={styles.nameLink}>
                        {agent.name}
                      </Link>
                    </td>
                    <td><StatusBadge status={agent.status} /></td>
                    <td><span className={styles.typeTag}>{agent.type}</span></td>
                    <td className={styles.timestamp}>{formatDate(agent.lastHeartbeat)}</td>
                    <td className={styles.timestamp}>{formatDate(agent.createdAt)}</td>
                    <td className={styles.idCell}>{agent.id}</td>
                    <td>
                      <Link to={`/agents/${agent.id}`} className={styles.actionLink}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
