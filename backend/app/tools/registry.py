import re
from dataclasses import dataclass

from fastapi import APIRouter

TOOL_ID_PATTERN = re.compile(r"^[a-z0-9-]{1,64}$")


@dataclass(frozen=True)
class Tool:
    """A server-side tool. ``id`` must match the frontend tool definition."""

    id: str
    name: str
    description: str
    router: APIRouter


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        if not TOOL_ID_PATTERN.fullmatch(tool.id):
            raise ValueError(f"Invalid tool id: {tool.id!r}")
        if tool.id in self._tools:
            raise ValueError(f"Duplicate tool id: {tool.id}")
        self._tools[tool.id] = tool

    def all(self) -> list[Tool]:
        return list(self._tools.values())
