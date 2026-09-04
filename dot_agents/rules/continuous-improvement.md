# Continuous Improvement (Kaizen)

Improve recurring friction when evidence and task scope justify it. Do not turn every
task into a process project: the requested outcome comes first, and a clean run needs no
manufactured improvement. *(See: kaizen, pdca, toyota-production-system)*

## 1. Post-Task Reflection

After a non-trivial task that exposed recurring or blocking friction, include a short
visible reflection. Omit it when no actionable improvement was found.

Every proposed improvement states:

1. **Friction**: the observed event, command, or location.
2. **Root cause**: the system condition that produced it, not who caused it.
3. **Fix**: the smallest concrete change that removes the cause.
4. **Benefit**: the future repetition or failure it prevents.
5. **Cost**: effort, risk, and scope.

Do not propose an improvement until all five are known.

## 2. During Work

Classify friction without derailing the task:

- **One-time:** ignore it unless it reveals a defect.
- **Recurring:** fix it now only when it is in scope, low risk, and cheaper than carrying
  it; otherwise record it for the reflection.
- **Blocks the task** (not the `reporting-findings.md` disposition): resolve it as first-class work
  with its own verification, or surface the blocker and ask.

Signals worth investigating include repeated manual steps, the same knowledge copied
across files, slow feedback, recurring uncertainty about placement, and workarounds for
limitations in a system we control. These are prompts to investigate, not automatic
authorization to add an abstraction or tool.

## 3. Root Cause and PDCA

When a defect appears:

1. Restore the feedback loop so work can continue.
2. Ask why until reaching a changeable system condition.
3. Decide whether the condition can produce the same class of defect again.
4. State the smallest systemic change, its predicted observable effect, and the
   strongest mechanism that can carry it. Rank mechanisms: make the bad state
   unrepresentable, then a lint, a banned API, or automation that removes the step, then
   a canonical helper, then a test or a runtime check, then prose. Name prose only after saying which stronger mechanism
   you ruled out and why; a rule a check could enforce belongs in the check.
5. Apply exactly one bounded change within the user's scope; otherwise ask before
   expanding the work.
6. Compare the observation with the prediction and adopt, revise, or discard the change.
   If adopted, verify that it created no new friction, then encode the successful
   standard at the mechanism step 4 named.

Query `using-the-wiki.md` when the background would affect the decision.

## 4. System Over Part

Prefer changes that improve the whole feedback loop over local optimizations that move
cost elsewhere. Faster tests with weaker behavior coverage, a helper used once, or a
cache with unclear invalidation may optimize one part while degrading the system.

Sometimes the correct improvement is no change.
