import { v4 as uuidv4 } from 'uuid';
import type { Server } from 'socket.io';
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@devpigh/shared';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@devpigh/shared';
import type { IAgentRepository } from '../interfaces';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class InMemoryAgentRepository implements IAgentRepository {
  private agents: Map<string, Agent> = new Map();
  private io: IO | null = null;

  setIO(io: IO): void {
    this.io = io;
  }

  async findAll(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<Agent | null> {
    return this.agents.get(id) ?? null;
  }

  async findByName(name: string): Promise<Agent | null> {
    for (const agent of this.agents.values()) {
      if (agent.name === name) return agent;
    }
    return null;
  }

  async findStale(olderThan: Date): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (a) => a.status !== 'offline' && new Date(a.lastHeartbeat) < olderThan
    );
  }

  async create(input: CreateAgentInput): Promise<Agent> {
    const now = new Date().toISOString();
    const agent: Agent = {
      id: uuidv4(),
      name: input.name,
      type: input.type,
      status: 'idle',
      lastHeartbeat: now,
      config: input.config ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.agents.set(agent.id, agent);
    this.io?.emit('agent:status', {
      agentId: agent.id,
      status:  agent.status,
      lastHeartbeat: agent.lastHeartbeat,
    });
    return agent;
  }

  async update(id: string, input: UpdateAgentInput): Promise<Agent | null> {
    const existing = this.agents.get(id);
    if (!existing) return null;
    const updated: Agent = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.agents.set(id, updated);
    if (this.io && input.status !== undefined) {
      this.io.emit('agent:status', {
        agentId: updated.id,
        status: updated.status,
        lastHeartbeat: updated.lastHeartbeat,
      });
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  _seed(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }
}
