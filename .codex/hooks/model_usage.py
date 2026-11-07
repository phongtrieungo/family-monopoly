#!/usr/bin/env python3
"""Print authoritative Codex model routing and best-effort token usage."""

from __future__ import annotations

import json
import re
import sys
import tempfile
from pathlib import Path
from typing import Any


def safe_id(value: object) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", str(value or "unknown"))[:120]


def state_path(event: dict[str, Any]) -> Path:
    return Path(tempfile.gettempdir()) / f"family-monopoly-codex-{safe_id(event.get('session_id'))}.json"


def load_state(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")


def task_label(prompt: object) -> str:
    text = " ".join(str(prompt or "unspecified task").split())
    return text[:77] + "..." if len(text) > 80 else text


def role_label(event: dict[str, Any]) -> str:
    agent_type = event.get("agent_type")
    return f"subagent:{agent_type}" if agent_type else "root"


def number_at(value: object, *paths: tuple[str, ...]) -> int | None:
    for path in paths:
        current = value
        for part in path:
            if not isinstance(current, dict) or part not in current:
                break
            current = current[part]
        else:
            if isinstance(current, (int, float)) and not isinstance(current, bool):
                return int(current)
    return None


def token_counts(usage: object) -> dict[str, int] | None:
    if not isinstance(usage, dict):
        return None
    input_tokens = number_at(usage, ("input_tokens",), ("inputTokens",))
    output_tokens = number_at(usage, ("output_tokens",), ("outputTokens",))
    cached_tokens = number_at(
        usage,
        ("cached_input_tokens",),
        ("cachedInputTokens",),
        ("input_tokens_details", "cached_tokens"),
        ("inputTokensDetails", "cachedTokens"),
    )
    reasoning_tokens = number_at(
        usage,
        ("reasoning_output_tokens",),
        ("reasoningOutputTokens",),
        ("output_tokens_details", "reasoning_tokens"),
        ("outputTokensDetails", "reasoningTokens"),
    )
    total_tokens = number_at(usage, ("total_tokens",), ("totalTokens",))
    if total_tokens is None and (input_tokens is not None or output_tokens is not None):
        total_tokens = (input_tokens or 0) + (output_tokens or 0)
    if all(value is None for value in (input_tokens, output_tokens, cached_tokens, reasoning_tokens, total_tokens)):
        return None
    return {
        "input": input_tokens or 0,
        "cached": cached_tokens or 0,
        "output": output_tokens or 0,
        "reasoning": reasoning_tokens or 0,
        "total": total_tokens or 0,
    }


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        return 0
    if not isinstance(event, dict):
        return 0

    path = state_path(event)
    state = load_state(path)
    turns = state.setdefault("turns", {})
    turn_id = str(event.get("turn_id") or "unknown")
    event_name = event.get("hook_event_name")

    if event_name == "UserPromptSubmit":
        turns[turn_id] = {"task": task_label(event.get("prompt")), "total": 0}
        save_state(path, state)
        return 0

    turn = turns.setdefault(turn_id, {"task": "unspecified task", "total": 0})
    task = turn.get("task", "unspecified task")
    model = event.get("model") or "unknown"
    role = role_label(event)

    if event_name == "PreModelRequest":
        print(f'[codex-route] task="{task}" role={role} model={model}')
        return 0

    if event_name == "PostModelRequest":
        status = event.get("status") or "unknown"
        counts = token_counts(event.get("token_usage"))
        if counts is None:
            print(
                f'[codex-usage] task="{task}" role={role} model={model} '
                f"status={status} tokens=unavailable"
            )
            return 0
        turn["total"] = int(turn.get("total", 0)) + counts["total"]
        save_state(path, state)
        print(
            f'[codex-usage] task="{task}" role={role} model={model} status={status} '
            f'input={counts["input"]} cached={counts["cached"]} '
            f'output={counts["output"]} reasoning={counts["reasoning"]} '
            f'total={counts["total"]} turn_total={turn["total"]}'
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
