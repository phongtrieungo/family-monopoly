# Codex model routing visibility

This project uses `.codex/hooks.json` to report the model that Codex actually invokes. The routing rules in `AGENTS.md` guide model selection; the hook output is the runtime evidence.

At the next Codex session start, review and trust the project hook through `/hooks` in the CLI or **Settings → Hooks** in the desktop app. Codex skips new or changed hooks until they are trusted.

For each model request, the terminal shows:

```text
[codex-route] task="fix reconnect handling" role=root model=gpt-5.6-sol
[codex-usage] task="fix reconnect handling" role=root model=gpt-5.6-sol status=completed input=1200 cached=800 output=240 reasoning=90 total=1440 turn_total=1440
```

Delegated calls identify their role as `subagent:<agent-type>`. A turn can include multiple model requests, so `turn_total` accumulates the reported total for that turn.

Token usage is best effort. When Codex does not provide `token_usage`, the hook prints `tokens=unavailable`; missing usage does not mean zero. For a quick interactive account/status view in Codex CLI, use `/status`.
