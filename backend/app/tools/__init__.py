"""Server-side tool plugins.

Only tools that genuinely need the server belong here (secrets, native
libraries, network access the browser can't do). Anything that can run in the
browser must be implemented in the frontend instead, so user data never leaves
the device.

To add one: create a module exposing a ``tool`` (see ``registry.Tool``), add it
to ``SERVER_TOOLS`` below, and give its frontend definition ``execution: 'server'``
with the same id.
"""

from types import ModuleType

from fastapi import APIRouter

from .registry import ToolRegistry

SERVER_TOOLS: tuple[ModuleType, ...] = ()


def build_router(registry: ToolRegistry) -> APIRouter:
    router = APIRouter(prefix="/api/tools", tags=["tools"])

    @router.get("")
    def list_tools() -> list[dict[str, str]]:
        """Capability list: ids of server tools this backend provides."""
        return [{"id": t.id} for t in registry.all()]

    for tool in registry.all():
        router.include_router(tool.router, prefix=f"/{tool.id}", tags=[tool.id])
    return router


registry = ToolRegistry()
for _module in SERVER_TOOLS:
    registry.register(_module.tool)

router = build_router(registry)
