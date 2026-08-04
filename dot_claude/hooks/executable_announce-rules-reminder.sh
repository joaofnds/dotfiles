#!/usr/bin/env bash
# UserPromptSubmit hook. Marks that a phase boundary may have opened, and points
# at the file that owns the rules.
#
# Deliberately does NOT restate the announcement mechanics, or even enumerate the
# opener forms. Two earlier versions each drifted from AGENTS.md within one edit:
# the first narrowed the `Reading:` line by dropping "plus ~/.agents/workflows.md
# when applicable"; the second enumerated two openers and omitted the `Gate:` line,
# which is the wrong one to omit on the turn right after an instruction-file edit.
# AGENTS.md owns the routing table; this hook owns only the reminder that a phase
# boundary exists.

cat <<'EOF'
<rule-routing-reminder>
~/.agents/AGENTS.md §Task lifecycle governs this session and owns these rules.
A new phase opens the reply with the announcement line §Task lifecycle requires for it.
</rule-routing-reminder>
EOF
