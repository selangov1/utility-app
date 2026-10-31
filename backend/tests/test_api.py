import pytest
from fastapi import APIRouter, FastAPI, Request
from fastapi.testclient import TestClient

from app.main import app
from app.security import BodySizeLimitMiddleware, SecurityHeadersMiddleware
from app.tools import build_router
from app.tools.registry import Tool, ToolRegistry

client = TestClient(app)


def test_health_has_security_headers() -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.headers["cache-control"] == "no-store"
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["referrer-policy"] == "no-referrer"
    assert "default-src 'none'" in res.headers["content-security-policy"]
    assert "server" not in res.headers


def test_capability_list_exposes_only_ids() -> None:
    res = client.get("/api/tools")
    assert res.status_code == 200
    assert all(set(item) == {"id"} for item in res.json())


def test_client_side_tools_are_not_served() -> None:
    assert client.post("/api/tools/json-to-csv/convert", data={"text": "[]"}).status_code == 404
    assert client.post("/api/tools/url-encode-decode/convert", json={}).status_code == 404


def _registry_with_echo() -> ToolRegistry:
    router = APIRouter()

    @router.post("/run")
    async def run(request: Request) -> dict[str, int]:
        return {"size": len(await request.body())}

    registry = ToolRegistry()
    registry.register(Tool(id="echo-size", name="Echo", description="d", router=router))
    return registry


def _test_app(max_bytes: int = 1_000_000) -> TestClient:
    test_app = FastAPI()
    test_app.include_router(build_router(_registry_with_echo()))
    test_app.add_middleware(BodySizeLimitMiddleware, max_bytes=max_bytes)
    test_app.add_middleware(SecurityHeadersMiddleware)
    return TestClient(test_app)


def test_registered_server_tool_is_listed_and_routed() -> None:
    c = _test_app()
    assert c.get("/api/tools").json() == [{"id": "echo-size"}]
    assert c.post("/api/tools/echo-size/run", content=b"abc").json() == {"size": 3}


def test_body_size_limit_by_content_length() -> None:
    c = _test_app(max_bytes=10)
    res = c.post("/api/tools/echo-size/run", content=b"x" * 11)
    assert res.status_code == 413
    assert res.headers["cache-control"] == "no-store"


def test_body_size_limit_for_chunked_bodies() -> None:
    c = _test_app(max_bytes=10)

    def chunks():
        yield b"x" * 6
        yield b"x" * 6

    res = c.post("/api/tools/echo-size/run", content=chunks())
    assert res.status_code == 413


@pytest.mark.parametrize("bad_id", ["", "Upper", "has space", "../x", "a" * 65])
def test_registry_rejects_unsafe_ids(bad_id: str) -> None:
    with pytest.raises(ValueError):
        ToolRegistry().register(Tool(id=bad_id, name="n", description="d", router=APIRouter()))


def test_registry_rejects_duplicates() -> None:
    registry = _registry_with_echo()
    with pytest.raises(ValueError):
        registry.register(Tool(id="echo-size", name="n", description="d", router=APIRouter()))
