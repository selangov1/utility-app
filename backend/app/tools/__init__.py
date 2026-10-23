"""Tool plugins. To add a tool: create a module exposing a `tool` (see
registry.Tool) and add it to the tuple below."""

from fastapi import APIRouter

from . import json_to_csv
from .registry import ToolRegistry

registry = ToolRegistry()
for _module in (json_to_csv,):
    registry.register(_module.tool)

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("")
def list_tools() -> list[dict[str, str]]:
    return [
        {"id": t.id, "name": t.name, "description": t.description}
        for t in registry.all()
    ]


for _tool in registry.all():
    router.include_router(_tool.router, prefix=f"/{_tool.id}", tags=[_tool.id])
