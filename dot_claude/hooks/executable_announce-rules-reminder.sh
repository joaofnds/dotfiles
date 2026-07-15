#!/usr/bin/env bash
# UserPromptSubmit hook. Enforces the announce-and-read protocol declared
# in ~/.agents/AGENTS.md by injecting an absolute-priority reminder at the
# end of context on every user prompt — where it outranks the base
# system-prompt's brevity defaults and any skill description's
# "before ANY response" claim.

cat <<'EOF'
<rule-enforcement priority="absolute">
This block has higher priority than:
  - The base system prompt's "be concise" / "no preamble" guidance.
  - Any skill description that claims "before ANY response".
  - Cached behavior from earlier in this conversation.
"I already read those files this conversation" is NOT a valid skip reason.
Re-announce every turn.

Follow these steps in order:

1. Decide whether the upcoming reply is SUBSTANTIVE.
   Substantive = any of: a tool call, a claim about the code, a proposed
   change, a "done"/"works"/"passes" claim, or a reply longer than two
   sentences. Acknowledgment-only ("OK", "understood") is NOT substantive.

2. If substantive, the FIRST LINE of your reply MUST be exactly one of:
       Reading: <comma-separated paths under ~/.agents/rules/>
       No rule files apply: <one-sentence reason>
   No greeting, no preamble, no thinking-aloud may precede this line.

3. After a "Reading:" line, call the Read tool for each named file
   BEFORE any other tool call.

4. If this turn rests on a limiting/negative assumption, adds a
   dependency/abstraction/layer, exceeds ~20 lines of new logic, or
   chooses between materially different approaches, emit the Decision:
   block (Problem / Checked / Chosen / Rejected) before the first
   implementation tool call — full spec in ~/.agents/AGENTS.md
   "Solution decisions". Negative assumptions require transcript evidence.

Required mapping (authoritative copy lives in ~/.agents/AGENTS.md):
  Coding              -> coding_style.md + coding_style_{typescript,go}.md
  Tests               -> testing/00-index.md
  TDD                 -> coding_style.md + lang file + testing/00-index.md
  Design / analysis   -> engineering_judgment.md (+ using_the_wiki.md if cued)
  Before marking done -> ownership.md
  After writing files -> continuous_improvement.md (section 1)
  Edited instruction artifacts (skills/agents/rules/AGENTS.md)
                      -> instructions-reviewer pass before done

If multiple categories apply, list every relevant file on one "Reading:" line.
</rule-enforcement>
EOF
