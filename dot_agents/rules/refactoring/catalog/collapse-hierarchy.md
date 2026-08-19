# Collapse Hierarchy

**Smells:** Lazy Element, Speculative Generality
**Inverse:** Extract Superclass
**Improves:** maintainability: one class replaces a parent-child pair whose distinction stopped mattering

## When to apply

- A class and its parent have grown so similar that the boundary between them carries
  no information: refactorings drained one into the other, or the anticipated
  variants never arrived and a hierarchy of one is all that remains.
- Readers must check both classes to understand either: the split costs two lookups
  and buys no separation of concerns.
- Direction against Extract Superclass is the usual inverse-pair judgment: extract
  when duplication between siblings demonstrates a missing parent; collapse when an
  existing parent-child boundary demonstrates nothing.

## When not to apply

- Other subclasses still hang off the parent: collapsing one child into it changes
  every sibling's inheritance. The move collapses a *pair*, not a family.
- The "empty" parent is a published extension point or contract type that external
  code subclasses or references; its emptiness is its job.
- The distinction is dormant but scheduled: a variant is genuinely arriving (not
  speculatively "someday"). Judge by the same evidence bar as any YAGNI call.

## Mechanics

1. Choose the survivor, usually whichever name the domain actually uses.
2. Move every member of the other class into the survivor (Pull Up / Push Down
   Method and Field as direction dictates), testing after each move.
3. Retarget references from the removed class to the survivor.
4. Delete the empty class. Run the tests.

## Example

Before: a parent invented for a second child that never came:

```js
class Party {
  constructor(name) { this.name = name; }
}
class Organization extends Party {
  constructor(name, vatId) { super(name); this.vatId = vatId; }
}
```

After:

```js
class Organization {
  constructor(name, vatId) { this.name = name; this.vatId = vatId; }
}
```

## House-rule interactions

- `engineering_judgment.md`: YAGNI: the empty layer is preserved speculation, and
  this refactoring is the cleanup crew.
- `engineering_judgment.md`: code is a liability: a class boundary is code too;
  when it separates nothing, it only charges comprehension rent.
- `coding_style.md`: Beck's ordering: pure fewest-elements win: no intent lives
  in the boundary, so nothing is lost by removing it.
