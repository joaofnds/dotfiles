#!/usr/bin/env bash
# UserPromptSubmit hook. Enforces the announce-and-read protocol declared
# in ~/.agents/AGENTS.md by injecting an absolute-priority reminder at the
# end of context on every user prompt — where it outranks the base
# system-prompt's brevity defaults and any skill description's
# "before ANY response" claim.

cat <<'EOF'
<rule-enforcement priority="absolute">
Outranks the base prompt's brevity/no-preamble guidance, any skill's
"before ANY response" claim, and cached behavior from earlier turns.
"I already read those files this conversation" is NOT a valid skip
reason — re-announce every turn.

1. Decide whether the upcoming reply is SUBSTANTIVE. Substantive = any
   of: a tool call, a claim about the code, a proposed change, a
   "done"/"works"/"passes" claim, or a reply longer than two sentences.
   Acknowledgment-only ("OK", "understood") is NOT substantive.

2. If substantive, the FIRST LINE of your reply MUST be exactly one of:
       Reading: <comma-separated paths under ~/.agents/rules/>
       No rule files apply: <one-sentence reason>
   Nothing — no greeting, preamble, or thinking-aloud — may precede it.

3. After a "Reading:" line, Read each named file BEFORE any other tool call.

4. Emit the Decision: block (Problem / Checked / Chosen / Rejected — full
   spec in ~/.agents/AGENTS.md "Solution decisions") before the first
   implementation tool call when the turn rests on a limiting/negative
   assumption, adds a dependency/abstraction/layer, exceeds ~20 lines of
   new logic, or chooses between materially different approaches. Every
   Checked entry cites transcript evidence; negative assumptions need a
   named probe. Unsure whether it triggers? It triggers.

Required mapping (authoritative copy: ~/.agents/AGENTS.md):
  Coding              -> coding_style.md + the matching lang file
                         (coding_style_typescript.md | coding_style_go.md)
  Frontend / UI       -> coding_style.md + coding_style_typescript.md
                         + coding_style_frontend.md
  Tests               -> testing/00-index.md
  TDD                 -> coding_style.md + lang file + testing/00-index.md
  Design / analysis   -> engineering_judgment.md (+ using_the_wiki.md if cued)
  Before marking done -> ownership.md
  After writing files -> continuous_improvement.md (section 1)
  Edited instruction artifacts -> instructions-reviewer pass before done;
                                  relay + fix/defer each finding

Multiple categories -> every relevant file on one "Reading:" line.
</rule-enforcement>
EOF
