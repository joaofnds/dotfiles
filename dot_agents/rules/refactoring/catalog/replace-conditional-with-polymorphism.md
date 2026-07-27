# Replace Conditional with Polymorphism

**Smells:** Repeated Switches, Long Function
**Inverse:** none
**Improves:** maintainability — adding a case becomes adding a type, not editing every switch that dispatches on it

## When to apply

- The same `switch` (or `if`/`else` ladder) over the same type-like value appears in
  several places. Each new case means finding and editing all of them; polymorphic
  dispatch collapses that to one new implementation. *Repeated* is the operative word.
- A base behavior has variant overrides — most cases act alike, some differ.
  Inheritance (or delegation) expresses "like the general case except…" directly.
- The conditional legs keep growing their own logic, each becoming a paragraph inside
  a function that dispatches between them.

## When not to apply

- **One switch, one place**: a single conditional over a closed set is clear, honest
  code — `coding_style.md`'s "solely to satisfy this document" forbids conjuring a class hierarchy to satisfy a
  principle. The duplication of the dispatch is what buys the hierarchy.
- The cases vary by data, not behavior — a lookup table (rates by plan) does the job
  with zero structure.
- The target language renders it differently, and the finding must too: in Go or
  class-light TypeScript this refactoring produces an interface with per-case
  implementations or a function table, not a subclass tree.

## Mechanics

1. If the dispatch value is a bare code, establish a type per case first (Replace
   Type Code with Subclasses, or one object/function per case in a table).
2. Create the polymorphic method on the base; move one case's leg into its type's
   implementation. Run the tests.
3. Repeat per case; leave the general behavior on the base if one exists.
4. Delete the conditional; construction (a factory) now picks the implementation.

## Example

Before — the same dispatch, already in two functions:

```js
function speed(bird) {
  switch (bird.type) {
    case "european": return 35;
    case "african": return 40 - 2 * bird.coconuts;
  }
}
```

After — one entry per kind; new kinds don't edit existing code:

```js
const birds = {
  european: (b) => 35,
  african: (b) => 40 - 2 * b.coconuts,
};
const speed = (bird) => birds[bird.type](bird);
```

## House-rule interactions

- `coding_style.md` — the hierarchy (or table) is an introduced element; a single
  non-repeated switch does not pay for it. The finding must show the repetition.
- `engineering_judgment.md` — program to interfaces, encapsulate what varies:
  this refactoring is that principle's canonical mechanical form.
- `coding_style.md` — leverage the type system: in typed languages, prefer the
  rendering where the compiler proves every case is handled (sealed unions,
  exhaustive interfaces) over string-keyed tables.
