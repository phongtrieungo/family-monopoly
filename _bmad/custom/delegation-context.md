# Delegation context policy

For independent implementation, discovery, and review agents:

- Explicitly set `fork_turns="none"` in the actual launch arguments. A prompt saying "context-free" does not disable inherited history. Check the arguments before dispatch.
- Supply the repository path and a bounded task. Use absolute paths to the spec, diff, review instructions, and required context files instead of pasting the conversation or file contents. The child reads applicable repository instructions and its required inputs.
- Preserve the workflow's handoff format and reviewer visibility boundaries. Blind reviewers receive only their permitted inputs; claims remain unread until the review instructions allow them. Acceptance reviewers receive the spec and required context paths.
- Preserve scope, ambiguity, impact, and model-routing requirements through the authorized spec or task input. Keep existing review layers and acceptance gates.
- Reuse the same child for fixes to its task. If isolated launches are unavailable, use the workflow's documented fallback and report the limitation; do not silently inherit the whole conversation.

This policy governs launch instructions. Runtime launch arguments and usage evidence are needed to verify compliance and measure savings.
