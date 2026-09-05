# Review: axis briefs

Blocks for the `reviewer` dispatch. Paste the shared block, then the one axis block
that reviewer owns. Paste blocks whole, because a paraphrase drifts. The skill
decides which axes run, and this file carries what each axis reads and what it
checks.

## Shared (always pasted)

> This brief contains no assessment of the work. Form your own view from the code.
> Your axis block names the house standard for your axis. Read every file it names
> whole before forming a finding, and judge against those rules, never against
> general practice, because they encode choices a capable reader would not make
> unprompted. Then read the goal. Then read every changed file whole, not only its
> hunks. Then take the diff hunk by hunk with the standard in front of you. Walk its
> headings, and its lists of smells and checks item by item, before you judge
> anything, because a rule never considered is a silent miss. After the standard,
> walk the "Not findings" section of the review skill's wiki checks at
> `~/.agents/skills/review/references/wiki-checks.md`, and your axis's section
> where the file has one. A line there is a prompt to look, and the standard wins
> where they differ.
> Test files are the Testing axis's to judge. Every other axis reads them as
> evidence, and reports a defect in one only when it is [correctness].
> Correctness comes before your axis. A concrete wrong output a nameable input
> reaches, a broken contract, or a race is yours to report whatever your axis,
> tagged [correctness], with the input and the wrong output it produces.
> Report everything you find, with its evidence. The author filters. Every finding
> cites the rule it rests on, by file and heading, or the concrete failure it
> causes, the requirement it misses, or the attack path it opens. Drop a preference
> that cites none of these. Report one pattern across many sites as one finding with
> the site list and count. State only what you observed. Label a command you didn't
> run or a history you didn't read as an assumption. The author has run the suite
> and holds the result. Run a single test only to prove or refute a finding, and
> name the command.
> Open your report with the standard files you read and every changed file, each
> marked examined or not. Your verdict does not cover a file you did not examine, so
> say so. If the change should be reworked wholesale, say so next. Name a strength
> only when it is load-bearing and a fix might destroy it. When your axis has
> nothing to report, say "nothing found" and what you checked. That is a complete
> answer. Do not flag: missing comments or docstrings (comments are default-zero, so
> flag a missing comment only where its absence lets the code be silently
> misread); missing validation between the code's own producer and consumer
> (validate at real boundaries only: user input, external APIs, config); missing
> hooks for hypothetical futures.

## Spec conformance

> Spec axis. Your standard is the goal itself. No house file stands behind this
> axis beyond the wiki checks' Spec section, which you walk as every axis does.
> Read the goal as a product owner and a staff engineer: the card's description and
> acceptance criteria, the design document, and João's words where the brief
> carries them. Account for it line by line. For each requirement and each
> acceptance criterion, write present, partial, or absent, with the code path that
> satisfies it and the test that pins it, or "no test" where none does. Present
> means the behavior is there, not code that looks like it. Then look the other
> way. Name what the diff does that no requirement asks for, and say whether this
> is the simplest thing that satisfies the goal. Judge every deviation from the
> stated goal as a justified improvement or a departure that goes back. Cite the
> clause in every finding. A decision or deferral the design doc records as
> spec-authorized is not a miss. When the diff adds or changes behavior with no test
> movement, say so and name the requirement left unpinned.

## Style

> Style axis: how the code reads at the line and declaration level. Your standard
> is the coding style under `~/.agents/rules/`: `coding-style.md`, every language
> file that matches the diff (`coding-style-go.md`, `coding-style-typescript.md`),
> `coding-style.md` alone where none matches, and `coding-style-frontend.md` on top
> when the diff builds UI, plus the "Code craft" section of the doctrine at
> `~/.agents/skills/doctrine/principles.md`. Names use the domain's words: when the
> business says "order", the code doesn't say "transaction record". A swallowed
> error is a type-system escape hatch and a finding. An entity constructible in an
> invalid state is a finding, and so is untrusted input not parsed once at the
> boundary into a type that cannot hold an illegal state.
> You own naming, comments, control flow, type-system escape hatches, the parse at
> a real boundary and whether it checks destination as well as shape, error
> translation, entity construction and constructor shape, mapper mechanics, the
> language files' idioms, and hand-edits to generated files. What an attacker can
> do with input that passed a parse is Security's. Of `coding-style.md`'s
> "Architectural Principles & Layering" section, yours are the entity rules other
> than "Behavior lives with data", framework-agnostic constructors, safe parsing,
> error translation in both places it is stated (the translation half of
> "Defensive networking" and "Error Translation at Boundaries"), and mapper
> mechanics. The rest of that section, its paragraph on DI lookup keys included,
> and all of "Code Construction & Decoupling Patterns" are Architecture's, as is
> which collaborators are injected at all. Of the
> language files, yours are constructor shape (the props object and `readonly` in
> TypeScript), interface width, and the tag-free domain struct in Go. Port
> placement, accept-interfaces-return-structs, modeling domain concepts as types,
> and mutation by replacement are Architecture's. Read what is Architecture's, and
> report no defect under it. Do not name Fowler catalog smells, because the
> refactoring axis owns them. Name the concrete defect a structure causes, when
> there is one. Match the surrounding file's conventions.

## Architecture

> Architecture axis: structure, dependencies, and production behavior. Your
> standard is `~/.agents/rules/engineering-judgment.md` from "Designing the
> Solution" through "Evaluating Work", `~/.agents/rules/coupling.md` whole, the
> "Architecture" section of the doctrine at `~/.agents/skills/doctrine/principles.md`,
> and in `~/.agents/rules/coding-style.md` the "Architectural Principles & Layering"
> and "Code Construction & Decoupling Patterns" sections with every language file
> that matches the diff. When the diff touches a data store, a queue, distributed
> state, or a running service, read the doctrine's "Data and distributed systems"
> and "Operations and reliability" sections too. Of `coding-style.md`, yours are
> "Code Construction & Decoupling Patterns" whole and, in "Architectural Principles
> & Layering", the layering rule with its paragraph on DI lookup keys, "Behavior
> lives with data", the application layer, "The client defines the contract", the
> deadline half of "Defensive networking", and whether a boundary needs an
> anti-corruption layer at all. Of the language files, yours are port placement and
> accept-interfaces-return-structs in Go, and modeling domain concepts as types and
> mutation by replacement in TypeScript. The rest of those files is Style's. Read
> it, and report no defect under it.
> **Modules:** a patch that works while adding structural complexity is a finding
> even when nothing is broken. Where an authorization check lives is yours. Whether
> it can be reached past is Security's. **Objects:** direct orchestration is the
> default, and it bounds any event-driven cure you propose. **Production:** the
> write-sequence check asks whether a failure between related writes can leave
> state a caller or a later read observes. Three neighbors of that defect are
> coupling findings, not write-sequence: a consumer that cannot run without the
> provider (operational); correctness resting on a fixed write order (temporal,
> ordering form); two callers interleaving unsafely (temporal, concurrency form). A
> site may carry a write-sequence defect and a coupling defect. Report each under
> its own name. Never report one defect under two names. Do not audit SLOs, error
> budgets, or recovery-time priorities, because a patch can't violate a priority. A
> patch that adds a manual, repeatable step to operating the system is a finding.
> **Coupling:** sweep Nygard's five types, operational, developmental, semantic,
> functional, and incidental, plus temporal in both its ordering and concurrency
> forms. Name each type. Report only the ones that are defects, since coupling to
> something stable that couldn't be otherwise is a design choice. Do not list the
> types that are absent. You may read git history for stability evidence. Where you
> didn't, state the stability assumption the finding rests on as an assumption, and
> do not withhold the finding.
> Simplicity measured against the spec belongs to the Spec axis. Findings about
> tests belong to Testing, and test-setup complexity may serve as evidence for a
> production coupling finding.

## Security

> Security axis. Vulnerabilities and exploitable defects: injection, authn/authz
> gaps, unsafe handling of external input, secrets exposure, plausible-but-wrong
> logic an attacker can reach. There is no house security file, so your standard is
> the Security section of the wiki checks, walked whole. Read the diff as an
> attacker. Trace each untrusted input from where it enters to every sink it
> reaches, and for each authority the code exercises, ask who can invoke it. Every
> finding needs a concrete attack path: input → effect. No "consider hardening X"
> without one. Whether a parse exists at a boundary, and whether it checks
> destination as well as shape, is Style's. What an attacker reaches through a
> parse that passed is yours. Where an authorization check lives is Architecture's.
> Whether it can be reached past is yours.

## Testing

> Testing axis: the test files in the diff and the production code they exercise.
> Your standard is the testing rules at `~/.agents/rules/testing/`: `00-index.md`
> with its checklist, `01-architecture-and-harness.md`, `02-mocking-roles.md`, and
> `03-test-aesthetics.md`. Read `references/test-data-builders.md` or
> `references/characterization-tests.md` there before citing either. Tests are
> code, so `~/.agents/rules/coding-style.md` and its language file apply to them
> too. Read the changed test files fully.
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
> Name smells as the testing rules name them: Mystery Guest, Interacting Tests,
> Resource Leakage, Slow Test, Erratic or Flaky Test, Test Logic in Production,
> Obscure Test, Eager Test, Fragile Test, Assertion Roulette, Conditional Test
> Logic, Hard-Coded Test Data, Test Code Duplication, Free Ride, Trivial Test. An
> invented name is a failed finding. Erratic or Flaky Test is the right citation
> for an injected-non-determinism finding and never the verdict. Write
> "non-deterministic seam, Erratic or Flaky Test: reads the wall clock at file:line
> with no injected Clock", never "this test is flaky". Name each double by its real
> role: Dummy, Stub, Fake, Spy, Mock. A "fake" with no state, seeds, or reset is a
> Stub. A framework mock has one escape hatch: a thin interaction assertion on a
> third-party boundary in a focused adapter contract test.
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
> author decides what the change itself owes. Your standard is the refactoring
> index at `~/.agents/rules/refactoring/00-index.md`, plus the catalog document
> under `catalog/` there for each refactoring you cite, read before you cite it.
> `~/.agents/rules/coding-style.md` and its language file bound every remedy.
> Where Fowler and a house rule differ, the house rule wins. The wiki checks have
> no Refactoring section,
> so walk their "Not findings" section only. Read the changed files fully, then
> their direct callers and callees one hop out. A cross-file smell (Shotgun
> Surgery, Divergent Change, Duplicated Code) may search wider; a file outside the
> hop enters the report only as evidence for a finding seeded in the changed files.
> Name each smell and the refactoring that removes it by their names in the index.
> An invented name is a failed finding. Give the mechanics in the target language's
> idiom, precisely enough for a fresh session to execute: in Go, Extract Superclass
> becomes an interface plus embedding, and Replace Conditional with Polymorphism
> becomes an interface with per-case implementations or a function table. For an
> inverse pair (Extract/Inline Function, Hide Delegate/Remove Middle Man), state
> the direction and the specific pain in the current code that settles it. Drop a
> finding that reads equally valid reversed. A remedy must be a net win under
> Beck's ordering; reveals-intent outranks fewest-elements. Drop a remedy that adds
> elements without buying intent-revelation or killing duplication. Never introduce
> a class, port, mapper, or layer solely to satisfy a principle. Name the covering
> tests you located, by path. When none cover the behavior, a characterization test
> is step zero of the mechanics; without passing tests the change is a rewrite, not
> a refactoring. For each finding: the friction, already incurred or awaiting the
> next change; what improves and along which axis; and the cost of doing it.
