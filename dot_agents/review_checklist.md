# Review Checklist

An inventory of what the review corpus checks, in one list, attributed to the reviewer
that owns each item today.

**This is a reference, not an instruction.** Nothing loads it, no mandate names it, and no
reviewer reads it at review time — the rules do the work, as they did before this file
existed. One inbound pointer exists: `using_the_wiki.md` treats §Sources as one of four
mirrors of the qmd-scoping fact, so edit that section in step with the other three. Its
only job is to answer two questions at a glance: what are we checking, and what are we
not. Add, cut, and reword lines freely; nothing downstream breaks.

**A line here is a prompt to look, never the rule itself.** The cited file is the
authority. When a line and its citation disagree, the citation is right and the line is
stale. A line with no citation is a preference with no rule behind it yet, and says so
inline.

## How to read a line

Three markers, because none of "is this checked?", "how hard is the rule?", and "what is
this line's source?" is answered by the line text alone.

**Provenance**, per section. Each section header states one of two:

- *Transcribed* — the source already enumerates these as checks. The list here is a copy,
  and the count should match.
- *Derived* — the source is declarative prose, and each line is a manifesto bullet
  rewritten as a question. Nothing in the corpus walks these item by item. A reviewer is
  told to load the file and to cite the rule a finding rests on; turning it into a list was
  this document's doing, not the corpus's.

**Force**, per line. A `†` means the source states the rule with an explicit qualifier —
"when the requirement calls for it", "in proportion to demonstrated complexity", "unless
documented otherwise". An unmarked line is stated without qualification in its source.

The gradient is easy to lose, and losing it inverts a rule. `coding_style.md` lines 7–10
gate the entire §2 architectural apparatus: apply the patterns *"in proportion to
demonstrated domain and integration complexity"*, and *"do not introduce classes, ports,
mappers, DI, or messaging solely to satisfy this document."* A binary question about a port
or a mapper, asked without that gate, produces exactly the finding those lines forbid.

**A derived line marked `†` is the weakest kind here** — an inferred check against a
conditional rule. Treat it as a place to think, never as a bar to clear.

**Wiki provenance**, per line. A `‡` means the line comes from the personal wiki (qmd
collection `wiki`), with the page title named inline. It overrides the section's
provenance: a `‡` line is neither transcribed from nor derived from that section's
authority file.

**A `‡` line's specific formulation has no rules file behind it.** No reviewer is instructed
to check it as written, and a finding cannot cite a house rule for that wording. The
wiki page is the whole of its backing. The underlying *concept* occasionally does have house
backing — where it does, the line says so inline. Promotion works the same way as for the
"Candidates" tail: write the rule into the authority file first, then the line stops needing
the marker.

**The obstacle is adoption, not access.** A 2026-07-30 audit confirmed what this section
already claimed: **no mandate names the wiki or these lines**, so no `‡` line is enumerated
to any reviewer as written. `coding_style.md` and `engineering_judgment.md` each carry a
conditional pointer to `using_the_wiki.md`, so a reviewer that loads either *sees* the
pointer — and cannot follow it, per the next paragraph. Either way nothing enumerates these
lines. Treat them as a promotion backlog, not a live checklist.

Reaching a page needs Bash, since `using_the_wiki.md` prescribes `qmd`, and every reviewer's
`tools:` is `Read, Grep, Glob`. That is downstream of adoption and not worth fixing on its
own: a reviewer with Bash still checks nothing here, and read-only is load-bearing in all
three reviewer definitions. Promote a line and the access question resolves with it — the
rule lands in a file the reviewer already loads.

The citation is always the wiki page, never the book behind it — where a page attributes a
claim to Fowler, Beck, Evans, Nygard, or Kleppmann, the attribution is the page's, and the
quoted words are the page's rendering of it. **The page's currency is not checked by any of
this.** A citation can be faithful to a page that is faithful to a source that has since
been superseded; §D is where that bites hardest and says so.

A `‡` line cannot assert that its page was read — nothing in a line proves that, and the
assertion would be unfalsifiable. Two things are checkable instead:

1. **The quote.** Every quoted string should appear verbatim on the named page. Where it
   doesn't, the line is wrong. This is the cheap check and it catches the most.
2. **The §Sources table** at the end. It records, per page, the content hash `qmd` printed
   when the page was read, the date, and whether the whole page or only a section was read.
   Re-run `qmd get "<uri>" | head -1`: a changed hash means the page moved under the lines
   citing it, and those lines are unverified until someone re-reads it. A page marked
   *section* was never read whole, so its lines carry the weaker claim and say so here
   rather than pretending otherwise.

A `‡` line also carries `†` when the wiki states it conditionally, which is most of the
time. An unmarked `‡` line means the page states it flatly.

## Who checks what today

Ownership below describes how `panel-review` currently splits the work — a snapshot, not a
constraint on how it should. A check sits in one section because one reviewer owns it; two
axes reporting the same defect is what `panel-review` §3 spends an arbitration step
undoing.

| Section | Reviewer | Mandate |
|---|---|---|
| §A Style | `code-reviewer` | Style |
| §B Architecture | `code-reviewer` | Architecture |
| §C Spec | `code-reviewer` | Spec |
| §D Security | `code-reviewer` | Security |
| §E Testing | `testing-reviewer` | — (diff seed) |
| §F Structure | `refactoring-reviewer` | — (diff seed) |
| §G Not findings | all | — |

## Panel coverage — which authors are represented

The corpus this file inventories has a specific set of authors behind it, and "is anyone
missing?" should be answerable at a glance rather than by reading 500 lines.

| Author(s) | Territory | Where |
|---|---|---|
| Martin Fowler | The refactoring catalog and its 24 smells | §F |
| Eric Evans | Aggregates, anti-corruption layers, anemic domain, domain language | §A, §B |
| Michael Nygard | Stability patterns and antipatterns, the five coupling types | §B |
| Martin Kleppmann | Transactions, schema evolution, data-access patterns | §B |
| Gerard Meszaros | Test smells, the five double roles | §E |
| Steve Freeman, Nat Pryce | Harness and Driver, fakes over mocks, listening to the tests | §E |
| Kent Beck, Cynthia Andres | TDD as the default, the simplest thing that works | §C, §E |
| Robert C. Martin | Dependency direction, naming, comment policy | §A, §B |
| Beyer, Jones, Petoff, Murphy | Cascading failures, governors, bounded work, deadline propagation | §B |
| Forsgren, Humble, Kim, Farley | Trunk-based, deploy-versus-release, expand/contract migrations | §B |
| Andrew Hunt, David Thomas | DRY as knowledge, orthogonality, not fighting the tools | §B, §F |
| Michael Feathers | Seams, characterization tests, sprout and wrap | §B, §E |
| Gamma, Helm, Johnson, Vlissides | Program to an interface, composition over inheritance, patterns after the problem | §B |

**Feathers's structural lines sit in §B, not §F.** §F is scoped to Fowler 2nd ed. by the
`refactoring-reviewer`'s own definition — "nothing outside it may be cited" — so a seam or
normalized-hierarchy finding cannot be raised there without breaking that reviewer's
authority. Its test-facing lines go to §E for the same reason: the smell taxonomy there is
Meszaros's, and Feathers's characterization discipline is a separate lineage that §E's
authority files never mention.

**Deliberately absent: everything a diff cannot show.** `engineering_judgment.md` §4–5 carry
SLOs and error budgets, the golden signals, DORA metrics, blameless postmortems — and XP
contributes pair programming and small releases. Every one belongs to an author on the list
above, and none is checkable by reading a changeset. The Architecture mandate reaches the same
verdict in its own words: "Skip the SLO and error-budget claim and MTTR-over-MTBF — a patch
cannot violate a priority." Listing them would grow this file without growing what it catches,
which is the burden-of-proof failure `engineering_judgment.md` §2 names. They govern how the
work is organized, not whether this change is sound.

**Toil is the exception, and it is in §B.** The same mandate carves it back in: "*Eliminate
toil* is skippable only as a standing goal: report it when the patch itself adds a manual,
repeatable step to operating the system." That form *is* diff-visible, so it is a check rather
than a priority — see §B Production readiness.

---

## §A Style — `code-reviewer`, Style mandate

Authority: `coding_style.md`, plus the language file matching the diff — with two
exceptions. The domain-language naming rule lives in `engineering_judgment.md` §1, which
this axis does not load, so the Style mandate quotes it inline instead. And four
language-file bullets spell a rule §A does not own — see the routing lines below. The
Style reviewer names nothing from the Fowler catalog — §F owns those.

**Provenance: mixed.** The subsection headings are transcribed — the `panel-review` Style
mandate enumerates exactly this ownership ("naming, that rule and the banned `Impl` suffix
— comment policy, type-system escape hatches, unparsed boundary input, error translation,
entity construction and constructor/DI shape, language-file idioms … and hand-edits to
generated files"). Every individual line below
is **derived**: `coding_style.md` and the language files are manifestos, and no instruction
anywhere walks their bullets one by one. Lines marked `‡` are neither — see "How to read a
line".

### Naming

- Do names use the domain's language rather than a technical synonym — "order", not "transaction record"? *(`engineering_judgment.md` §1)*
- Is any class named `<Something>Impl`? *(`coding_style.md` §1)*
- Does an interface's name state a capability or agent noun rather than restate its single implementation? *(`coding_style_go.md` §6, §7)*
- Do variable names scale with scope — short inside a few lines, descriptive across a function or package? *(`coding_style_go.md` §7)*
- ‡ Does a new service class name something in the domain, or is it a `Manager`-shaped "doer"? Evans warns against names that "have no state of their own nor any meaning in the domain beyond the operation they host." Naming only. §B owns whether the entity holds behavior at all (`coding_style.md` §2a) and whether a *service* is the wrong home for it (§3, Object level); §F owns the structural shape as Data Class. *(wiki: Anemic Domain Model)*

### Comments

- Would the code be misread or silently broken without this comment? If not, it goes. *(`coding_style.md` §1)*
- Were the three moves exhausted before the comment — clearer name, extracted function, rationale moved to the design record? *(`coding_style.md` §1)*
- Does any comment describe the *edit* — what changed, what it replaced, why it was chosen? That belongs in the commit message. *(`coding_style.md` §1)*
- Does a config, data, or frontmatter file carry an explanatory comment? Same rule, and JSON has no comments at all. *(`coding_style.md` §1)*
- ‡ Is there commented-out code? "Few practices are as odious as commenting-out code. Don't do this!" — the next reader will not have the courage to delete it, and source control already has it. *(wiki: Code Comments)*

### Control flow and types

- Is control flow plain `if`/`else`, loops, and early returns rather than expression-level cleverness? *(`coding_style.md` §1)*
- Does a method body written or restructured here break after a guard clause or early return — and, past two statements, at its other step boundaries? *(`coding_style.md` §1)*
- Does any code use the language's type escape hatch — the token list is per-language, not transferable? *(`coding_style.md` §1; Go: bare type assertion, `coding_style_go.md` §6; TS: `as any` and casts to silence the compiler, `coding_style_typescript.md` §1)*
- Is a type guessed by sniffing fields on an opaque value instead of `instanceof`, a discriminant, or a schema parse? *(`coding_style.md` §1, `coding_style_typescript.md` §1)*
- When the compiler complains, was the upstream type fixed rather than the call site patched? *(`coding_style.md` §1)*
- ‡ † Does a check throw away what it just learned — returning `void` rather than a refined type the caller must hold? Then "the call site can omit it without typechecker complaint — fragile". "Treat `m ()` returns with deep suspicion." Conditional: the page calls the principle "a direction-of-travel, not a strict requirement", and notes encoding a property in the type system is sometimes "plain impractical". *(wiki: Parse, Don't Validate (King 2019))*

### Contracts the code owns both sides of

- Is there a fallback branch handling a case the code's own producer decides — "if X is missing"? Make the contract mandatory and delete it. *(`coding_style.md` §1)*
- Does the change touch a shared contract — schema, API response, event payload, queue message? The Style reviewer sees the contract touch from `coding_style.md` §1; the deploy-compatibility constraint that follows is **§B's**, since `engineering_judgment.md` §4 loads under the Architecture mandate and not this one. *(`coding_style.md` §1 → §B Production readiness)*
- Does the change carry a suppression, lint exclusion, ignore rule, or shim to get past a tool? The Style reviewer sees the exception from `coding_style.md` §1; the design-decision judgment that follows is **§B's**, since `engineering_judgment.md` §5 loads under the Architecture mandate and not this one. *(`coding_style.md` §1 → §B Complexity and its burden of proof)*

### Entities and construction

**Gated.** `coding_style.md` lines 7–10 apply this whole area "in proportion to
demonstrated domain and integration complexity." A simple program with no meaningful domain
is not failing these.

- Does an entity map properties explicitly rather than by bulk merge or reflection? *(`coding_style.md` §2a; TS: props-object constructor, `coding_style_typescript.md` §3)*
- Does a constructor take the canonical domain shape rather than a DB row, HTTP body, or wire payload? *(`coding_style.md` §2a)*
- † Are properties `readonly` by default, with collections read-only too, not just their references? "Unless there is a documented reason to be mutable." *(`coding_style_typescript.md` §3)*
- Do domain structs carry serialization or persistence tags? *(`coding_style_go.md` §1)*
- Not §A's: two language-file bullets here spell a rule §B owns — `coding_style_typescript.md` §3's mutation-by-replacement and §1's model-domain-concepts clause, both of them `coding_style.md` §2a's *Behavior lives with data*. §A keeps the mechanics around them, which are the two TS lines above: the props-object constructor and `readonly` defaults. The other two routed bullets are Go's, under §Go idioms. *(→ §B Object-level structure)*

### Boundaries — the code-level half

**Gated**, same as above: `coding_style.md` lines 7–10 forbid introducing ports, mappers,
or DI "solely to satisfy this document."

- Is every untrusted edge parsed with the project's schema validator — env config, incoming payloads, outgoing external responses? *(`coding_style.md` §2c; TS: `coding_style_typescript.md` §2)*
- Is *destination* validated as well as shape — a well-formed URL resolving to link-local space, a valid relative path escaping its root? *(`coding_style.md` §2c)*
- ‡ † Is parsing finished before anything is acted on, or are checks sprinkled through the processing code? "Shotgun parsing" leaves the program having partly acted on input it later rejects, with state it may not be able to roll back. One named exception, in §G: authorisation may legitimately run ahead of the parse. *(wiki: Parse, Don't Validate (King 2019))*
- Do adapters translate driver, ORM, and HTTP failures into stable port errors, keeping domain errors for domain outcomes? *(`coding_style.md` §2e; Go: `coding_style_go.md` §2)*
- Does the change add an external call? The Style reviewer reads the deadline rule in `coding_style.md` §2c — it is stated there outright, not routed elsewhere — but does not own it: the finding is **§B's**, under Production readiness. *(`coding_style.md` §2c → §B)*
- Do constructors accept pure dependencies, constructible in a test without the DI container? *(`coding_style.md` §2c; TS: `coding_style_typescript.md` §4)*
- Does a port's `@Inject` name the adapter class the module wires, with the field typed to
  the port interface — and is there any standalone token constant (symbol, string,
  abstract-class-as-token, `{ provide: TOKEN, useClass: Adapter }`)? *(`coding_style_typescript.md` §4)*

### Generated code

- Was any generated file hand-edited — Swagger client, schema type, GraphQL codegen, mock file? Re-run the generator. *(`coding_style.md` §4)*

### Go idioms

- Are sentinels package-level `var`s, with anything data-carrying a struct exposing `Unwrap() error`? *(`coding_style_go.md` §2)*
- Does each layer wrap once, and each boundary translate rather than wrap? *(`coding_style_go.md` §2)*
- Is error identity matched with `errors.Is` and data extracted with `errors.As`, never by message string? *(`coding_style_go.md` §2)*
- Does the release `defer` sit on the line after the acquisition? *(`coding_style_go.md` §3)*
- Is there a `defer` inside a loop — function-scoped, so it accumulates until return? *(`coding_style_go.md` §3)*
- Does every `context.WithCancel` / `WithTimeout` have a `defer cancel()`? *(`coding_style_go.md` §3)*
- Is the error from a deferred `Close` checked on anything written to, and explicitly discarded on a read handle? *(`coding_style_go.md` §3)*
- Does every goroutine have a named owner that waits for it — `WaitGroup`, `errgroup`, or a done channel? *(`coding_style_go.md` §4)*
- Does every blocking loop select on `ctx.Done()`, and every channel send have a receiver that outlives it? *(`coding_style_go.md` §4)*
- Is a `context.Context` stored in a struct field? *(`coding_style_go.md` §4)*
- Does a type parameter have two concrete instantiations already, and is it constrained to the smallest set that compiles? *(`coding_style_go.md` §5)*
- Not §A's: the other two routed bullets sit here — `coding_style_go.md` §1's Repository-Interfaces placement and §6's *Accept interfaces, return structs* spell `coding_style.md` §2c's *The client defines the contract*. The *return structs* half was a line in this list until 2026-07-30; it is now §B's, under Dependency direction. §A keeps §6's interface width, below, and §1's no-tags-on-domain-structs, above. *(→ §B Dependency direction)*
- Is any interface wider than three methods? That is an undrawn package boundary. *(`coding_style_go.md` §6)*
- Does every method of a type use the same receiver name? *(`coding_style_go.md` §7)*
- † Do imports match the file's existing grouping, arranged by the formatter rather than by hand? Absent a `goimports -local` or `gci` config, there is no project order to enforce. *(`coding_style_go.md` §7)*

### TypeScript idioms

- Is `z.infer` used for a parsed boundary shape or behavior-free DTO, rather than to model domain behavior? *(`coding_style_typescript.md` §1)*
- Are types readable at a glance, free of conditional-type and mapped-type gymnastics? *(`coding_style_typescript.md` §1)*
- Does the flow run `unknown -> schema parse -> DomainClass` when the value has identity or behavior? *(`coding_style_typescript.md` §2)*
- Does the parse use the structured-failure API where the caller needs one, returning the framework's validation error rather than a domain error? *(`coding_style_typescript.md` §2)*

### Frontend

- Do color, spacing, type, radius, shadow, and z-index come from the scale? *(`coding_style_frontend.md` §1)*
- Do call sites reference semantic tokens (`bg-surface`) rather than raw scale values (`bg-zinc-900`)? *(`coding_style_frontend.md` §1)*
- † Is an arbitrary `[...]` value justified by local geometry, or is it a repeated value that wants a token? Computed transforms and one-off grid geometry may use `[...]`. *(`coding_style_frontend.md` §1)*
- Is spacing owned by the container via `gap-*` rather than stacked `mt-*` on children? *(`coding_style_frontend.md` §2)*
- Do two selectors fight over the same padding, making the result depend on source order? *(`coding_style_frontend.md` §2)*
- Do sizes, weights, and line-heights come from the type scale, with display and body treated as distinct roles? *(`coding_style_frontend.md` §3)*
- Is one icon set used, at consistent size and stroke weight? *(`coding_style_frontend.md` §4)*
- † Is the project's existing icon set preserved? `lucide-react` / `@lucide/svelte` is a greenfield preference only. *(`coding_style_frontend.md` §4)*
- Are buttons, inputs, dialogs, menus, and tooltips composed from the primitives layer rather than hand-rolled? *(`coding_style_frontend.md` §5)*
- † Is the project's accessible component layer used? `shadcn/ui` / `shadcn-svelte` applies to a greenfield UI without one. *(`coding_style_frontend.md` §5)*
- Is a copied shadcn component adjusted once at the source rather than overridden at each call site? *(`coding_style_frontend.md` §5)*

The six accessibility lines below are the one unconditional block in this section —
`coding_style_frontend.md` §6 is headed "Non-Negotiable".

- Is the markup semantic — a real `<button>`, `<nav>`, and heading hierarchy, never `<div onClick>`? *(`coding_style_frontend.md` §6)*
- Does every control have an accessible name — a visible label, or `aria-label` on an icon-only button? *(`coding_style_frontend.md` §6)*
- Is every interactive element keyboard-reachable with a visible focus indicator? *(`coding_style_frontend.md` §6)*
- Is non-essential animation gated behind `prefers-reduced-motion`? *(`coding_style_frontend.md` §6)*
- Does any state, validation, or category rely on color alone? *(`coding_style_frontend.md` §6)*
- Are hit targets comfortably tappable (~44px) with adequate spacing? *(`coding_style_frontend.md` §6)*
- Are base styles mobile-first, layered up with the theme's breakpoints rather than one-off widths? *(`coding_style_frontend.md` §7)*
- Does the layout hold at ~320px? *(`coding_style_frontend.md` §7)*
- † Is `'use client'` pushed to the leaves, with the bundle cost of its import graph accounted for? The rule is "be deliberate", not a threshold. *(`coding_style_frontend.md` §8)*
- † When `.boris/design/` (or its archive) holds a ratified direction for this surface, do the palette, type roles, and signature element in the diff derive from its **Tokens** section? *(`art-direction` skill)*

---

## §B Architecture — `code-reviewer`, Architecture mandate

Authority: `engineering_judgment.md` §2–5, `coupling.md`, `coding_style.md`, and the
language file matching the diff. The last two are loaded but only partly owned: this axis
reports under the parts the Architecture mandate names — §3 entire, §2b, §2a's
*Behavior lives with data*, §2c's deadline and port-placement rules — and under the four
language-file bullets routed here from §A. The rest of both files is §A's.
Module and production level — and object-level structure below the module boundary, which
the Architecture mandate assigns here; `coupling.md` §Resolutions supplies the rationale,
not the assignment. Simplicity relative to the spec is §C's; catalog smells are §F's.

**Provenance: mixed.** The coupling block is *transcribed* — `coupling.md` enumerates the
five types, the stability test, and a before-reporting gate, and the Architecture mandate
tells the reviewer to sweep all five. **Temporal is the exception:** it is not one of the
five, it lives in §Resolutions below the module boundary, and the mandate names it
separately for exactly that reason. Everything unmarked is *derived* from
`engineering_judgment.md` and `coding_style.md` prose; `‡` lines are neither, and this
section carries the most of them. The first three subsections are also
gated by `coding_style.md` lines 7–10: layering, ports, and mappers apply in proportion to
demonstrated complexity, and none of them is introduced to satisfy a document.

### Dependency direction and boundaries

- Do dependencies point inward — domain depends on nothing, use cases on domain, adapters on use cases? *(`engineering_judgment.md` §2, `coding_style.md` §2)*
- Does the domain import a web framework, ORM, or transport type? The arrow is backward. *(`engineering_judgment.md` §2)*
- Does a port live with the client that declares the need, not the implementation that satisfies it? *(`coding_style.md` §2c)*
- Was the count-and-locality test re-run now that a second consumer exists? *(`coding_style.md` §2c)*
- Was the port extracted to break a dependency or substitute an implementation — or is it an interface per class? *(`coding_style.md` §2c)*
- Do constructors return concrete types while consumers declare the narrow interface they need? The Go spelling of §2c's port placement; §A owns interface width. *(`coding_style_go.md` §6, §1 Repository Interfaces)*
- Is there an anti-corruption layer where an external model crosses in? Whether a boundary needs one is §B's; §A owns the mapper mechanics once it exists. *(`engineering_judgment.md` §2; mechanics `coding_style.md` §2d)*
- ‡ Does the ACL translate *concepts*, or only transport? An ACL "is not a mechanism for sending messages to another system … it is a mechanism that translates conceptual objects and actions from one model and protocol to another." *(wiki: Anti-Corruption Layer)*
- ‡ Does the translator say what happens to an upstream value it does not recognize? The page names the mapping rules — "which upstream codes map to which downstream classifications and what to do with codes the downstream doesn't recognize" — as what the ACL absorbs. *(wiki: Anti-Corruption Layer)*
- ‡ If a facade wraps the upstream's messy interface, is it written strictly in the *upstream's* model? A facade in a third vocabulary will "at best diffuse responsibility for translation into multiple objects and overload the FACADE and at worst end up creating yet another model, one that doesn't belong to the other system or your own BOUNDED CONTEXT." *(wiki: Anti-Corruption Layer)*
- ‡ † Is the ACL worth its cost here, or is Conformist the cheaper right answer? The page's decision rule: Conformist fits when "the upstream's model is good enough, the paradigm matches, your context is essentially an extension of theirs. Cheaper than building an ACL." Translating is the ACL's job, not its exception — the page's "only something to do selectively when translation difficulty gets out of hand" governs bending *your own model* toward the external system, and reading it as a limit on translation inverts the verdict. *(wiki: Anti-Corruption Layer)*
- ‡ † Does anything outside an aggregate hold a reference to something *inside* it, other than the root? Two carve-outs the page states and this line does not: rule 5 permits objects inside one aggregate to hold references to *other aggregate roots*, and rule 3 permits interior references handed out transiently — "those objects can use them only transiently, and they may not hold on to the reference." So the defect is a retained reference to a non-root interior object, not a cross-aggregate reference as such. The page names review as the enforcement point: "Code review catches Repository methods that return interior objects." *(wiki: Aggregate)*
- ‡ Is a new repository or direct query rooted on an aggregate root? "As a corollary to the previous rule, only Aggregate roots can be obtained directly with database queries. All other objects must be found by traversal of associations." *(wiki: Aggregate)*
- ‡ Does one transaction span two aggregates to hold an invariant together? Invariants hold inside an aggregate at every commit; "any rule that spans Aggregates will not be expected to be up-to-date at all times." *(wiki: Aggregate)*
- ‡ Does the change add a call between peers in the same layer — a backend proxying to another backend? Peers waiting on peers share the pool that serves them, so saturation spreads and can deadlock. Go downward; tell the caller to retry elsewhere rather than proxying for it. *(wiki: Cascading Failures)*
- Does the application layer orchestrate without holding domain logic? *(`coding_style.md` §2b)*
- Is authorization resolved once at the boundary per route group, rather than re-derived inside a use case or left to the view? *(`coding_style.md` §2b)*
- † Does the boundary sit at a demonstrated cost inflection — a deferred framework, database, or I/O decision — rather than at a guessed one? A cheap source-level boundary drawn early is explicitly fine; full implementation waits until ignoring it costs more than creating it. *(`engineering_judgment.md` §2)*

### Complexity and its burden of proof

- Does every added layer, dependency, or workaround trace to a demonstrated requirement? *(`engineering_judgment.md` §2)*
- Does the patch work while adding structural complexity? That is a finding even when nothing is broken, and so is compensating for an effect whose cause the patch could have removed. *(`engineering_judgment.md` §5)*
- Is the design resting on an untested negative assumption — "the platform can't do this", "I must handle this myself"? Name the probe. *(`engineering_judgment.md` §2)*
- Does each new dependency carry a case against writing it inline — supply-chain surface, version churn, audit burden, onboarding cost? *(`engineering_judgment.md` §2)*
- † Is the structure matched to the problem — transaction script for CRUD, domain model for complex rules? The rule warns against both over- and under-architecting; neither direction is a default. *(`engineering_judgment.md` §2)*
- Is flexibility built for a future that hasn't arrived? *(`engineering_judgment.md` §2, `coding_style.md` §3)*
- † Do scattered edits for one logical change signal coupling, or is this a protocol or schema change that correctly crosses files? "File count is evidence to inspect, not a target." *(`engineering_judgment.md` §3)*
- Is the change working *around* a library rather than with it? A pattern of workarounds at every turn is the wrong tool or the wrong usage. A single suppression, ignore rule, exclusion, or shim is its own finding — §5 makes it a design decision that survives only with evidence that every surface that could express the intent was read and none can. *(`engineering_judgment.md` §5)*
- Does a refusal from a linter, type checker, or test get answered by reshaping the change, rather than by narrowing what the guard sees? *(`engineering_judgment.md` §5)*

### Object-level structure

- Do neighbors get told what to do in terms of their role, or asked for internals so the caller can decide? *(`coding_style.md` §3, `coupling.md` §Resolutions)*
- Does domain behavior sit with the model it governs, rather than in a service manipulating anemic records? *(`coding_style.md` §3)*
- Does an entity hold behavior, or is it getters and setters with the logic in a service? The same rule stated at the entity end. *(`coding_style.md` §2a)*
- Is a state transition a named method returning a new instance, rather than in-place mutation or a service assembling props? The TS spelling of the same rule; §A owns the surrounding mechanics. *(`coding_style_typescript.md` §3)*
- † Are side-effecting and replaceable dependencies constructor-injected, while pure stateless helpers are called directly? Wrapping a pure helper "adds a seam without adding control" — not a defect either way. *(`coding_style.md` §3)*
- † Are clock, network, random, and ID generators passed explicitly where tests or lifecycle need control? The condition is the requirement for control, not the presence of the dependency. *(`coding_style.md` §3)*
- Is a `Probe` port introduced only where business-level observability must outlive an adapter, with generic telemetry left at the adapter? *(`coding_style.md` §3)*
- ‡ Does domain code name a logger, a metrics client, or a magic instrumentation string? The probe's API speaks the domain ("discount code lookup failed"), not the instrumentation technology, and hiding cross-cutting metadata like request ids from probe clients is the part the page calls "non-negotiable." **This line is stricter than the line above it, and than `coding_style.md` §3** — the page says "your domain classes should never have a direct reference to any instrumentation systems" and calls that rule "inviolable for domain code", where the house rule introduces a `Probe` port only where observability must outlive an adapter. The house rule governs; the page's stronger form is recorded here, not adopted. Carve-out in §G: technical code is exempt. *(wiki: Domain-Oriented Observability)*
- † Is event-driven integration chosen because async delivery, independent ownership, or decoupled evolution demands it? Direct orchestration is the default, and `coupling.md` names events as a trade — operational and developmental coupling swapped for semantic coupling in the schema. *(`coding_style.md` §3, `coupling.md` §Cures)*
- Is a shared utility genuinely generic (`clamp`, `slugify`), or is it a domain computation that belongs with its domain? *(`coding_style.md` §3)*
- ‡ Does the collaborator's declared type name what the caller needs from it, or does it name a concrete class? "Program to an interface, not an implementation" — where the page's "interface is the vocabulary of a collaboration — the conceptual boundary, not the Java `interface` keyword." Narrower than the port lines above, which ask whether a boundary is warranted; this asks what a call site declares once one exists. *(wiki: Design Patterns)* — house-adjacent: `engineering_judgment.md` §2 states the principle, and `coding_style_go.md` §6 spells the Go form.
- ‡ † Does new behavior arrive by subclassing where holding a collaborator would do? "Inheritance is white-box reuse — the subclass can see the parent's internals. Composition is black-box reuse — the container only knows the component's interface." Conditional: the page states it as "favor", not forbid, and names the abstract-class-versus-interface trade-off as a real choice. §F's Refused Bequest catches the degenerate end; this asks the question before the hierarchy exists. *(wiki: Design Patterns)*
- ‡ Does a subclass override a concrete method? Feathers's rule of thumb is "Whenever possible, avoid overriding concrete methods", and failing that, "see if you can call the method you are overriding in the overriding method." The target shape: "In a normalized hierarchy, no class has more than one implementation of a method." *(wiki: Adding Features to Legacy Code)*
- ‡ † Is a named GoF pattern introduced ahead of the problem it answers? "There is no prize for most patterns used." The page's stance is "'Refactor to patterns' not 'design with patterns upfront'", and records Gamma conceding that GoF's own speculate-ahead-for-flexibility advice contradicts YAGNI — "I matured too." Overlaps the speculative-generality line above; the addition is that a pattern name in a new class is the diff-visible tell. *(wiki: Design Patterns)*
- ‡ Does the change add a singleton or process-global instance? "I'm in favor of dropping Singleton. Its use is almost always a design smell" — Gamma's own 2009 retrospective on the pattern he shipped. §F names it Global Data; the temporal-coupling line above names the concurrency half. *(wiki: Design Patterns)*
- ‡ † Where the change breaks a dependency to make code testable, is the seam an *object* seam? "In general, object seams are the best choice in object-oriented languages. Preprocessing seams and link seams can be useful at times but they are not as explicit as object seams." The specific hazard with a link seam: "The enabling point for a link seam is always outside the program text … This makes the use of link seams somewhat hard to notice", so "make sure that the difference between test and production environments is obvious." Conditional and language-scoped — the preprocessing seam is C/C++ only. *(wiki: Seam Model)*

### Coupling — sweep all five, report only defects

- **Operational** — can the consumer run at all without the provider? Any degraded mode? *(`coupling.md` §1)*
- **Developmental** — must the two change together, in lockstep releases? *(`coupling.md` §2)*
- **Semantic** — is one domain concept modeled twice with nothing that breaks when they drift? **No other axis covers this.** *(`coupling.md` §3)*
- **Functional** — do two implementations answer the same question differently? *(`coupling.md` §4)*
- **Incidental** — do two things change together for no reason, sharing a fate only because they share a host? *(`coupling.md` §5)*
- **Temporal** — does correctness rest on ordering ("do this, then always that"), or on two callers *not* arriving at once? Outside Nygard's five, so the Architecture mandate names it separately; without that it goes unswept. *(`coupling.md` §Resolutions)*
- ‡ Does the change introduce one of the three object-grain failure modes the page names — global or static state reachable under concurrent access, two-step initialization (constructor plus a separate `init()` before the object is usable), or an API carrying hidden state between calls (`strtok`'s shape)? *(wiki: Temporal Coupling)*
- ‡ Is the *simultaneity* axis asked, not only the ordering one? House-backed since 2026-07-30 — `coupling.md` §Resolutions now names both forms, and the Architecture mandate sweeps both. The page's contribution is the question pair: "Must method A run before method B?" and "**Can two clients call this method at once and remain safe?**" *(wiki: Temporal Coupling)*
- Is the coupled target stable? Cite an observed change history or state the assumption *as* an assumption — never assert it from the code. Spatial types only: temporal coupling is judged on whether the assumption can be violated, not on the target's rate of change. *(`coupling.md` §Stability test, §Before reporting)*
- Does the finding reduce to a catalog smell? Use that to decide what to withhold, never what to name — §F owns the smell name. *(`coupling.md` §Before reporting)*
- Does the patch's evidence survive reverting the patch? Then it is advisory and does not move the verdict. The orchestrator applies this, not this reviewer — §B reports and does not self-classify. *(`panel-review` §3)*

### Production readiness

- Are remote and blocking operations bounded by deadlines or cancellation? *(`engineering_judgment.md` §4)*
- ‡ Does *every* blocking primitive take a timeout — resource-pool checkout and lock acquisition, not only the network call? The no-timeout version of any blocking API "should be labeled `CheckoutAndMaybeKillMySystem`." *(wiki: Stability Patterns §Timeouts)*
- ‡ Is the downstream deadline derived from the caller's remaining time, or is it a fresh independent one? Without propagation the callee keeps working on a request the originator already abandoned. *(wiki: Cascading Failures)*
- ‡ † Where a handler runs in stages, does it re-check the remaining budget between them? The page hedges: "it **may make sense** to check that there is enough time left to handle the request before each stage." *(wiki: Cascading Failures)*
- ‡ † Is the deadline several orders of magnitude longer than the operation's mean latency? That is "usually bad" — a small fraction of hung requests then eats the whole thread budget and most requests fail instead of few. Weak on a diff: the constant is visible, the mean usually isn't. *(wiki: Cascading Failures)*
- Is a retried operation proven safe to repeat, within an explicit attempt or time budget? *(`engineering_judgment.md` §4)*
- ‡ Does the retry use randomised exponential backoff, and does only one layer of the stack retry? "Why do people always forget that you need to add a little jitter?" Three layers retrying three times each is 64 attempts on a dependency that is already returning errors because it is overloaded. *(wiki: Cascading Failures)*
- ‡ † Does the retry happen while the caller waits? "Making the caller wait while you retry is a way to push past *their* timeout" — queue the work and return now with success, failure, or queued-for-later. Hedged on the page: immediate retry is "usually" wrong because production timeouts "almost always" indicate persistent trouble. *(wiki: Stability Patterns §Timeouts)*
- ‡ Does the error the caller sees separate an *application* failure (parameter violation) from a *system* failure (resources unavailable)? The page states this flatly and calls it the "Crucial caveat": an application failure "should NOT trip the breaker", and reporting both as "error" means "a user retrying bad input" needlessly trips an upstream one. Whether the caller should also stop retrying is a different page's claim — see the retriable/non-retriable line below. *(wiki: Stability Patterns §Fail Fast)*
- ‡ Do the response codes separate retriable from non-retriable? "Don't retry permanent errors or malformed requests in the client. Return a specific overload status so callers back off and don't retry." *(wiki: Cascading Failures)*
- ‡ Does a query or collection traversal have a bound? "[I]n any API or protocol, the caller should always indicate how much of a response it's prepared to accept." ORMs bound explicit queries but not collection-following, and a power-law tail never shows up in bell-curve fixtures. *(wiki: Stability Antipatterns §Unbounded Result Sets)*
- ‡ Is a queue between producer and consumer bounded? Unbounded queue length means unbounded response time; a bounded one forces the drop-or-block decision to be made deliberately. *(wiki: Stability Patterns §Create Back Pressure)*
- ‡ Does anything this change accumulates have a matching drain — cache entries over an unbounded key space, rows, log volume? "For every mechanism that accumulates a resource, some other mechanism must recycle that resource." An unbounded cache of an infinite key space is a memory leak in slow motion. *(wiki: Stability Patterns §Steady State)*
- ‡ † Is a new cache a *latency* cache — the system still carries expected load with it empty — or a *capacity* cache? Not a defect either way: the page's rule is that a new cache must be "either latency caches **or** … sufficiently well engineered to safely function as capacity caches." What it warns is that caches "**can** become hard dependencies", and that restarts and new clusters start cold. *(wiki: Cascading Failures)*
- ‡ Does a cleanup block release every resource even when an earlier release throws? A `finally` closing a statement before a connection loses the connection whenever the statement's close throws — that leak is the fault that grounded an airline for three hours. *(wiki: Stability Antipatterns)*
- ‡ Is a side effect outside the database — email, webhook, payment, published event — fired inside a transaction that can still abort? "[T]he email gets sent even if the transaction aborts." *(wiki: Transactions (ACID))* House-backed since 2026-07-31 — `engineering_judgment.md` §4's related-writes rule, and the Architecture mandate sweeps it.
- ‡ Is a retried write idempotent at the application level? The page's other named caveat is the commit-acknowledgement race: "if the server committed but the network dropped before the ack reached the client, retrying causes the transaction to run twice. Need application-level deduplication (operation IDs)." *(wiki: Transactions (ACID))* The concept is house-backed — `engineering_judgment.md` §4's retry-safety rule, checked at the retry line above; the commit-ack race and operation-ID dedup are the page's, and no rules file states them.
- ‡ Does an empty selector mean "nothing" or "everything"? Automation that read an empty set of machines-still-needing-disk-erasure as *all machines* wiped every CDN machine in many colos: "Yes, sometimes zero does mean all." Bulk and destructive operations need a cap on how much one run can touch. *(wiki: Stability Patterns §Governor)*
- † Does dependency failure propagate unchecked, or are there barriers the failure modes justify? Circuit breakers and bulkheads are for "demonstrated propagation risks" — their absence is not a finding on its own. *(`engineering_judgment.md` §4)*
- † Does the patch itself add a manual, repeatable step to operating the system — a runbook entry, a hand-run migration, a config edit per deploy? Toil as a standing goal is not reviewable and the Architecture mandate says to skip it; toil this diff *creates* is. *(`engineering_judgment.md` §4)*
- Is the change safe to deploy through the project's documented route? *(`engineering_judgment.md` §4)*
- Is a shared-contract change safe in **both** directions across the rollout window — old code serving while the new shape is live, and a rollback that does not revert a migration? *(`engineering_judgment.md` §4)*
- Do two or more writes that must hold together survive a failure between them without leaving observable half-applied state — a transaction where one store covers them, or a durably recorded pending write driven to completion outside the request (within a budget) or an undo step where it doesn't? Where the same site's defect is instead that the consumer can't run without the provider, that correctness rests on the writes' fixed order, or that two callers may interleave unsafely, that's Operational or temporal coupling — see Coupling above, not this line. *(`engineering_judgment.md` §4)*
- ‡ Is the migration additive only, with drops, `NOT NULL`, and new constraints deferred to a later contraction release? Expansion ships before the rollout starts and is a no-op for the old code; contraction ships after no instance of the old code remains. Where both versions write during the window, is there a shim keeping the old and new shapes in step? *(wiki: Schema Evolution)*
- ‡ Does the change tighten what a live endpoint accepts, or drop a field it returns? "You can always accept more than before, never less." / "You can always return more than before, never less." And once live, the implementation is the spec — "as soon as the service went live, its implementation becomes the de facto specification", so tightening validation to finally match the documentation is still a breaking change. *(wiki: Schema Evolution)*
- ‡ Does a read-modify-write pass through a typed model that does not know every field? Decoding into model objects and re-encoding silently drops the fields the model has never heard of. The application may be ignorant of a field; it must not delete it on round-trip. *(wiki: Schema Evolution)*
- ‡ In a tag-numbered format, is every new field optional-or-defaulted, and is a removed field's tag retired rather than reused? Old writers never wrote the new field; old data still carries the retired tag. *(wiki: Schema Evolution)*
- ‡ Is work that is not yet user-facing hidden at *runtime* rather than left half-wired on trunk? "Work that isn't yet user-facing hides at runtime, not in source control — feature flags, branch-by-abstraction, dark launches." *(wiki: Trunk-Based Development)* — and the mechanism has a preference order: "**Dark launching** — code is deployed but not wired in / not discoverable. **Branch by abstraction** … **Feature flags** … Adopt roughly in that order; feature flags are what everyone reaches for first but they introduce the 'which version do you test?' problem." *(wiki: Continuous Delivery §Separation of deployment from release)* Deployable-vs-released is `engineering_judgment.md` §4's, checked above.

---

## §C Spec conformance — `code-reviewer`, Spec mandate

Authority: the spec at the supplied path, plus the `/grill` hardened-design doc when one
exists. Cite a spec clause in every finding.

**Provenance: transcribed.** The `panel-review` Spec mandate states these as questions
already; this is close to a copy of it.

- Is each requirement's *behavior* present, not merely code that looks like it? *(`panel-review` §2)*
- Is anything built that no requirement asks for?
- Is this the simplest thing that satisfies the spec? *(`engineering_judgment.md` §3, `coding_style.md` §1)*
- Does the diff add or change behavior with no test movement? Name the requirement left unpinned — Minor unless a spec clause requires the coverage.
- ‡ Does the change add a degraded, fallback, or error path that nothing exercises? "The code path you never use is the code path that (often) doesn't work." The page's remedy for a degraded *mode* is operational — "regularly run a small subset of servers near overload to exercise the path" — but it prescribes tests for the failure path itself: "Test how the frontend behaves if the noncritical backend never responds (blackholing requests)." Narrower than the line above it, which asks about behavior generally. *(wiki: Cascading Failures)*
- Is an apparent miss actually an implementation decision or a spec-authorized deferral recorded in the grilled design doc? Then it is not a miss.
- Does the grilled doc change scope or acceptance criteria? It cannot — the spec governs. *(`panel-review` §1)*

---

## §D Security — `code-reviewer`, Security mandate

Every finding needs a concrete attack path: input → effect. No "consider hardening X"
without one.

**Provenance: mixed.** The first five lines are *transcribed* — the `panel-review` Security
mandate enumerates injection, authn/authz gaps, unsafe external input, secrets exposure,
and attacker-reachable wrong logic. The error-response line is **derived**; I added it from
`coding_style.md` §2e, and no mandate names it. The `‡` lines are from the wiki's OWASP
Top 10 chapter and have no rules file behind them at all.

There is still no security rules file. Before the `‡` lines, this axis rested on the mandate
text alone, which made it the thinnest-backed section here; the wiki lines give it
substance without giving it authority.

**The source has a currency problem, and it is the sharpest one in this file.** The chapter
is the 2018 second edition, and its enumeration is OWASP's *"Release Candidate 1"* — which
the chapter itself hedges ("There's still considerable debate, so the list here … may not be
the one that gets adopted") and which was **not** adopted. Two of its entries were dropped
from the final 2017 list, and 2021 restructured again. Faithful citation is not currency:
several lines below are true to the chapter and dated against 2026 defaults, and each says
so inline. Treat those as prompts to check the framework's current behavior, not as
findings on their own.

- Injection — is untrusted input concatenated into SQL, a shell command, a template, or a path?
- Authentication and authorization — is there a route, operation, or object reachable without the check that governs it? *(`coding_style.md` §2b)*
- Is external input handled unparsed, or parsed for shape but not destination — SSRF to link-local space, path traversal out of a root? *(`coding_style.md` §2c)*
- Are secrets exposed — logged, committed, returned in a response, or embedded in a client bundle?
- Is there plausible-but-wrong logic an attacker can reach — an off-by-one in a bounds check, a comparison that fails open? *(`engineering_judgment.md` §6)*
- Does an error response leak internal structure — stack traces, driver messages, schema names? *(`coding_style.md` §2e)*
- ‡ Does the service authorize the *object*, or does it treat possession of the URL as the grant? "[Y]our service must make that check on every request … URLs are just text strings, and anybody can create whatever URL they like!" An API that authorizes a link on the way out has to reauthorize the request that comes back in. *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ † Do "not authorized" and "does not exist" respond identically? "**Rule of thumb:** If a caller is not authorized to see the contents of a resource, it should be as if the resource doesn't even exist." A 403/404 split lets an attacker count your customers, or probe a login endpoint to learn which harvested emails are yours. *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ Is user data escaped on the way *out*, at every sink — server-rendered HTML, client-side DOM insertion, admin screens, log viewers? "[N]ever trust input. Scrub it on the way in and escape it on the way out." Stored payloads execute later, in a higher-privileged reader's browser. *(Dated: the input-scrubbing half is the part current guidance has moved away from, in favour of context-aware output encoding. The escaping half is the durable one.)* *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ Is an XML parser configured against external entities? "Most XML parsers are vulnerable to XXE injection by default. You need to configure them to be safe." The path: an attacker submits a document whose external entity reads `file:///etc/passwd`, and "hopes that the error response from the endpoint will contain the offending input, with the external entity expanded." *(Dated: several runtimes now disable DTD processing by default — check yours rather than assuming the chapter's premise.)* *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ Is a filesystem path built from a client-supplied filename? "The only safe way to handle file uploads is to treat the client's filename as an arbitrary string to store in a database field. Don't build a path from the filename in the request. Generate a unique, random key for the real filename and link it to the user-specified name in the database." (The generic traversal case is above; this is the upload-specific remedy, and it is also the passage that ties traversal to process privilege — see Candidates.) *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ Are session ids drawn from a cryptographic PRNG? "Generate session IDs using a pseudorandom number generator (PRNG) with good cryptographic properties. Your language's built-in `rand()` function probably isn't it." The chapter scopes this to session ids; other secrets are outside what it establishes. *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ Is a fresh session id issued at authentication? "When a user authenticates, generate a fresh session ID. That way, if a session fixation attack occurs, the attacker will not have access to the user's account." *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ † Does a new cookie-authenticated state-changing route carry CSRF protection? The path: "[a]n attacker uses a web page with JavaScript, CSS, or HTML that includes a link to your system… the user's browser will send all the usual cookies, including session cookies." Heavily hedged on both ends — the chapter opens "most web frameworks automatically include defenses" and says only that you "might have to enable" it, and the residual 2026 surface is narrower still now that `SameSite` defaults block the classic cross-site form POST. Does not apply to bearer-token APIs. *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*
- ‡ Is a caller trusted for where it came from? "Don't trust calls based on their originating IP addresses" — internal services still authenticate their callers; there is no secure perimeter to sit inside. In practice the reachable version is a forwarded-header allowlist a proxy doesn't strip, or an SSRF pivot from a trusted host, rather than raw source-IP spoofing. *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*

---

## §E Testing — `testing-reviewer`

Authority: `testing/00-index.md` and the modules it routes to. That file carries the same
list as its §Pre-commit checklist, phrased for the author rather than the reviewer — edits
belong there too, since that is the copy the reviewer loads.

**Provenance: transcribed.** The strongest-backed section here. `testing/00-index.md`
§Pre-commit checklist is already a walk-list of questions, `00-index.md` labels its own
non-negotiables, and the smell and anti-pattern entries are enumerated lists in `01` §8,
`02` §8, and `03` §9–10. Almost nothing unmarked below is my inference. The `‡` lines come
from the wiki and are not in the corpus at all.

Two places where this section deliberately departs from a straight transcription, because a
reviewer cannot do what the author-facing text asks: the non-negotiables here are five where
`00-index.md` has four (its first, "TDD is the default workflow", is about a transcript a
reviewer doesn't have), and F.I.R.S.T. is scoped to I/R/S below for the same reason. So the
counts do not match, on purpose.

**Force:** the checklist is scoped — "test-type-specific items do not apply to every test",
and an item that doesn't apply is neither pass nor fail. But "unknown" is not done either:
name the evidence that would settle it.

### Non-negotiables — a violation here is a Blocker, not a checklist item

- Do tests describe observable behavior rather than implementation? *(`testing/00-index.md`, `03-test-aesthetics.md` §1)*
- Is any framework mock standing in for code we own? *(`testing/00-index.md`, `02-mocking-roles.md` §6)*
- Do application-level integration and end-to-end tests reach the system through a Harness and Driver? *(`testing/01-architecture-and-harness.md` §1)*
- Does every test have visible Arrange / Act / Assert structure and a declarative behavior name? *(`testing/00-index.md`)*
- Is the assertion's outcome independent of the subject? A **Blocker** wherever found — it claims false safety. *(`panel-review` §3)*

### Structure and naming

- Does the test satisfy **I**ndependent, **R**epeatable, **S**elf-validating? *(`testing/00-index.md`)* **Fast** and **Timely** are out of a reviewer's reach: Fast is a measurement, and Timely means "written just before the production code it describes" — the same transcript `00-index.md` tells a reviewer to skip when reviewing a suite they did not write.
- Is the top-level describe the symbol under test, or the route path for an HTTP endpoint? *(`03-test-aesthetics.md` §3.1)*
- Are test names lowercase, declarative, third-person-present clauses — no `should`, no method-name echoes, no trailing period? *(`03-test-aesthetics.md` §3.3)*
- Are Arrange / Act / Assert visible as three phases separated by blank lines, or is the test trivial enough to collapse? *(`03-test-aesthetics.md` §4.1–4.2)*
- One behavior per test? *(`03-test-aesthetics.md` §4.3)*
- Does the same behavior across many inputs use the framework's parameterized primitive — one generated test per row — rather than a loop of asserts? *(`03-test-aesthetics.md` §4.7)*
- Happy path first, edge cases in nested `when` blocks at the bottom, error cases in their own block? *(`03-test-aesthetics.md` §4.4)*
- Are values local to each test unless setup is genuinely shared, with shared mutable state reset before each test? *(`03-test-aesthetics.md` §4.5)*
- Does the test read at the domain level rather than the framework level? *(`03-test-aesthetics.md` §7)*

### Architecture and harness

- Is the application hand-wired in the test body instead of obtained from a Harness? *(`01-architecture-and-harness.md` §1, §5)*
- Does each Driver expose a raw or error-returning operation, with a success convenience only where it removes repeated boilerplate? *(`01-architecture-and-harness.md` §7.2, §7.5)*
- Does a Driver return a typed public contract rather than an unvalidated response body? *(`01-architecture-and-harness.md` §7.3)*
- Does a Driver assert transport contracts only, leaving domain content to the test? *(`01-architecture-and-harness.md` §7.4)*
- Is shared Fake state reset, and an isolation mechanism applied to every managed dependency? *(`01-architecture-and-harness.md` §6)*
- Is the Harness owned in `beforeAll` and torn down in `afterAll` — never module-global? *(`01-architecture-and-harness.md` §5)*
- Are overrides passed as functional options at `setup()` time rather than hand-registered in the test or grown into boolean flags? *(`01-architecture-and-harness.md` §5)*
- Are ports allocated dynamically for end-to-end runs? *(`01-architecture-and-harness.md` §5)*
- Is a **managed** dependency (our DB, our cache namespace) run real under isolation, and an **unmanaged** one (third-party API, payment, email) faked? Both inversions are defects. *(`01-architecture-and-harness.md` §4)*
- For a user-visible vertical slice, did the work start outside-in; for local behavior, at the narrowest observable layer? *(`01-architecture-and-harness.md` §3)*
- Is this test earning its place on the pyramid, or could it run one layer down? *(`01-architecture-and-harness.md` §2)*

### Doubles and verification

- Is a framework mock used for a dependency we own? Replace with a Fake. *(`02-mocking-roles.md` §6)*
- Is a third-party type mocked outside a focused adapter contract test? Wrap it in an owned interface and fake that port. *(`02-mocking-roles.md` §3, §6)*
- Does the Fake implement the real interface, with explicit seed and `reset()` methods? *(`02-mocking-roles.md` §4)*
- Is the Fake injected through DI rather than import-time module patching? *(`02-mocking-roles.md` §5)*
- Is the double named for its actual role — Dummy, Stub, Fake, Spy, or Mock? *(`02-mocking-roles.md` §1)*
- Could this verification be output-based instead of state- or communication-based? *(`02-mocking-roles.md` §2)*
- Is the assertion on observable behavior, or coupled to a private method call, internal field, or exact call sequence? *(`03-test-aesthetics.md` §1)*
- Is an error compared against a typed instance or exported sentinel rather than substring-matched on its message? *(`03-test-aesthetics.md` §5.2)*
- † Do full-object assertions use structural equality, escaping to a containment matcher for fields that are "volatile **or irrelevant**"? §5.1 is headed "**Prefer** structural equality" and says deep-equal "when you can". *(`03-test-aesthetics.md` §5.1)* — note `testing/00-index.md` line 116 states the escape as "only for volatile fields", dropping the irrelevance half; §5.1 is the more specific file and governs. The false positive this creates is in §G.
- At a protocol boundary, do assertions run in order — protocol shape, then observable state, then captured side-effects? *(`03-test-aesthetics.md` §5.3)*
- Is faking done at the I/O boundary rather than at every class boundary? *(`02-mocking-roles.md` §7)*
- ‡ For an external provider, is conformance tested on both halves separately — that requests are built to the provider's spec, and that the caller handles every response the spec permits — rather than one round-trip test that asserts on a response derived from its own request? A round-trip test verifies the loop works today; it verifies neither side's conformance to the contract. *(wiki: Schema Evolution)*

### Legacy code — pin the behavior before changing it

Every line here is `‡`. Nothing in `testing/` mentions characterization tests, and the whole
subsection is the Feathers lineage rather than the Meszaros one the smell list below draws on.
It fires only when the diff touches code that has no tests — on a suite that already has
coverage, none of it applies.

- ‡ Does the change alter code with no tests over it, without first pinning what that code currently does? "To me, *legacy code* is simply code without tests." The bind the technique answers: "When we change code, we should have tests in place. To put tests in place, we often have to change code." *(wiki: Characterization Test)*
- ‡ Does the new test assert what the code *should* do, where what was needed is what it *does*? A characterization test documents present behavior, bugs included: "We aren't trying to find bugs right now. We are trying to put in a mechanism to find bugs later, bugs that show up as differences from the system's current behavior." The page is explicit that this feels wrong — "The expected values that we're putting in our tests could just simply be wrong" — and that it is the point. The algorithm, quoted as the page numbers it: "2. Write an assertion that you know will fail. 3. Let the failure tell you what the behavior is. 4. Change the test so that it expects the behavior that the code produces." *(wiki: Characterization Test)*
- ‡ † Does the pinning test exercise the path the change will actually move? "The most valuable characterization tests exercise a specific path and exercise each conversion along the path" — path coverage alone misses silent type conversions. And the check on the check: "ask yourself whether there is any other way that the test could pass, aside from executing that branch." Weak on a diff, since which branch runs needs an execution the reviewer cannot perform; name the branch and the doubt, never the verdict. *(wiki: Characterization Test)*
- ‡ Was new behavior written inline into an untested method, rather than sprouted into a new method or class and developed test-first? Feathers's threshold for sprouting: "Whenever you can see the code that you are adding as a distinct piece of work or you can't get tests around a method yet. It is far preferable to adding code inline." *(wiki: Adding Features to Legacy Code)*
- ‡ Where the change *did* sprout or wrap, is the call site left uncovered? That is the technique's own stated liability, not a bonus finding: "unless you cover the code that calls it, you aren't testing its use. Use caution." The new code is tested; the seam between new and old is not. *(wiki: Adding Features to Legacy Code)*

### Test smells

- **Obscure Test** — is the subject lost in setup noise? *(`03-test-aesthetics.md` §9)*
- **Eager Test** — does one test verify multiple unrelated behaviors? *(`03-test-aesthetics.md` §9)*
- **Mystery Guest** — does the test depend on data it didn't create? *(`01-architecture-and-harness.md` §8)*
- **Fragile Test** — are assertions on observable behavior, or on something an unrelated refactoring would move? Stated statically, because whether it *does* break needs a run nobody here can perform. *(`03-test-aesthetics.md` §9, routing to §1)*
- **Assertion Roulette** — can the failure message identify which assertion fired? *(`03-test-aesthetics.md` §9)*
- **Hard-Coded Test Data** — are magic IDs, timestamps, and names scattered through the body? *(`03-test-aesthetics.md` §9)*
- **Free Ride** — is a new assertion piggy-backed onto an existing test because the state was already there? *(`03-test-aesthetics.md` §9)*
- **Conditional Test Logic** — is there `if`, `for`, `switch`, or `try`/`catch` in the test body? *(`03-test-aesthetics.md` §4.6)*
- **Trivial Test** — does it assert a language-level assignment with negligible regression value? *(`03-test-aesthetics.md` §9)*
- **Interacting Tests** — must one test run before another? *(`01-architecture-and-harness.md` §8)*
- **Resource Leakage** — are ports, pools, or goroutines left open across suites? *(`01-architecture-and-harness.md` §8)*
- **Slow Test** — can the assertion move down the pyramid? *(`01-architecture-and-harness.md` §8)*
- **Erratic / Flaky Test** — is there a non-deterministic seam with no injected Fake: wall clock, random, hash ordering, network, shared global state? Name the seam and the line, never the verdict "this test is flaky" — that claim needs a run. *(`01-architecture-and-harness.md` §8)*
- **Test Code Duplication** — is the same setup or assertion sequence cloned across tests instead of lifted into a shared helper? *(`testing/00-index.md` §Smells and anti-patterns — the mandated citation: no sub-module names this smell, and the testing reviewer is told to cite `00-index` when no module smell fits)*
- **Test Logic in Production** — is there an `if env == "test"` branch in domain code? *(`01-architecture-and-harness.md` §8)*
- ‡ **Production Logic in Test** — does the test compute its expected value by re-running the SUT's own logic? (On the page this is a cause of *Conditional Test Logic*, not of Test Logic in Production; it sits here for proximity, not lineage.) "If the SUT changes, both production and test compute the same wrong answer; the test silently goes along." The expected value has to come from somewhere other than the SUT's code path. *(wiki: Code Test Smells)*
- ‡ **Equality Pollution** — has a production `equals`/`hashCode` been widened or narrowed to make an assertion pass? Production equality semantics are now set by the tests. *(wiki: Code Test Smells)*
- ‡ **For Tests Only** — does the production interface expose a getter, setter, or reset method that only test code calls? Another sub-cause of Test Logic in Production that the `if env == "test"` phrasing above does not catch. Boundary: `03-test-aesthetics.md` §2 tells authors to *add* an accessor when behavior isn't observable through the public API — that accessor is legitimate. The smell is one that exists only to reach state production never reads. *(wiki: Code Test Smells)*
- ‡ **Test Dependency in Production** — does production code reference a test helper or a test-framework type? Often arrives when test classes share a package with production classes for visibility. *(wiki: Code Test Smells)*

### Anti-patterns

- Is a private method tested directly? *(`03-test-aesthetics.md` §10)*
- Is coverage percentage being chased in place of sharp assertions? *(`03-test-aesthetics.md` §10)*
- Is a domain test asserting on rendered log text? *(`03-test-aesthetics.md` §10)*
- Is there a sleep-based wait rather than a wait on a condition? *(`03-test-aesthetics.md` §10)*
- Does a test branch on environment? *(`03-test-aesthetics.md` §10)*
- Is there a module-level fixture mutated by one test and read by another? *(`03-test-aesthetics.md` §10)*
- Was test pain silenced with more mocks instead of fixing the design smell it named? *(`03-test-aesthetics.md` §2)*
- Is the DI container rebuilt in every `beforeEach`? *(`testing/00-index.md`)*

---

## §F Structure — `refactoring-reviewer`

Authority: `refactoring/00-index.md` and the `catalog/` document for each named
refactoring. Fowler 2nd ed. only — nothing outside it may be cited. A finding names the
smell, then the refactoring that removes it, with mechanics precise enough for a fresh
session.

**Provenance: transcribed.** All 24 smells are verbatim from `refactoring/00-index.md`
§Smells, which is an enumerated list, and the reviewer's own definition scopes it to them.

**Force: the whole section is `†`.** `engineering_judgment.md` §3 calls smells "design
heuristics", and `panel-review` §3 says refactoring severity "measures friction cost, not
defect severity" — every item here is advisory unless the patch introduced it. A smell is a
reason to look, never a verdict.

- **Mysterious Name** — does the name force reading the body or call sites?
- **Duplicated Code** — is the same *knowledge* expressed in more than one place?
- **Long Function** — does the function's intent drown in its implementation?
- **Long Parameter List** — are call sites hard to write and read?
- **Global Data** — is mutable state assignable from anywhere?
- **Mutable Data** — is a value updated in place, so no reader can trust it?
- **Divergent Change** — is one module edited for several unrelated kinds of change?
- **Shotgun Surgery** — does one logical change force small edits across many modules?
- **Feature Envy** — is a function more interested in another module's data than its own?
- **Data Clumps** — do the same values travel together through signatures and records?
- **Primitive Obsession** — are domain concepts carried as bare strings and numbers?
- **Repeated Switches** — is the same conditional dispatch duplicated?
- **Loops** — does an imperative loop obscure what a pipeline would state?
- **Lazy Element** — does a structure still pay for the indirection it adds?
- **Speculative Generality** — was flexibility built for a future that never arrived?
- **Temporary Field** — is a field meaningful only in certain circumstances?
- **Message Chains** — does a client navigate object to object to reach what it needs?
- **Middle Man** — do a class's methods mostly forward somewhere else?
- **Insider Trading** — do modules trade in each other's internals instead of through public interfaces?
- **Large Class** — does one class hold too many fields and responsibilities?
- **Alternative Classes with Different Interfaces** — do interchangeable classes have mismatched signatures?
- **Data Class** — are there fields and accessors with the behavior living elsewhere?
- **Refused Bequest** — does a subclass use little of what its parent provides?
- **Comments** — is prose deodorizing code that should explain itself?

Conditions on each finding:

- The named refactoring's `catalog/` document is read before it is cited. *(`refactoring/00-index.md`)*
- The site list is complete for a cross-file smell; an under-inclusive list understates the finding.
- Evidence surviving a revert of the patch makes the finding advisory. A two-line edit inside a pre-existing 300-line function did not introduce Long Function. The orchestrator applies this, not this reviewer. *(`panel-review` §3)*

---

## §G Not findings — every axis

Flagging one of these is a false positive.

**Provenance: transcribed.** `code-reviewer.md` §What NOT to flag is an enumerated list,
and `coupling.md` §Before reporting is an explicit gate. These are the corpus's own words.

- **Missing comments, docstrings, or file headers.** Comments default to zero. Flag a comment only when its *absence* lets the code be silently misread. *(`coding_style.md` §1)*
- **Missing validation between the code's own producer and consumer.** Validate at real system boundaries only. *(`coding_style.md` §1)*
- **Missing scalability or extensibility hooks for a hypothetical future.** Speculative generality is the smell, not the fix. *(`engineering_judgment.md` §2)*
- **A coupling type that is not present.** Report the defects; never enumerate absences. *(`panel-review` §2)*
- **Coupling to a *spatial* type whose target is stable.** That is a design choice. Say so and move on. Temporal coupling is not covered: it is judged on whether the ordering or concurrency assumption can be violated. *(`coupling.md` §Before reporting)*
- **A "prefer X" resting on neither a rule nor a concrete failure.** Drop it. *(`code-reviewer.md`)*
- **A structural smell reported by an axis that does not own it.** §A names nothing from the Fowler catalog; §B names the coupling type, not the smell. *(`panel-review` §2, `coupling.md` §Before reporting)*
- **A deploy-compatibility or call-deadline finding reported by the Style axis.** `coding_style.md` §1 routes a shared contract to `engineering_judgment.md` §4; §2c states the deadline rule itself. Both are the Architecture mandate's. Reading a rule in a file you loaded is not owning the check. *(`panel-review` §2)*
- **An exception's design-decision judgment reported by the Style axis.** `coding_style.md` §1 routes a suppression, exclusion, or shim to `engineering_judgment.md` §5; the evidence-bar judgment is the Architecture mandate's. Style reports the sighting only. *(`panel-review` §2)*
- **A write-sequence defect reported as a coupling type, or the reverse.** Distinct defects at the same site, distinct dispositions — the write-sequence check is verdict-bearing with no revert test, a coupling finding is revert-tested and can land advisory. Report each under its own name; §3's same-`file:line` dedup does not merge them. *(`panel-review` §2–3)*

Four more, all `‡` — every page that yields a rule also names where the rule does not fire,
and these were harvested with the rules above them:

- ‡ **Logic in services where the project chose Transaction Script.** Anemia needs two commitments, and the first is having chosen a domain model: "Choosing Transaction Script explicitly puts the logic in scripts (services); that's not anemia, that's just Transaction Script." §B's own line on matching structure to the problem calls transaction script right for CRUD — then the anemic-domain lines fire on it anyway. *(wiki: Anemic Domain Model)*
- ‡ **Authorisation running before the parse.** Not shotgun parsing: "Authorisation may have to run *before* parsing user input (denial-of-service mitigation). That's fine: authorisation has small surface area and shouldn't modify state." *(wiki: Parse, Don't Validate (King 2019))*
- ‡ **A direct `logger` call in technical code.** The domain-probe rule is "inviolable for domain code, not necessarily for technical / plumbing code. If a class is about HTTP request routing or database connection pooling, calling `logger.error(...)` directly is fine." *(wiki: Domain-Oriented Observability)*
- ‡ **A full structural-equality assertion, reported as comparing too much.** Meszaros's *Sensitive Equality* would call it one; `03-test-aesthetics.md` §5.1 makes deep-equal the default and routes the irrelevant-field case to a containment matcher. The corpus has already settled Meszaros against the other schools — don't re-litigate it in a review. Reversed: a full-object assertion over fields irrelevant to *this* test's concern is still a finding, under §5.1's own "volatile or irrelevant" escape. *(wiki: Behavior Test Smells)*

---

## Candidates — not adopted

Proposed checks with no rule behind them yet — nothing checks these today. Promote a line
by writing the rule into its authority file first, then moving the line up.

- Are functions under ten lines? Fowler rejects line-count thresholds in favor of "does the name say more than the body" (`refactoring/catalog/extract-function.md`), and `code-reviewer.md` §What NOT to flag routes function length away from the Style axis entirely. Adopting this needs a bullet in `coding_style.md` §1 and an amendment to that carve-out — otherwise the check can never fire.
- Does the change pick a storage model without the access pattern that justifies it — read versus write-heavy, consistency needs, cross-entity queries? `engineering_judgment.md` §1 states the rule ("Don't pick storage first", *(See: DDIA / Kleppmann)*), and it is diff-visible whenever a schema or a new store lands. What blocks it is ownership, not backing: §1 is loaded by no axis. §A reaches its one §1 rule — domain-language naming — only because the `panel-review` Style mandate quotes that rule inline, and no mandate quotes this one. Adopting it needs either a bullet in `engineering_judgment.md` §2, which the Architecture mandate does load, or a second inline quote in the mandate.
- ‡ Are custom assertions and test-utility helpers themselves tested? Meszaros: "It's important that test code be testable, too" — logic moved out of a test body into a helper has left the reach of the suite that would catch it going wrong. No section owns this: §E's authority never asks for tests of test code, and adopting it needs a bullet in `testing/03-test-aesthetics.md` first. *(wiki: Code Test Smells)*
- ‡ Does the process run with the lowest privilege it needs — a non-root container user, one OS user per application? "Software that runs as root is automatically a target." The attack path §D's mandate requires is in the same passage §D quotes for uploads — a traversal-bearing filename lets "the caller … overwrite any file the service is allowed to modify … (Yet another reason to *not* run as root!)" — input to effect, with privilege bounding the effect. Diff-visible too: a Dockerfile with no `USER`, `runAsUser: 0`, a unit file with `User=root`. What it lacks is an owner. Promoting it needs a security rules file, which does not exist. *(wiki: `raw/Release-It-16-Chapter-11-Security.md`)*

---

## Sources

Every wiki page a `‡` line cites, with the content hash `qmd get` printed at the time it was
read. Re-check with `qmd get "<uri>" | head -1`. A changed hash does not mean a line is
wrong — it means the page moved and nobody has looked since, so the lines citing it are
unverified until someone does.

**Read** is the honest extent, not the intent. *whole* means the full document was read in
one or more passes. *section* means only part of it was, and lines citing that page carry
correspondingly less weight.

| Page (`qmd://wiki/…`) | Hash | Read | Date |
|---|---|---|---|
| `pages/Adding-Features-to-Legacy-Code.md` | `#dd853c` | whole | 2026-07-30 |
| `pages/Aggregate.md` | `#017d9e` | whole | 2026-07-29 |
| `pages/Anemic-Domain-Model.md` | `#ad27ea` | whole | 2026-07-29 |
| `pages/Anti-Corruption-Layer.md` | `#967c9d` | whole | 2026-07-29 |
| `pages/Behavior-Test-Smells.md` | `#239752` | whole | 2026-07-29 |
| `pages/Cascading-Failures.md` | `#48ae4f` | whole | 2026-07-29 |
| `pages/Characterization-Test.md` | `#0a4ab7` | whole | 2026-07-30 |
| `pages/Code-Comments.md` | `#ff4c78` | whole | 2026-07-29 |
| `pages/Code-Test-Smells.md` | `#d20d86` | whole | 2026-07-29 |
| `pages/Continuous-Delivery.md` | `#061f2a` | **section** — §Separation of deployment from release only | 2026-07-29 |
| `pages/Design-Patterns.md` | `#f0ab3e` | **section** — through §Learning and use; §Pattern community history and §Norvig's critique unread | 2026-07-30 |
| `pages/Domain-Oriented-Observability.md` | `#ce7fb8` | whole | 2026-07-29 |
| `pages/Erich-Gamma.md` | `#bdb938` | whole | 2026-07-30 |
| `pages/Parse-Don-t-Validate-King-2019.md` | `#7a5965` | whole | 2026-07-29 |
| `pages/Schema-Evolution.md` | `#20b202` | whole | 2026-07-29 |
| `pages/Seam-Model.md` | `#fbac9f` | whole | 2026-07-30 |
| `pages/Stability-Antipatterns.md` | `#3eeb88` | whole | 2026-07-29 |
| `pages/Stability-Patterns.md` | `#c56afe` | whole | 2026-07-29 |
| `pages/Temporal-Coupling.md` | `#aa31ab` | whole | 2026-07-29 |
| `pages/Transactions-ACID.md` | `#20415d` | whole | 2026-07-29 |
| `pages/Trunk-Based-Development.md` | `#b2034d` | whole | 2026-07-29 |
| `raw/Release-It-16-Chapter-11-Security.md` | `#fbf668` | whole | 2026-07-29 |

Traps:

- **`qmd get` with a bare path fuzzy-matches.** `pages/Stability-Patterns.md` returns
  `pages/Design-for-Testability-Patterns.md` — no error, plausible-looking content. Pass the
  full `qmd://` URI and check the header names what you asked for; that header is where the
  hash above comes from. Since 2026-07-30 there is a second collection (`prompts`,
  `~/code/prompt-wiki`), so a bare path can now land in a different *subject*, not just a
  different page — and a bare `qmd query` searches both regardless of working directory.
  Every `‡` line in this checklist means collection `wiki`; see `using_the_wiki.md`.
- **A hash proves retrieval, not truth.** A page can be unchanged, faithfully cited, and
  built on a source that has since been superseded — §D is the live case. This table answers
  provenance only; currency is a separate question and each line owns it.
