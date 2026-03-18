"""Dataclass models mirroring the shared TypeScript types."""
from dataclasses import dataclass
from typing import Any


@dataclass
class Agent:
    id: str
    name: str
    status: str          # idle | running | error | offline
    type: str
    last_heartbeat: str  # ISO timestamp
    config: dict[str, Any]
    created_at: str
    updated_at: str

    @classmethod
    def from_dict(cls, data: dict) -> "Agent":
        return cls(
            id=data["id"],
            name=data["name"],
            status=data["status"],
            type=data["type"],
            last_heartbeat=data["lastHeartbeat"],
            config=data.get("config", {}),
            created_at=data["createdAt"],
            updated_at=data["updatedAt"],
        )


@dataclass
class Task:
    id: str
    agent_id: str
    status: str           # queued | running | completed | failed
    input: dict[str, Any]
    output: dict[str, Any] | None
    started_at: str | None
    completed_at: str | None
    error: str | None
    created_at: str

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        return cls(
            id=data["id"],
            agent_id=data["agentId"],
            status=data["status"],
            input=data.get("input", {}),
            output=data.get("output"),
            started_at=data.get("startedAt"),
            completed_at=data.get("completedAt"),
            error=data.get("error"),
            created_at=data["createdAt"],
        )
