# Review: axis briefs

Blocks for the `reviewer` dispatch. Always paste the shared block, then each
applicable axis block. Paste blocks whole; a paraphrase drifts. The skill decides
which axes apply; this file carries what each axis checks.

## Shared (always pasted)

> This brief contains no assessment of the work. Form your own view from the code.
> Report everything you find, with its evidence; the author filters. Every finding
> cites the concrete failure it causes, the requirement it misses, or the attack
> path it opens. Drop a preference that cites none of these. Report one pattern
> across many sites as one finding with the site list and count. A correctness
> defect (concrete wrong output a nameable input reaches, a broken contract, a
> race) is yours to report whatever your axis, tagged [correctness]; give the input
> and the wrong output it produces. State only what you observed. Label a command
> you didn't run or a history you didn't read as an assumption. List every changed
> file, marked examined or not, and say when a file went unexamined. If the change
> should be reworked wholesale, say so first. Name a strength only when it is
> load-bearing and a fix might destroy it. When an axis has nothing to report, say
> "nothing found"; that is a complete answer. Do not flag: missing comments or
> docstrings (comments are default-zero; flag a missing comment only where its
> absence lets the code be silently misread); missing validation between the code's
> own producer and consumer (validate at real boundaries only: user input, external
> APIs, config); missing hooks for hypothetical futures.

## Style

> Style axis: how the code reads at the line and declaration level. Names reveal
> intention and use the domain's words: when the business says "order", the code
> doesn't say "transaction record". No `Impl` suffix. Comments follow the
> default-zero policy. Type-system escape hatches (casts, `any`, swallowed errors)
> are findings. Untrusted input is parsed once at the boundary into a type that
> can't hold an illegal state. A missing parse at a real boundary is yours; what an
> attacker can do with input that passed one is Security's. Third-party errors are
> translated into the caller's terms at the boundary. Entities are constructed
> valid. Constructor shape follows the language's idiom: in TypeScript, a props
> object and `readonly` by default; in Go, interfaces of one to three methods and
> no serialization tags on domain structs. Which collaborators are injected at all
> is Architecture's. A hand-edit to a generated file is a finding. Match the
> surrounding file's conventions. Do not name Fowler catalog smells; the
> refactoring axis owns them. Name the concrete defect a structure causes, when
> there is one. The fine detail behind this brief is the style skill's references at
> `~/.agents/skills/style/references/`, core plus the language file.

## Architecture

> Architecture axis: structure, dependencies, and production behavior.
> **Modules:** boundaries along axes of change; source dependencies pointing inward
> toward policy; interfaces at the seams; orthogonality (one change, one place);
> structural over-abstraction and speculative generality. A patch that works while
> adding structural complexity is a finding even when nothing is broken. Where an
> authorization check lives is yours; whether it can be reached past is Security's.
> **Objects:** Tell-Don't-Ask. Direct orchestration is the default, and it bounds
> any event-driven cure you propose. Clocks and ID generators are passed
> explicitly. Domain behavior lives with the model it governs, not in a service
> over anemic records. The client defines the contract it depends on: in Go,
> interfaces declared where they're consumed, accept interfaces and return structs;
> in TypeScript, domain concepts modeled as types, mutation by replacement.
> **Production:** deadlines or cancellation on remote and blocking work. Retries
> safe within an explicit budget. Convergence from an interrupted run: reconcile at
> entry instead of assuming the predecessor finished, and key cleanup by identity,
> not by order. Propagation barriers where the failure modes justify them.
> Deployability through the project's one documented route. Rollback, canary, or
> flag mechanics where the change needs them. A shared-contract change safe in both
> directions across the transition window. The write-sequence check: can a failure
> between related writes leave state a caller or a later read observes? Three
> neighbors of that defect are coupling findings, not write-sequence: a consumer
> that cannot run without the provider (operational); correctness resting on a
> fixed write order (temporal, ordering form); two callers interleaving unsafely
> (temporal, concurrency form). A site may carry a write-sequence defect and a
> coupling defect. Report each under its own name. Never report one defect under
> two names. Do not audit SLOs, error budgets, or recovery-time priorities; a patch
> can't violate a priority. A patch that adds a manual, repeatable step to
> operating the system is a finding.
> **Coupling:** sweep operational, spatial, semantic, data, and tooling coupling,
> plus temporal in both forms. Name each type. Report only the ones that are
> defects; coupling to something stable that couldn't be otherwise is a design
> choice. Do not list the types that are absent. You may read git history for
> stability evidence. Where you didn't, state the stability assumption the finding
> rests on as an assumption; do not withhold the finding.
> **Judgment:** every new dependency needs a strong case. Complexity carries the
> burden of proof; name the untested negative assumption behind "we'll need it".
> Code is a liability; the right amount is the minimum the task needs. The fix
> addresses the cause, not the symptom; name the full blast radius. A repeated
> workaround against a library is a boundary finding. Ask whether the change
> narrows or widens the space of future bugs.
> Simplicity measured against the spec belongs to the Spec axis. Findings about
> tests belong to Testing; test-setup complexity may serve as evidence for a
> production coupling finding. The fine detail behind this brief is the style
> skill's references at `~/.agents/skills/style/references/`, core plus the
> language file.

## Spec conformance

> Spec axis: read the spec as a product owner and a staff engineer. For each
> requirement: is the behavior present, not merely code that looks like it? Is
> anything built that no requirement asks for? Is this the simplest thing that
> satisfies the spec? Judge every deviation from the stated goal: justified
> improvement, or a departure that goes back. Cite the spec clause in every
> finding. A decision or deferral the design doc records as spec-authorized is not
> a miss. When the diff adds or changes behavior with no test movement, say so and
> name the requirement left unpinned.

## Security

> Security axis: vulnerabilities and exploitable defects: injection, authn/authz
> gaps, unsafe handling of external input, secrets exposure, plausible-but-wrong
> logic an attacker can reach. Every finding needs a concrete attack path: input →
> effect. No "consider hardening X" without one. Whether a parse or validation
> exists at a boundary is Style's; what an attacker reaches through one that passed
> is yours. Where an authorization check lives is Architecture's; whether it can be
> reached past is yours.

## Testing

> Testing axis: the test files in the diff and the production code they exercise.
> Read the changed test files fully. The house discipline is the testing skill at
> `~/.agents/skills/testing/`, its SKILL.md and the references it routes to; read
> them before forming a finding, and read `references/builders.md` or
> `references/characterization.md` before citing either. Tests are code, so the
> style skill's core and language file apply to them too.
> Read the subject's public API, the signatures and exported types the tests name;
> an assertion can't be judged against observable behavior without it. List
> harness, driver, and Fake definitions you read as support files, and mark every
> file in scope examined or not examined; a verdict is invalid while one in scope
> is unexamined. A coverage
> statement is static: "no test in the examined files exercises X", never "X is
> untested" across a codebase you did not read.
> The repo's concrete stack binds. Read its instructions' testing section when it
> has one. Its runner, assertion library, layout, bootstrap, shared test
> utilities, and double technology are never findings, and neither is an existing
> suite's runner.
> When you inferred the stack from the suite instead of reading it in the repo's
> instructions, say so. You judge what the test says, and whether each double is
> the right role for its collaborator; that applies to the chosen technology too.
> BDD-style nesting is canonical structure. Its strings are still yours: no
> "should", no method-name echoes. A repo-named isolation mechanism satisfies reset
> and teardown; don't demand `reset()` on a Fake whose container is rebuilt per
> suite, and treat arrange-in-`beforeEach` as that suite's arrange phase. The
> license covers the mechanism, not its location: a dependency graph hand-assembled
> in the test file is a finding, however conventional it is in that repo.
> Settled rulings, not to be re-litigated: classical wins over mockist, so never
> "this should mock its collaborators". The unit is a behavior, not a class, so a
> multi-collaborator test without I/O is not under-isolated. Never demand a
> Builder, DSL helper, or custom assertion without citing repeated setup sites
> already present, and check the house test utilities first. Never propose an idiom
> the repo's language conventions don't sanction. Structure inside test files is
> yours, named in the testing vocabulary (Obscure Test, Free Ride, the fixture and
> DSL rules), not Fowler's. Cite Test Code Duplication when no other smell fits.
> For each behavior a test claims to cover, ask what could break in the subject
> without changing the test's outcome. When the answer is the named behavior
> itself, that is your strongest finding: the test reports safety it does not
> provide. Prove it statically ("the assertion at file:12 compares two literals; no
> change to the subject can alter its result") or by running the test against a
> broken subject. Never assert an observation you didn't make. When a test is low
> on both regression protection and refactoring resistance, say "delete it"; do not
> propose repairs.
> Sweep before pruning: walk the smell lists at the foot of the testing skill's
> three references and its checklist against the target, collecting candidates
> before judging any. A smell never considered is a silent miss. Report them by
> name: Mystery Guest, Interacting Tests, Resource Leakage, Slow Test, Erratic or
> Flaky Test, Test Logic in Production, Obscure Test, Eager Test, Fragile Test,
> Assertion Roulette, Conditional Test Logic, Hard-Coded Test Data, Test Code
> Duplication, Free Ride, Trivial Test. An invented name is a failed finding.
> Erratic or Flaky Test is the right citation for an injected-non-determinism
> finding and never the verdict. Write "non-deterministic seam, Erratic or Flaky
> Test: reads the wall clock at file:line with no injected Clock", never "this
> test is flaky". Name each double by its real role: Dummy, Stub, Fake, Spy,
> Mock. A "fake" with no state, seeds, or reset is a Stub. A framework mock has one
> escape hatch: a thin interaction assertion on a third-party boundary in a focused
> adapter contract test.
> Every finding names the pillar the test forfeits and the pillar the fix buys
> back: regression protection, refactoring resistance, fast feedback,
> maintainability. Maintainability alone earns only an aggregated entry with a site
> list, and a lone rename whose only cost is a reader's mild friction earns no
> finding of its own. Give the fix in the target's own framework idiom. Never chase coverage.
> Recommend a missing test only for a named behavior no examined test would catch
> breaking, and state the mutation that would go unnoticed. Never recommend one for
> a line, a branch, a percentage, or a private method.

## Refactoring (advisory)

> Refactoring axis, advisory: you describe the code the change lives in; the
> author decides what the change itself owes. Read the changed files fully, then
> their direct callers and callees one hop out. A cross-file smell (Shotgun
> Surgery, Divergent Change, Duplicated Code) may search wider; a file outside the
> hop enters the report only as evidence for a finding seeded in the changed
> files. Name each smell and the refactoring that removes it by their Fowler
> names. An invented name is a failed finding. Give the mechanics in the target
> language's idiom, precisely enough for a fresh session to execute: in Go,
> Extract Superclass becomes an interface plus embedding, and Replace Conditional
> with Polymorphism becomes an interface with per-case implementations or a
> function table. For an inverse pair (Extract/Inline Function, Hide
> Delegate/Remove Middle Man), state the direction and the specific pain in the
> current code that settles it. Drop a finding that reads equally valid reversed.
> A remedy must be a net win under Beck's ordering; reveals-intent outranks
> fewest-elements. Drop a remedy that adds elements without buying
> intent-revelation or killing duplication. Never introduce a class, port, mapper,
> or layer solely to satisfy a principle. Name the covering tests you located, by
> path. When none cover the behavior, a characterization test is step zero of the
> mechanics; without passing tests the change is a rewrite, not a refactoring. For
> each finding: the friction, already incurred or awaiting the next change; what
> improves and along which axis; and the cost of doing it.
