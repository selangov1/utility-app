"""Convert JSON into CSV.

Supported shapes:
- a list of objects (each object is a row);
- an object containing an array of objects at any depth (e.g. ``{"data": {"items": [...]}}``).
  The longest, then shallowest, such array is used unless an explicit path is given;
- a single object (one row);
- a list of scalars (one ``value`` column).

Inside a row, nested objects are treated as a group and flattened into
dotted columns (``address.city``); arrays of scalars are joined with "; ";
arrays of objects become indexed groups (``items.0.name``).
"""

import csv
import io
import json
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from .registry import Tool

TOOL_ID = "json-to-csv"
PATH_SEP = "."


def _scalar(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return value


def flatten_record(value: Any, prefix: str = "", out: dict[str, Any] | None = None) -> dict[str, Any]:
    """Flatten nested objects/arrays of objects into a single-level dict."""
    if out is None:
        out = {}
    if isinstance(value, dict):
        if not value and prefix:
            out[prefix] = ""
        for key, child in value.items():
            flatten_record(child, f"{prefix}{PATH_SEP}{key}" if prefix else str(key), out)
    elif isinstance(value, list):
        if any(isinstance(v, (dict, list)) for v in value):
            for i, child in enumerate(value):
                flatten_record(child, f"{prefix}{PATH_SEP}{i}" if prefix else str(i), out)
        else:
            out[prefix or "value"] = "; ".join(str(_scalar(v)) for v in value)
    else:
        out[prefix or "value"] = _scalar(value)
    return out


def find_record_arrays(data: Any) -> list[tuple[str, list]]:
    """Breadth-first search of objects for arrays containing objects.

    Returns (path, array) pairs ordered by length (longest first), then depth.
    """
    found: list[tuple[int, str, list]] = []
    queue: list[tuple[str, Any, int]] = [("", data, 0)]
    while queue:
        path, node, depth = queue.pop(0)
        if not isinstance(node, dict):
            continue
        for key, child in node.items():
            child_path = f"{path}{PATH_SEP}{key}" if path else str(key)
            if isinstance(child, list) and any(isinstance(v, dict) for v in child):
                found.append((depth, child_path, child))
            elif isinstance(child, dict):
                queue.append((child_path, child, depth + 1))
    found.sort(key=lambda item: (-len(item[2]), item[0]))
    return [(path, arr) for _, path, arr in found]


def resolve_path(data: Any, path: str) -> Any:
    node = data
    for part in path.split(PATH_SEP):
        if isinstance(node, dict) and part in node:
            node = node[part]
        elif isinstance(node, list) and part.isdigit() and int(part) < len(node):
            node = node[int(part)]
        else:
            raise ValueError(f"Path '{path}' not found in JSON")
    return node


def extract_records(data: Any, path: str | None = None) -> tuple[list, str]:
    """Return (records, source_path). source_path is "" for the document root."""
    if path:
        node = resolve_path(data, path)
        if isinstance(node, list):
            return node, path
        if isinstance(node, dict):
            return [node], path
        raise ValueError(f"Path '{path}' must point to an array or an object")

    if isinstance(data, list):
        return data, ""
    if isinstance(data, dict):
        arrays = find_record_arrays(data)
        if arrays:
            return arrays[0][1], arrays[0][0]
        return [data], ""
    raise ValueError("JSON must be an object or an array")


def json_to_csv(text: str, path: str | None = None) -> tuple[str, str]:
    """Convert JSON text to (CSV text, source path). Raises ValueError on invalid input."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON: {exc}") from exc

    records, source = extract_records(data, path.strip() if path else None)
    rows = [flatten_record(r) for r in records]
    if not rows:
        raise ValueError("No records found to convert")

    # Preserve column order based on first appearance across all records.
    fieldnames = list(dict.fromkeys(key for row in rows for key in row))

    out = io.StringIO(newline="")
    writer = csv.DictWriter(out, fieldnames=fieldnames, restval="")
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue(), source


router = APIRouter()


@router.post("/convert")
async def convert(
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
    path: str | None = Form(None),
) -> Response:
    if file is not None:
        try:
            content = (await file.read()).decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    elif text is not None and text.strip():
        content = text
    else:
        raise HTTPException(status_code=400, detail="Provide a JSON file or paste JSON text")
    try:
        csv_text, source = json_to_csv(content, path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"X-Source-Path": source},
    )


tool = Tool(
    id=TOOL_ID,
    name="JSON to CSV",
    description="Convert JSON (upload or paste) into CSV. Finds nested arrays and flattens child objects.",
    router=router,
)
