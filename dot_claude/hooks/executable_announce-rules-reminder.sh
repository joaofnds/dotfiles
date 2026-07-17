#!/usr/bin/env bash
# UserPromptSubmit hook. Points Claude at the authoritative lifecycle router.

cat <<'EOF'
<rule-routing-reminder>
Follow the task-lifecycle and rule-routing protocol in ~/.agents/AGENTS.md.
</rule-routing-reminder>
EOF
