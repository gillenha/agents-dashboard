import { v4 as uuidv4 } from 'uuid';
import type { Agent, CreateAgentInput, UpdateAgentInput } from '@devpigh/shared';
import type { IAgentRepository } from '../interfaces';

export class InMemoryAgentRepository implements IAgentRepository {
  private agents: Map<string, Agent> = new Map();

  async findAll(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<Agent | null> {
    return this.agents.get(id) ?? null;
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
    return agent;
  }

  async update(id: string, input: UpdateAgentInput): Promise<Agent | null> {
    const existing = this.agents.get(id);
    if (!existing) return null;
    const updated: Agent = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.agents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Used by seed to insert pre-built agents
  _seed(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }
}
