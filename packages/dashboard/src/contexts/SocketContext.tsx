import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@devpigh/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type SocketStatus = 'connected' | 'reconnecting' | 'disconnected';

interface SocketContextValue {
  socket: AppSocket | null;
  status: SocketStatus;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, status: 'disconnected' });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');

  useEffect(() => {
    const s: AppSocket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });

    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', () => setStatus('disconnected'));
    s.on('connect_error', () => setStatus('reconnecting'));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
