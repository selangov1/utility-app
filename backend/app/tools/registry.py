from dataclasses import dataclass

from fastapi import APIRouter


@dataclass(frozen=True)
class Tool:
    id: str
    name: str
    description: str
    router: APIRouter


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        if tool.id in self._tools:
            raise ValueError(f"Duplicate tool id: {tool.id}")
        self._tools[tool.id] = tool

    def all(self) -> list[Tool]:
        return list(self._tools.values())
