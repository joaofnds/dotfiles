#!/usr/bin/python3
"""Stop hook: verifies the announce-and-read protocol was followed.

Runs after Claude finishes an assistant turn. Walks the transcript backward
to isolate the most recent contiguous block of assistant entries (one
logical turn), then:

  - Decides whether the turn was SUBSTANTIVE: had any tool call OR more
    than 200 characters of model-emitted text.
  - If substantive, requires that some line in the model's text starts
    with "Reading:" or "No rule files apply:".
  - On violation, exits 2 with a stderr message that Claude Code feeds
    back to the model, forcing a corrective follow-up turn.

The protocol it enforces is declared authoritatively in ~/.agents/AGENTS.md.
"""

import json
import re
import sys
from pathlib import Path

ANNOUNCE_LINE = re.compile(r"^(Reading:|No rule files apply:)", re.MULTILINE)
SUBSTANTIVE_TEXT_THRESHOLD = 200


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    try:
        event = json.loads(raw)
    except json.JSONDecodeError:
        return 0

    # If Claude Code is already in a stop-hook retry, do not loop.
    if event.get("stop_hook_active"):
        return 0

    transcript_path = event.get("transcript_path")
    if not transcript_path or not Path(transcript_path).is_file():
        return 0

    turn = trailing_assistant_turn(Path(transcript_path))
    if not turn:
        return 0

    text, tool_count = summarize_turn(turn)
    if not is_substantive(text, tool_count):
        return 0

    if ANNOUNCE_LINE.search(text):
        return 0

    sys.stderr.write(
        "Protocol violation: the assistant turn just completed was "
        "substantive (had tool calls or more than "
        f"{SUBSTANTIVE_TEXT_THRESHOLD} characters of text) but no line "
        "began with 'Reading: <files>' or 'No rule files apply: <reason>'.\n"
        "\n"
        "Send one more reply whose FIRST LINE is one of those two forms, "
        "retroactively declaring the rule files relevant to the work just "
        "done. The announce-line is a user-visible signal — required even "
        "if the Read tool was called earlier in the turn.\n"
    )
    return 2


def trailing_assistant_turn(path: Path) -> list[dict]:
    entries: list[dict] = []
    with path.open() as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    cut = -1
    for i in range(len(entries) - 1, -1, -1):
        if entries[i].get("type") != "assistant":
            cut = i
            break
    return entries[cut + 1 :]


def summarize_turn(turn: list[dict]) -> tuple[str, int]:
    text_parts: list[str] = []
    tool_count = 0
    for entry in turn:
        content = entry.get("message", {}).get("content", [])
        if isinstance(content, str):
            text_parts.append(content)
            continue
        for block in content or []:
            btype = block.get("type")
            if btype == "text":
                text_parts.append(block.get("text", ""))
            elif btype == "tool_use":
                tool_count += 1
    return "\n".join(text_parts), tool_count


def is_substantive(text: str, tool_count: int) -> bool:
    return tool_count > 0 or len(text) > SUBSTANTIVE_TEXT_THRESHOLD


if __name__ == "__main__":
    sys.exit(main())
