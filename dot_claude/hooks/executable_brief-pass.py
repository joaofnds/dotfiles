#!/usr/bin/env python3
"""Stop hook: run the /brief pass by itself.

After a turn that used tools, the end-of-turn reply is a draft; this hook hands the
model the /brief skill as the reason to continue, once, so the rewrite João would
ask for with /brief is the turn's final message. Turns with no tool use, the
manual /brief turn, and the hook's own continuation pass through untouched. Any
failure fails open: a missing transcript or skill means no pass, never a stuck turn.
"""
import json
import os
import sys

SKILL = os.environ.get("BRIEF_SKILL", os.path.expanduser("~/.claude/skills/brief/SKILL.md"))
CLOSING = (
    "This pass runs by itself at the end of every turn that used tools. If nothing can "
    "be cut, send the answer again unchanged instead of saying so. The rewrite is your "
    "whole final message: no note about this pass."
)


def skill_body(path):
    text = open(path, encoding="utf-8").read()
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            text = text[end + 4:]
    return text.strip()


def is_human_message(record):
    if record.get("type") != "user" or record.get("isMeta"):
        return False
    content = record.get("message", {}).get("content")
    if isinstance(content, str):
        return True
    return isinstance(content, list) and not any(
        block.get("type") == "tool_result" for block in content
    )


def turn_used_tools(transcript_path):
    records = []
    with open(transcript_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    start = max((i for i, r in enumerate(records) if is_human_message(r)), default=None)
    if start is None:
        return False
    for record in records[start + 1:]:
        if record.get("type") != "assistant":
            continue
        content = record.get("message", {}).get("content")
        if isinstance(content, list) and any(b.get("type") == "tool_use" for b in content):
            return True
    return False


def main():
    try:
        event = json.load(sys.stdin)
        if event.get("stop_hook_active") or event.get("agent_id"):
            return
        if not (event.get("last_assistant_message") or "").strip():
            return
        if not turn_used_tools(event["transcript_path"]):
            return
        reason = skill_body(SKILL) + "\n\n" + CLOSING
    except Exception:
        return
    # Exit 2 blocks on every Stop event, whatever else is printed; stderr is the reason.
    # A JSON block decision on stdout was recorded but not honored (desktop build 2.1.255).
    sys.stderr.write(reason)
    sys.exit(2)


if __name__ == "__main__":
    main()
