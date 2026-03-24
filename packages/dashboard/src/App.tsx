import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components';
import { SocketProvider } from '@/contexts/SocketContext';
import { Overview } from '@/pages/Overview';
import { Agents } from '@/pages/Agents';
import { AgentDetail } from '@/pages/AgentDetail';
import { Tasks } from '@/pages/Tasks';
import Demo from '@/pages/Demo';

export default function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/tasks" element={<Tasks />} />
        </Route>
        <Route path="/demo/:clientSlug" element={<Demo />} />
      </Routes>
    </SocketProvider>
  );
}
