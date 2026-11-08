# Story session boundaries and handoff

Use a fresh root session for each authorized story by default. Finish the active story's implementation, review, verification, and delivery work together. Move unrelated work or the next story to a fresh session through the user or external runner. An explicit request to continue in the same session takes precedence. A handoff does not clear history or launch a new session.

## Completion handoff

At workflow completion, including build-auto HALT, append one copyable `text` block of at most 250 words after the required result summary. Also provide it when the user interrupts a story or requests a session transfer. Fill this template from existing task evidence; mark unknown or unrun items explicitly:

```text
Repository/worktree: <absolute path>
Story and status: <ID; done, in progress, ready for approval, or blocked>
Scope / ambiguity / impact: <brief classification>
Spec and required context: <paths; relevant requirement/scenario IDs>
Git: <branch; baseline; current HEAD; dirty paths or clean>
Verification: <commands and outcomes; tested commit or description of uncommitted state>
Review / open gates: <findings, deferred items, approvals or human checks still needed>
Runtime hook evidence: <reported model/usage, or unavailable>
Next action: <resume current authorized task, or await selection of another story>
Start here: Read AGENTS.md and the referenced spec/context. Check branch, HEAD,
working changes, and approval status before acting. Reconcile stale handoff facts
with disk. Preserve acceptance gates and do not assume the next story is authorized.
```

Use paths and evidence references instead of transcripts, source dumps, full logs, or repeated planning documents. Reuse evidence already collected; do not run a new investigation just to fill the block. Record any unverified Git state as such. Keep the handoff in the final response, so completion does not dirty a finalized worktree. Keep required status/result artifacts in their existing workflow locations.

## Resuming

The user or runner pastes the block into a fresh session and states the authorized next action. Load the applicable repository instructions, target spec, and required context, then inspect the actual working state. Treat prior verification as evidence for its recorded revision; rerun required checks when code changes, evidence is incomplete, or a concern remains. Preserve pending decisions and incomplete status. Do not mark a story accepted or reopen completed work solely because the session changed.
