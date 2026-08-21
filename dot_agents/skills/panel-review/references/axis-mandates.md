# Panel review: briefs for the six reviewers

Tier-3 reference for `panel-review` §2. Read it when fanning out, and paste the blocks below
into the briefs verbatim. One mandate is read back by the orchestrator, in two places: `SKILL.md`
§4's stability probe cross-references the Architecture mandate's **Production** paragraph, and
§3's dedup exception is the orchestrator half of that paragraph's write-sequence/coupling split.

Contents: shared code-reviewer context · Style · Architecture · Spec · Security · specialist
diff-seed block.

Shared context, identical for the four code-reviewers:

> Patch: `<readable patch path>`. Changed files: `<paths>`. Spec: `<path>`.
> Verification is orchestrator-owned; this mandate waives code-reviewer input 3.
> Do not run tests or block on withheld suite output. Return a static axis verdict.
> Test files belong to the testing reviewer: review production code only, and
> skip loading `~/.agents/rules/testing/`: that axis owns it. A `[correctness]`
> defect you spot in a test file is still yours to report, tagged.
> Correctness is every reviewer's floor: keep a concrete wrong-output
> defect even when it's outside your lens, tagged `[correctness]`. This brief
> deliberately contains no assessment of the work; form your own from the
> code.

Axis mandates: pass one per reviewer:

- **Style**: "Review mandate: code style only. Load
  `~/.agents/rules/coding_style.md` plus the language file(s) matching the
  diff. Don't load `engineering_judgment.md`: its only rule of yours is §1's
  "If the business says 'order,' don't say 'transaction record'", reproduced
  here. You own: naming, that rule and the banned `Impl` suffix, comment
  policy, type-system escape hatches, unparsed boundary input, error
  translation, entity construction and constructor/DI shape, language-file
  idioms, except four bullets that spell an excluded rule in a language's own
  words and belong to Architecture: `coding_style_typescript.md` §3's
  mutation-by-replacement and §1's "model domain concepts with classes, modules,
  or functions" (both §2a's *Behavior lives with data*), and
  `coding_style_go.md` §1's Repository-Interfaces placement rule and §6's
  *Accept interfaces, return structs* (both §2c's *The client defines the
  contract*). What sits around them is yours: the TS props-object constructor
  and `readonly` defaults, Go §6's one-to-three-method interface width, and Go
  §1's no-tags-on-domain-structs, and hand-edits to generated files. Catalog
  smells are the refactoring
  reviewer's, per your own definition; drop them, and name nothing from the
  Fowler catalog. Honor your own "What NOT to flag" list.
  Security owns whether input that passed validation is still exploitable;
  report a missing parse at a boundary, not the reachability of what gets
  through one.
  These parts of `coding_style.md` are the Architecture axis's; report no defect
  under any of them: all of §3, §2's opening layering statement, all of §2b,
  §1's two routing bullets, a shared-contract change to `engineering_judgment.md` §4, an exception to §5,
  §2c's *Defensive networking* deadline requirement and its *The client defines
  the contract* port-placement rule, and §2a's *Behavior lives with data*: the
  anemic-model rule. Yours are all of §2a except that one, §2c's
  *Framework-agnostic constructors*, *Safe parsing at boundaries*, and *Defensive
  networking*'s error-translation clause, §2d, §2e, all of §1 outside those two routing
  bullets, and all of §4. That covers §2 exactly once. Two carve-outs inside your
  half: §2d is yours for mapper mechanics, but whether a boundary needs an
  anti-corruption layer at all is Architecture's (`engineering_judgment.md` §2);
  and §1's Beck four-criteria bullet is yours at the expression level only:
  structural over-abstraction is Architecture's, simplicity against the spec is
  Spec's."
- **Architecture**: "Review mandate: architecture only. Load
  `~/.agents/rules/engineering_judgment.md` (§2–5), `~/.agents/rules/coupling.md`,
  `~/.agents/rules/coding_style.md`, and the language file(s) matching the diff.
  You need the last two because rules below are stated only there: §3 and the four
  language-file bullets. Everything in those two files that this mandate does not
  name is Style's: read it, report no defect under it.
  You own three levels, plus a judgment lens.
  **Module:** boundaries, dependency direction, interfaces at the seams, coupling
  to other modules, orthogonality (one change, one place), structural
  over-abstraction, over-engineering as a structural question. §5's approach test
  is yours too: a patch that works while adding structural complexity is a
  finding even when nothing is broken. On §2b's *Authorization is a boundary
  concern* you own where the check lives; whether an attacker can reach past it
  is Security's.
  **Object: all of `coding_style.md` §3, this axis's by this mandate:**
  Tell-Don't-Ask, event-driven integration versus direct orchestration,
  explicitly passed clocks and ID generators, `Probe` port scope, the
  generic-utility carve-out, YAGNI and speculative generality, which
  collaborators get injected (Style owns constructor *shape*), and domain
  behavior sitting with the model it governs rather than in a service over
  anemic records; §2a's *Behavior lives with data* is the same rule, also
  yours. The language files spell two of these in their own words, and those
  bullets are yours as well: `coding_style_typescript.md` §3's
  mutation-by-replacement and §1's model-domain-concepts clause are §2a's;
  `coding_style_go.md` §1's Repository-Interfaces placement and §6's *Accept
  interfaces, return structs* are §2c's port-placement rule. Style is told to
  drop all four.
  **Production: `engineering_judgment.md` §4:**
  deadlines or cancellation on remote and blocking work, retry safety within an
  explicit budget, convergence from an interrupted run: entry-time reconciliation
  instead of assuming the predecessor finished, and identity-keyed rather than
  order-keyed cleanup, propagation barriers where the failure modes justify them,
  deployability through the project's one documented route, deployable-vs-released,
  rollback, canary, or flag mechanics, a shared-contract change's safety in
  both directions across the window, and whether a related-writes sequence
  can fail into observable half-applied state: the write-sequence check. Skip
  the SLO and error-budget claim and
  MTTR-over-MTBF: a patch cannot violate a priority. *Eliminate toil* is
  skippable only as a standing goal: report it when the patch itself adds a
  manual, repeatable step to operating the system.
  The write-sequence check owns one defect: a failure *between* the writes
  leaves state a caller or a later read can observe. Three neighboring
  defects at the same site are coupling findings and take the coupling route
  below instead, never this one: the consumer cannot run at all without the
  provider (Operational); correctness rests on the writes happening in a
  fixed order (temporal, ordering form); two callers may interleave unsafely
  (temporal, concurrency form). A site may genuinely carry both a
  write-sequence defect and a coupling defect: report each under its own
  name, never one defect under two.
  Sweep all five of Nygard's coupling types
  (`coupling.md` §Nygard's five types) plus **temporal coupling** in both of its
  forms, ordering and concurrency: it is outside that enumeration, named
  beside the five types in the same section. Then report only those that are
  defects under `coupling.md`'s §Before reporting gate, whose stability
  question is spatial types only; temporal coupling is judged on whether the
  ordering or concurrency assumption can be violated, never on the target's rate
  of change. A type that isn't present goes unmentioned; do not enumerate
  absences. Name
  each by its type verbatim. Only coupling the patch introduced or measurably
  worsened is verdict-bearing, and the orchestrator decides which is which:
  report every coupling finding you can evidence and don't classify your own.
  You cannot run the stability probe: you have no shell. Never withhold a
  coupling finding for missing history: report it and state the stability
  assumption it rests on, as an assumption.
  `coupling.md` §Cures routes outward to `coding_style.md` §2c/§2e for boundary
  validation and error translation, which Style owns; report no finding under
  those two rules. §2c's port-placement rule (*The client defines the contract*)
  stays yours, and so does §3's direct-orchestration default, which bounds any
  event-driven cure you propose.
  **Judgment: the rest of §2–5:** all of §2, including
  *Every new dependency needs a strong case* and *Complexity carries the burden
  of proof* with its untested-negative-assumption probe. From §3: *Code is a
  liability* and *Orthogonality*. From §5: cause versus symptom, the full blast
  radius, repeated workarounds against a library, and whether the change narrows
  the space of future bugs.
  Not yours: *Code smells are design heuristics* and *DRY is about knowledge*
  are the refactoring track's; *Seek the simplest thing that could work*,
  measured against the spec, is the spec axis's; *Listen to the tests* is the
  testing axis's, though you may still cite test-setup complexity as evidence
  for a production coupling finding (`coupling.md` §Symptoms); the finding
  about the test itself is theirs. *Refactor on green* and *Make the change
  easy, then make the easy change* are claims about how the patch was produced;
  no reviewer holds that transcript, so skip them, as with the remaining §3 and
  §5 bullets that describe practice rather than diff-visible checks.
  Simplicity relative to the spec belongs to the spec reviewer, and catalog
  smells to the refactoring reviewer; drop both."
- **Spec**: "Review mandate: spec conformance only. Read the spec at
  `<path>`, and the grilled design doc at `<path>`, when one exists; an
  implementation decision or spec-authorized deferral recorded there is not a miss,
  with the eyes of a product owner and a staff engineer. Requirement
  by requirement: is it actually implemented: behavior present, not merely
  code existing? Is anything built that no requirement asks for? Is this the
  simplest thing that satisfies the spec? Cite the spec clause in every
  finding. When the diff adds or changes behavior with no test movement, say so
  and name the requirement left unpinned: a Minor unless a spec clause requires
  the coverage."
- **Security**: "Review mandate: security only. Vulnerabilities and
  exploitable defects: injection, authn/authz gaps, unsafe handling of
  external input, secrets exposure, plausible-but-wrong logic an attacker can
  reach. Style owns whether schema validation is present at a boundary; what an
  attacker can reach through it is yours.
  Every finding needs a concrete attack path: input → effect. No
  'consider hardening X' without one."

Both specialists take a diff-seed brief and no mandate or spec; each follows its
own input rules for scope. One block, passed to each:

> Diff seed: patch at `<readable patch path>`. Changed files: `<paths>`. Review
> per your input rules. Structure inside test files belongs to the testing axis:
> refactoring findings are production code only. This brief deliberately
> contains no assessment of the work.
