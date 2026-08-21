#!/usr/bin/env bash
# Structural verification of dot_agents/rules/refactoring/ — the seven checks in
# .boris/plans/2026-07-24-refactoring-specialist-agent-1-catalog-corpus.md §7.
#
# Usage: verify-refactoring-catalog.sh [--partial]
#   --partial  during corpus build-out: missing documents and unresolved index
#              links are reported, not failed; structural violations in files
#              that exist still fail.
set -u

partial=false
[ "${1:-}" = "--partial" ] && partial=true

root="$(cd "$(dirname "$0")/.." && pwd)"
tree="$root/dot_agents/rules/refactoring"
catalog="$tree/catalog"
index="$tree/00-index.md"

canonical="Extract Function
Inline Function
Extract Variable
Inline Variable
Change Function Declaration
Combine Functions into Class
Combine Functions into Transform
Split Phase
Move Function
Move Field
Move Statements into Function
Move Statements to Callers
Slide Statements
Split Loop
Replace Loop with Pipeline
Remove Dead Code
Split Variable
Rename Field
Rename Variable
Replace Derived Variable with Query
Change Reference to Value
Change Value to Reference
Replace Magic Literal
Encapsulate Variable
Encapsulate Record
Encapsulate Collection
Replace Primitive with Object
Replace Temp with Query
Extract Class
Inline Class
Hide Delegate
Remove Middle Man
Decompose Conditional
Consolidate Conditional Expression
Replace Nested Conditional with Guard Clauses
Replace Conditional with Polymorphism
Introduce Special Case
Introduce Assertion
Replace Control Flag with Break
Replace Error Code with Exception
Replace Exception with Precheck
Replace Inline Code with Function Call
Substitute Algorithm
Separate Query from Modifier
Parameterize Function
Remove Flag Argument
Preserve Whole Object
Replace Parameter with Query
Replace Query with Parameter
Remove Setting Method
Replace Constructor with Factory Function
Replace Function with Command
Replace Command with Function
Return Modified Value
Introduce Parameter Object
Pull Up Method
Pull Up Field
Pull Up Constructor Body
Push Down Method
Push Down Field
Extract Superclass
Collapse Hierarchy
Remove Subclass
Replace Subclass with Delegate
Replace Superclass with Delegate
Replace Type Code with Subclasses"

smells="Mysterious Name
Duplicated Code
Long Function
Long Parameter List
Global Data
Mutable Data
Divergent Change
Shotgun Surgery
Feature Envy
Data Clumps
Primitive Obsession
Repeated Switches
Loops
Lazy Element
Speculative Generality
Temporary Field
Message Chains
Middle Man
Insider Trading
Large Class
Alternative Classes with Different Interfaces
Data Class
Refused Bequest
Comments"

failures=0
fail() { echo "FAIL: $*"; failures=$((failures + 1)); }
note() { echo "$*"; }
kebab() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-'; }

[ -d "$catalog" ] || { fail "catalog directory $catalog does not exist"; exit 1; }
[ -f "$index" ] || { fail "index $index does not exist"; exit 1; }

# 1 — exactly 66 documents
count=$(find "$catalog" -name '*.md' | wc -l | tr -d ' ')
if [ "$count" -eq 66 ]; then
  note "check 1: 66 documents present"
elif $partial; then
  note "check 1: $count/66 documents present (partial)"
else
  fail "check 1: expected 66 documents, found $count"
fi

# 2 — filenames are exactly the kebab-cased canonical names
missing=0
while IFS= read -r name; do
  if [ ! -f "$catalog/$(kebab "$name").md" ]; then
    missing=$((missing + 1))
    $partial || fail "check 2: missing $(kebab "$name").md"
  fi
done <<EOF
$canonical
EOF
expected_files=$(while IFS= read -r name; do printf '%s\n' "$(kebab "$name")"; done <<EOF
$canonical
EOF
)
for f in "$catalog"/*.md; do
  [ -e "$f" ] || continue
  base=$(basename "$f" .md)
  printf '%s\n' "$expected_files" | grep -Fxq "$base" \
    || fail "check 2: $base.md is not a canonical catalog entry"
done
$partial && note "check 2: $missing canonical documents not yet written"

# 3–6 — per-document structure
for f in "$catalog"/*.md; do
  [ -e "$f" ] || continue
  base=$(basename "$f")

  for field in '**Smells:**' '**Inverse:**' '**Improves:**'; do
    grep -Fq "$field" "$f" || fail "check 3: $base missing $field"
  done
  for heading in '## When to apply' '## When not to apply' '## Mechanics' '## Example' '## House-rule interactions'; do
    grep -Fxq "$heading" "$f" || fail "check 3: $base missing '$heading'"
  done

  lines=$(wc -l < "$f" | tr -d ' ')
  { [ "$lines" -ge 40 ] && [ "$lines" -le 80 ]; } \
    || fail "check 4: $base is $lines lines (must be 40-80)"

  inverse=$(sed -n 's/^\*\*Inverse:\*\* //p' "$f" | head -1)
  if [ -n "$inverse" ] && [ "$inverse" != "none" ]; then
    if printf '%s\n' "$canonical" | grep -Fxq "$inverse"; then
      counterpart="$catalog/$(kebab "$inverse").md"
      if [ -f "$counterpart" ]; then
        back=$(sed -n 's/^\*\*Inverse:\*\* //p' "$counterpart" | head -1)
        name=$(sed -n 's/^# //p' "$f" | head -1)
        [ "$back" = "$name" ] || fail "check 5: $base names Inverse '$inverse' but $(basename "$counterpart") names Inverse '$back'"
      else
        $partial && note "check 5: $base Inverse '$inverse' not yet written; symmetry unchecked" \
          || fail "check 5: $base Inverse '$inverse' document missing"
      fi
    else
      fail "check 5: $base Inverse '$inverse' is not a catalog entry"
    fi
  fi

  smell_line=$(sed -n 's/^\*\*Smells:\*\* //p' "$f" | head -1)
  if [ -n "$smell_line" ]; then
    bad=$(printf '%s\n' "$smell_line" | tr ',' '\n' | sed 's/^ *//; s/ *$//' \
      | grep -Fxv -f <(printf '%s\n' "$smells") || true)
    if [ -n "$bad" ]; then
      while IFS= read -r s; do
        fail "check 6: $base names unknown smell '$s'"
      done <<EOF
$bad
EOF
    fi
  fi
done

# 7 — index links resolve and cover all 66
links=$(grep -o 'catalog/[a-z0-9-]*\.md' "$index" | sort -u)
unresolved=0
while IFS= read -r link; do
  [ -z "$link" ] && continue
  if [ ! -f "$tree/$link" ]; then
    unresolved=$((unresolved + 1))
    $partial || fail "check 7: index link $link does not resolve"
  fi
done <<EOF
$links
EOF
unlinked=0
while IFS= read -r name; do
  file="catalog/$(kebab "$name").md"
  if ! printf '%s\n' "$links" | grep -Fxq "$file"; then
    unlinked=$((unlinked + 1))
    $partial || fail "check 7: $file not linked from index"
  fi
done <<EOF
$canonical
EOF
note "check 7: $unresolved unresolved index links, $unlinked catalog entries unlinked"

# 8a — catalog citations name a rule, never a line. A line-anchored citation cannot
# survive an edit to the target: it keeps resolving, but to a different rule, and no
# reader can tell. (Enforced 2026-07-27, after every coding-style.md:N citation in the
# catalog had drifted 2-5 lines and the 8 engineering-judgment.md tail citations 1.)
lineno_cited=$(grep -rhoE '`(coding-style|engineering-judgment)\.md:[0-9]+`' "$catalog" | sort -u)
lineno_count=0
while IFS= read -r citation; do
  [ -z "$citation" ] && continue
  lineno_count=$((lineno_count + 1))
  fail "check 8a: line-anchored citation $citation — cite the rule by name instead"
done <<EOF
$lineno_cited
EOF

# 8b — every house rule the catalog cites still exists in its manifesto. Presence, not
# position: moving a rule is free, renaming or deleting one fails here and the citing
# documents need re-wording. Table: <file>|<substring the file must still contain>.
rule_anchors=$(cat <<'ANCHORS'
coding-style.md|Preserve established project structure
coding-style.md|Do not introduce classes
coding-style.md|solely to satisfy this document
coding-style.md|Simplicity, by Beck's four criteria
coding-style.md|Boring control flow
coding-style.md|Comments default to zero
coding-style.md|Move understanding from your head into the code
coding-style.md|Never the `Impl` suffix
coding-style.md|Surgical execution
coding-style.md|Leverage the type system
coding-style.md|Don't defend against your own code
coding-style.md|Pure structural types
coding-style.md|Behavior lives with data
coding-style.md|Explicit construction
coding-style.md|Framework-agnostic constructors
coding-style.md|Defensive networking
coding-style.md|Safe parsing at boundaries
coding-style.md|Stateless, non-mutating translators
coding-style.md|thin translation layer
coding-style.md|Tell, Don't Ask
coding-style.md|Control non-deterministic side effects
coding-style.md|Put domain behavior with the model it governs
coding-style.md|Generic utilities carve-out
coding-style.md|Inject side-effecting or replaceable dependencies
engineering-judgment.md|Facts before theories
engineering-judgment.md|Name things in the domain's language
engineering-judgment.md|Never program by coincidence
engineering-judgment.md|Draw boundaries at the demonstrated cost inflection
engineering-judgment.md|Dependencies point inward
engineering-judgment.md|Program to interfaces, encapsulate what varies
engineering-judgment.md|Match complexity to the problem
engineering-judgment.md|Design for the current need
engineering-judgment.md|Complexity carries the burden of proof
engineering-judgment.md|Work in the smallest coherent steps
engineering-judgment.md|Code is a liability
engineering-judgment.md|Make the change easy
engineering-judgment.md|DRY is about knowledge, not code
engineering-judgment.md|Orthogonality: one change, one place
engineering-judgment.md|Listen to the tests
engineering-judgment.md|Prefer removing the cause
engineering-judgment.md|narrows the space of future bugs
engineering-judgment.md|Don't fight your tools
ANCHORS
)

anchors_checked=0
while IFS='|' read -r target token; do
  [ -z "$target" ] && continue
  anchors_checked=$((anchors_checked + 1))
  grep -Fq "$token" "$root/dot_agents/rules/$target" \
    || fail "check 8b: $target no longer contains '$token' — a cited house rule was renamed or deleted; re-word the citing catalog documents"
done <<EOF
$rule_anchors
EOF
note "check 8: $anchors_checked cited house rules checked, $lineno_count line-anchored citations"

if [ "$failures" -eq 0 ]; then
  note "OK"
  exit 0
else
  note "$failures failure(s)"
  exit 1
fi
