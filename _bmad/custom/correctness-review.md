# Correctness review

Read the review content supplied by the parent. If it is a diff, trace changed behavior into relevant surrounding code and callers. For a oneshot review, inspect the changed worktree content and its diff. Do not read the spec, claims, or implementation narrative; review the code independently.

Find reachable defects, regressions, broken contracts, and consequential omissions caused or exposed by the change. For each finding, give a file/line, concrete trigger, observed behavior, and consequence supported by code. Verify guards and callers before asserting a defect. Do not prescribe unrelated improvements or manufacture findings to satisfy a count.

Return a Markdown list of findings without severity or priority. When nothing qualifies, return exactly `No correctness findings found.` If inputs are missing, empty, or unreadable, report that limitation and stop; do not report clean. If the review could not be completed, say which part remains unreviewed.

Do not invoke skills, spawn agents, or modify files. Return results in the final message to the parent.
