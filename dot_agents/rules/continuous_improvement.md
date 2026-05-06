# Continuous Improvement (Kaizen)

Each completed task must leave the system — code, tests, tooling, workflow — in a state where the *next* task is easier than this one was. If you finish a task and the process is no better, you did half the job.

Kaizen is the **posture**; **PDCA** is the **loop**. Set a standard → apply kaizen guided by PDCA → successful experiments raise the standard → repeat. The standard is never permanent; it's the baseline the next cycle improves on. *(See: kaizen, pdca, toyota-production-system)*

Not refactoring for its own sake. Not gold-plating. Not automating a five-minute one-off. The disciplined habit of noticing friction, finding the root cause, and making a surgical fix — now if cheap, flagged with concrete scope if not.

When the background matters, query the wiki — see `using_the_wiki.md`.

## 1. Post-Task Reflection (Mandatory)

After every non-trivial task, output a **visible reflection block** to the engineer. This is a deliverable, not an internal check. The engineer must be able to see it, push back on it, or call out when it is missing. Silent reflection is the failure mode that lets defects compound across sessions.

Cover these five questions. One short line each — longer if meaningfully load-bearing. If an item has no content, say "none" explicitly rather than omitting the line (the structure is the signal):

1. **What was harder than expected?** Identify the specific point of friction.
2. **Was anything done twice?** Repeated work is muda — what would eliminate the repetition?
3. **Did I make any incorrect assumptions?** What information was missing, and where should it live?
4. **Is there a follow-up improvement?** State it with the five-point frame (§3): friction, root cause, fix, benefit, cost.
5. **Should any memory files be updated?** Capture new patterns, conventions, or corrections — or say "none".

Keep it tight. If it balloons past ~20 lines, you are padding. Skipping the block is a process defect equivalent to skipping a test — the engineer is expected to call it out.

## 2. Friction Detection During Work

When friction surfaces mid-task:

1. **Acknowledge it internally.** Note what it is and keep working — don't derail the task.
2. **Assess severity.** One-time annoyance, recurring pattern, or blocking?
3. **One-time** → ignore. Not everything needs fixing.
4. **Recurring** → fix inline if trivial (under 2 minutes, zero risk). Otherwise note for post-task reflection.
5. **Blocking** → fix now. Treat the fix as a first-class change with verification, not a throwaway hack.

**Failure signals are the entry point.** High-velocity orgs see them and act; low-velocity orgs normalize them and walk by. The default failure mode is *not seeing*. *(See: the-high-velocity-edge, capability-2-problem-solving-and-improvement)*

### Friction signals to watch for

- **Repeated manual steps** — same sequence twice = candidate for automation.
- **Copy-paste across files** — missing abstraction or missing single source of truth.
- **Hesitation** — "where does this go?" / "how does this work again?" means structure or naming isn't communicating.
- **Workarounds** — writing code to work around a limitation of your own system means the limitation is the real problem.
- **Slow feedback** — waiting more than a few seconds for results on the code you just changed.
- **Context switching** — one logical change touching many unrelated files means coupling or co-location is wrong.
- **"I'll fix it later"** — fix it now, or capture it concretely so "later" actually happens.

## 3. How to Suggest an Improvement

Every improvement suggestion must include all five points:

1. **Friction.** What specific problem did you encounter? Name file, line, step.
2. **Root cause.** Why does this exist? Missing abstraction, wrong convention, tooling gap?
3. **Proposed fix.** Specific change — "extract Y into Z, eliminating duplication in A, B, C", not "we should improve X".
4. **Expected benefit.** What does the world look like after? How much friction does it save, for how many future tasks?
5. **Cost.** How long, what's the risk, what could go wrong?

If you cannot fill all five, don't suggest yet — wait until you can.

### Timing

- **Immediately** — small (under 5 min), directly relevant, no side-effect risk. *"This pattern is duplicated — I'll extract it into a shared helper."*
- **After the task** — medium-sized, relevant but not blocking. *"The test setup for this module has 20 lines of boilerplate that could be extracted. Want me to follow up?"*
- **As a flag** — large, cross-cutting, requires architectural decisions. *"The event emitter pattern is used in 6 modules with slight variations. A unified abstraction might be worth considering — I can draft a proposal."*
- **Don't** — speculative, not grounded in observed friction, would distract from urgent work. The engineer's focus is sacred.

## 4. Root Cause Analysis (Five Whys)

The XP corollary practice (Beck via Ohno): *every time a defect is found after development, eliminate the defect AND its cause.* *(See: root-cause-analysis-five-whys, taiichi-ohno)*

When something goes wrong:

1. **Fix the immediate problem.** The engineer needs to keep moving.
2. **Ask "why?" until you reach a systemic cause.** Five iterations is the rule of thumb; stop when you reach something you could change with code, config, or convention.
3. **Determine the class of problem.** One-off mistake, or could it happen again? What conditions would trigger it?
4. **Propose a systemic fix** using the five-point frame.
5. **If the systemic fix is small, do it now.** A missing memory entry, an overlooked test edge case, a clearer variable name — just fix it. Don't ask permission for obviously correct improvements.

Example: deploy fails → migration syntax error → no validation step exists → migrations were ad-hoc → no convention was formalized. The fix is "add migration validation to CI and document the convention", not "fix the syntax error".

Ask "*how did the system allow this?*" not "*who did this?*" Blame drives hiding; learning drives improvement. *(See: blameless-postmortem)*

## 5. Improvement Sizing

| Size | Time | Risk | Action |
|---|---|---|---|
| **Trivial** | < 2 min | None | Do it now, mention briefly |
| **Small** | 2–10 min | Low | Do it now if within current task scope, otherwise propose as immediate follow-up |
| **Medium** | 10–60 min | Medium | Propose after task completion with concrete scope |
| **Large** | > 1 hour | Variable | Flag with a specific proposal; do not attempt without explicit go-ahead |

## 6. Local vs Systemic Improvements

Local optimization makes one part better — sometimes at the cost of the whole. Systemic improvement reduces friction for *future* work, not just current.

- **Local** — one module faster at the cost of readability; caching that introduces stale-data bugs; a helper that saves time in one place but adds a dependency everyone must learn; a test sped up by reducing coverage.
- **Systemic** — extracting a pattern duplicated across three modules; a pre-commit hook that catches a class of error before CI; restructuring a test to use Fakes instead of real infrastructure; updating a memory file so the same mistake never recurs.

Test before acting: does this make the *system* better, or just this *part* better? If just this part, verify it doesn't degrade the whole.

For systemic moves, the **Improvement Kata** is the routine: (1) understand the direction / vision, (2) grasp the current condition, (3) establish the next target condition, (4) iterate toward the target via PDCA cycles, learning from obstacles. *(See: improvement-kata, toyota-kata-rother-2010)*

## 7. Anti-Patterns

- **Perfectionism.** Goal is *better*, not *perfect*. Ship and iterate.
- **Scope creep.** Refactoring an entire module because one name was inconsistent is distraction, not Kaizen.
- **Bikeshedding.** Don't spend 20 minutes debating `buildX` vs `createX`. Choose, move on, standardize.
- **Busywork.** If the process is working, don't manufacture improvements. Sometimes the best improvement is none.
- **Ignoring priorities.** The task comes first. Improvements serve it; they don't replace it.

## 8. Cheat Sheet

- **Just finished a task?** Run the post-task reflection (§1).
- **Hit friction during work?** Classify it: one-time, recurring, or blocking. Act accordingly (§2).
- **Something went wrong?** Fix it, then Five Whys, then propose a systemic fix (§4).
- **About to suggest an improvement?** All five points present (friction, root cause, fix, benefit, cost)? If not, don't suggest — wait until you can.
- **Improvement small enough to do now?** Trivial / small: do it. Medium / large: propose it (§5).
- **System or just part?** Systemic over local (§6).
- **Process or just code?** Both count. A better test helper, a better memory file, a better commit convention — all Kaizen.
- **Overdoing it?** If speculative or derailing — stop. The task comes first.
- **Did I see a failure signal and walk past it?** That's the low-velocity move. Stop and act.

---

## Appendix: Background

The Toyota tradition this draws from. Reference, not required reading per task. For depth: query the wiki on `kaizen`, `pdca`, `toyota-production-system`, `the-high-velocity-edge`, `improvement-kata`.

### PDCA cycle (Shewhart / Deming)

Plan → Do → Check → Act. Plan: identify the problem precisely, propose a specific change, scope small. Do: execute. Check: verify the friction actually dropped, no regressions. Act: standardize what worked (update memory, encode in tooling) or roll back what didn't. The operational form of Deming's *theory of knowledge* lens.

### The Three M's: Muda, Mura, Muri (Ohno)

Three forms of waste under TPS — *muda* is the one most cited but the others matter equally.

- **Muda** — non-value-adding work. Below.
- **Mura** — unevenness. Bursty load, inconsistent batch sizes, irregular cadence.
- **Muri** — overburden. Pushing people, processes, or systems beyond sustainable capacity.

The seven *muda* in software:

| Waste | Software analog | Spot it |
|---|---|---|
| Overproduction | Code, abstractions, configs nobody asked for | Can't point to the specific need |
| Waiting | Slow CI, slow tests, slow deploys blocking work | Engineer context-switching, frustration |
| Transportation | Same value in multiple files; manual sync between systems | A change requires updating N places |
| Over-processing | Validation where types already guarantee; full suite when one module changed | Effort disproportionate to value |
| Inventory | Unmerged branches, unshipped code, large stale PRs | Branches older than a day; "done" but not deployed |
| Motion | Extra steps in a workflow; cross-tool navigation for one task | More steps than the task logically needs |
| Defects | Bugs, regressions, misunderstood requirements | Work redone; bug found late |

Inventory deserves attention: in software, *deployment frequency is the reciprocal of batch size* (DORA). Long-lived branches and large PRs are the visible inventory. *(See: dora-accelerate-metrics)*

### Improvement Kata (Rother)

The four-step learner's routine Toyota uses to continuously improve:

1. Understand the direction / vision (where are we headed?).
2. Grasp the current condition (what's actually happening now?).
3. Establish the next target condition (what does "better" look like in the next iteration?).
4. Iterate toward the target via PDCA cycles, learning from obstacles.

The IK *operates over* muda/mura/muri — naming the waste and naming the next target are different moves. *(See: improvement-kata, mike-rother)*
