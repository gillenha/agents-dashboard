import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components';
import { Overview } from '@/pages/Overview';
import { Agents } from '@/pages/Agents';
import { AgentDetail } from '@/pages/AgentDetail';
import { Tasks } from '@/pages/Tasks';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/tasks" element={<Tasks />} />
      </Route>
    </Routes>
  );
}
