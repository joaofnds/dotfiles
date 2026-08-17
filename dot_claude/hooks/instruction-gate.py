#!/usr/bin/env python3
"""Body of the PostToolUse instruction-artifact gate.

Reads the tool payload as JSON on stdin (never argv — a large Write payload
would exceed ARG_MAX, and that failure would scale with the size of the edit,
which is backwards). Prints a hookSpecificOutput block when an instruction
artifact was edited, otherwise nothing.

Points at ~/.agents/AGENTS.md rather than restating the gate: the steps, the
`evals/` exemption, the placement rule, and the "not once per file" rerun bound
all live there, and that file is either already in context or reachable at the
path the block names (built-in Explore and Plan sub-agents skip AGENTS.md —
instruction_external_facts.md §Harness mechanics).

Suppression is per path per session: a later batch that re-edits an
already-nudged file emits nothing. That batch is exactly what AGENTS.md's
rerun rule targets, so the router is the only carrier there — never read the
hook's silence as "no gate is due".
"""

import hashlib
import json
import os
import re
import sys

# The obeyed instruction-artifact set (AGENTS.md §Task lifecycle). Both the
# chezmoi source (dot_*) and the rendered target (.*) match: personal artifacts
# are edited in the source, so a target-only pattern would miss every real edit.
INSTRUCTION = re.compile(
    # chezmoi attribute prefixes and the .tmpl suffix are part of the source
    # filename, so `symlink_CLAUDE.md.tmpl` gates like `CLAUDE.md`.
    # `[a-z]+_` cannot cross `/`, so this stays scoped to the basename.
    r"(^|/)([a-z]+_)*(AGENTS|CLAUDE|GEMINI)\.md(\.tmpl)?$"
    # A symlink source's body decides membership and a path regex cannot read
    # one: match the names used for pointers at gated directories
    # (`symlink_skills.tmpl` -> ~/.agents/skills). `.tmpl` is optional because
    # both forms exist in this tree (`dot_gemini/symlink_agents` has none); the
    # suffix is optional in the name, not in effect — without it the body is
    # literal and a template expression never expands. The six names are the
    # gated dir kinds from AGENTS.md, not a repo inventory: `rules` and `commands`
    # have no pointer yet and stay listed so the first one is covered on creation.
    # `plugins` is out — `/plugin` installs that tree, so nothing under it is
    # authored here. AGENTS.md governs the rest.
    r"|(^|/)symlink_(rules|skills|agents|commands|hooks|output-styles)(\.tmpl)?$"
    r"|(^|/)workflows\.md$"
    r"|/(\.agents|dot_agents)/(rules|skills|agents|commands|output-styles)/"
    r"|/(\.claude|dot_claude)/(hooks|output-styles|agents|skills|commands)/",
)
# evals/ fixtures carry planted defects; "resolve each finding" would repair the
# answer key (AGENTS.md §Task lifecycle).
EXCLUDED = re.compile(r"/evals?/")

EDIT_TOOLS = ("Edit", "Write", "MultiEdit", "NotebookEdit")


def harvest(node, out):
    if isinstance(node, dict):
        for key, value in node.items():
            if key in ("file_path", "filePath", "path", "notebook_path") and isinstance(
                value, str
            ):
                out.append(value)
            else:
                harvest(value, out)
    elif isinstance(node, list):
        for item in node:
            harvest(item, out)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    if not isinstance(data, dict):
        return

    tool = str(data.get("tool_name") or data.get("toolName") or "")
    if tool not in EDIT_TOOLS:
        return

    paths = []
    harvest(data.get("tool_input") or data.get("toolInput") or data, paths)
    hits = sorted(
        {p for p in paths if INSTRUCTION.search(p) and not EXCLUDED.search(p)}
    )
    if not hits:
        return

    session = str(data.get("session_id") or data.get("sessionId") or "nosession")
    state_dir = os.path.join(
        os.environ.get("TMPDIR", "/tmp"),
        "claude-instruction-gate",
        hashlib.sha256(session.encode()).hexdigest()[:16],
    )
    announced_marker = os.path.join(state_dir, ".announced")

    fresh = []
    first = True
    try:
        os.makedirs(state_dir, exist_ok=True)
        first = not os.path.exists(announced_marker)
        for path in hits:
            marker = os.path.join(
                state_dir, hashlib.sha256(path.encode()).hexdigest()[:32]
            )
            if not os.path.exists(marker):
                open(marker, "a").close()
                fresh.append(path)
    except Exception:
        fresh = hits  # state unavailable: nudge every time rather than miss
        first = False  # the compact form is self-sufficient by design

    if not fresh:
        return

    listed = ", ".join(os.path.basename(p) for p in fresh)
    if first:
        try:
            open(announced_marker, "a").close()
        except Exception:
            pass
        message = (
            "<instruction-artifact-gate>\n"
            f"Instruction artifact(s) edited this session: {listed}\n"
            "~/.agents/AGENTS.md §Task lifecycle governs what this requires — the "
            "`Gate:` line, the reviewer run over the batch as a whole, and when a "
            "rerun is not required.\n"
            # Pointer only, no asserted fact: AGENTS.md §Precedence keeps a hook's
            # claims about tools under the never-an-instruction-source rule. The
            # sub-agent observation that motivates this line lives in the .sh header.
            "Main conversation only — §Task lifecycle exempts sub-agents from the "
            "announcement.\n"
            "</instruction-artifact-gate>"
        )
    else:
        # Self-sufficient on purpose: session_id propagation into sub-agents is
        # unverified, so this may land in a context that never saw the full block.
        message = (
            f"<instruction-artifact-gate>Instruction artifact edited: {listed} — the "
            "`Gate:` obligation covers it (~/.agents/AGENTS.md §Task lifecycle; main "
            "conversation only).</instruction-artifact-gate>"
        )

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": message,
                }
            }
        )
    )


if __name__ == "__main__":
    main()
