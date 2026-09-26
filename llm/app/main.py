"""Needle Bench LLM service.

Thin HTTP wrapper around cactus-needle (Needle 3). One process keeps a set
of warm agents keyed by (toolset, system facts); inference calls are
serialized with a lock because the engine is a tiny CPU model.

Two modes:
  tools   - the model picks calls from a toolset and fills arguments;
  extract - the record is the only tool; the model returns typed fields.
"""

import os
import threading
import time
from typing import Any, Optional

import needle
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.schemas import SCHEMAS
from app.toolsets import TOOLSETS

DEFAULT_MAX_NEW_TOKENS = int(os.environ.get("DEFAULT_MAX_NEW_TOKENS", "512"))

MODEL_NAME = "needle-3"

app = FastAPI(title="needle-bench-llm", version="1.0.0")

_lock = threading.Lock()
_agents: dict[str, needle.Needle] = {}
_ready = threading.Event()


def _agent(namespace: str, tools: list[dict], system_facts: Optional[str]) -> needle.Needle:
    key = f"{namespace}::{system_facts or ''}"
    agent = _agents.get(key)
    if agent is None:
        kwargs: dict[str, Any] = {}
        if system_facts:
            kwargs["system"] = system_facts
        agent = needle.Needle(tools=tools, **kwargs)
        _agents[key] = agent
    return agent


def _schema_as_tool(schema_id: str) -> list[dict]:
    entry = SCHEMAS[schema_id]
    return [
        {
            "name": "record",
            "description": entry.get("record_description", "Record the extracted fields."),
            "parameters": entry["schema"],
        }
    ]


class InferRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=8000)
    mode: str = "tools"
    toolset: Optional[str] = None
    schema_name: Optional[str] = None
    system_facts: Optional[str] = Field(default=None, max_length=500)
    max_new_tokens: int = Field(default=DEFAULT_MAX_NEW_TOKENS, ge=32, le=1024)


def _run(agent: needle.Needle, prompt: str, max_new_tokens: int) -> dict:
    agent.reset()
    return agent.complete(prompt, max_new_tokens=max_new_tokens)


@app.post("/infer")
def infer(req: InferRequest) -> dict:
    if not _ready.is_set():
        raise HTTPException(status_code=503, detail="model is warming up")

    if req.mode == "tools":
        if req.toolset not in TOOLSETS:
            raise HTTPException(status_code=400, detail=f"unknown toolset: {req.toolset!r}")
        tools = TOOLSETS[req.toolset]["tools"]
        namespace = f"tools:{req.toolset}"
    elif req.mode == "extract":
        if req.schema_name not in SCHEMAS:
            raise HTTPException(status_code=400, detail=f"unknown schema: {req.schema_name!r}")
        tools = _schema_as_tool(req.schema_name)
        namespace = f"extract:{req.schema_name}"
    else:
        raise HTTPException(status_code=400, detail=f"unknown mode: {req.mode!r}")

    t0 = time.perf_counter()
    with _lock:
        agent = _agent(namespace, tools, req.system_facts)
        try:
            raw = _run(agent, req.prompt, req.max_new_tokens)
        except Exception as exc:  # engine-level failure, surface it to the bench
            wall_ms = int((time.perf_counter() - t0) * 1000)
            return {
                "mode": req.mode,
                "toolset": req.toolset,
                "schema_name": req.schema_name,
                "system_facts": req.system_facts,
                "model": MODEL_NAME,
                "raw": None,
                "function_calls": None,
                "suppressed_calls": None,
                "record": None,
                "reasoning": None,
                "confidence": None,
                "success": False,
                "error": str(exc),
                "error_code": "engine_error",
                "metrics": {"wall_ms": wall_ms},
            }
    wall_ms = int((time.perf_counter() - t0) * 1000)

    function_calls = raw.get("function_calls") or []
    suppressed = raw.get("suppressed_calls") or []

    record = None
    if req.mode == "extract":
        source = function_calls or suppressed
        if source:
            record = source[0].get("arguments")

    decode_tps = raw.get("decode_tps")
    est_output_tokens = int(decode_tps * wall_ms / 1000) if decode_tps else None

    return {
        "mode": req.mode,
        "toolset": req.toolset,
        "schema_name": req.schema_name,
        "system_facts": req.system_facts,
        "model": MODEL_NAME,
        "raw": raw,
        "function_calls": function_calls,
        "suppressed_calls": suppressed,
        "record": record,
        "reasoning": raw.get("reasoning"),
        "confidence": raw.get("confidence"),
        "success": bool(raw.get("success", True)) and raw.get("error") is None,
        "error": raw.get("error"),
        "error_code": raw.get("error_code"),
        "metrics": {
            "wall_ms": wall_ms,
            "prefill_tps": raw.get("prefill_tps"),
            "decode_tps": decode_tps,
            "est_output_tokens": est_output_tokens,
        },
    }


@app.get("/info")
def info() -> dict:
    return {
        "model": MODEL_NAME,
        "library": getattr(needle, "__version__", "unknown"),
        "toolsets": [
            {"id": tid, "label": t["label"], "description": t["description"],
             "tools": [{"name": tt["name"], "description": tt["description"],
                        "parameters": tt["parameters"]} for tt in t["tools"]]}
            for tid, t in TOOLSETS.items()
        ],
        "schemas": [
            {"id": sid, "label": s["label"], "description": s["description"],
             "schema": s["schema"]}
            for sid, s in SCHEMAS.items()
        ],
    }


@app.get("/health")
def health() -> dict:
    return {"ok": _ready.is_set(), "model": MODEL_NAME}


def _warmup() -> None:
    # Construct the first agents and run one throwaway call so the first
    # real request does not pay engine initialisation.
    try:
        agent = _agent("tools:smart_home", TOOLSETS["smart_home"]["tools"], None)
        _run(agent, "turn on the kitchen lights", 64)
        extract_agent = _agent("extract:invoice", _schema_as_tool("invoice"), None)
        _run(extract_agent, "Invoice from Acme Corp, total 120.00 USD", 64)
    except Exception:
        pass
    _ready.set()


@app.on_event("startup")
def startup() -> None:
    threading.Thread(target=_warmup, daemon=True).start()
