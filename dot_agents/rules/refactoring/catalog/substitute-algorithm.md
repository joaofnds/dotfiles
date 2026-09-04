# Substitute Algorithm

**Smells:** Long Function
**Inverse:** none
**Improves:** maintainability: a clearer algorithm is one future readers can modify without archaeology

## When to apply

- A simpler way to do the whole thing exists: the convoluted implementation grew by
  accretion, and rewriting the unit beats incremental tidying. This is the wholesale
  move in a catalog of incremental ones: use it when piecemeal refactoring would fight
  the algorithm's basic shape.
- A library or platform facility now does what the code hand-rolls (the block-scale
  sibling of Replace Inline Code with Function Call).
- The algorithm must change functionally anyway, and the current implementation is too
  tangled to change safely: substitute for clarity first, then make the functional
  change on clean ground.

## When not to apply

- The behavior is not pinned by tests. A rewrite without a safety net is a gamble,
  not a refactoring: write characterization tests first
  (`~/.agents/rules/testing/references/characterization-tests.md`).
- You don't fully understand what the current algorithm does, including its warts:
  some caller may depend on an edge behavior the "clearly better" version drops.
  Understand first; the substitution must be an equivalence you can defend.
- The old algorithm's complexity serves a measured performance need the simple one
  cannot meet.

## Mechanics

1. Confirm the unit is covered by tests that pin current behavior, edge cases
   included; add characterization tests where coverage is thin.
2. Reduce the method to the smallest substitutable unit (extract it if it is embedded).
3. Write the replacement alongside the original.
4. Run the tests against the replacement. On divergence, compare the two on the
   failing input: decide whether the difference is a dropped wart (fix the
   replacement) or an accidental behavior nobody wants (document the intentional
   change, which makes this step a behavior change, not part of the refactoring).
5. Delete the original.

## Example

Before: accumulated special-casing:

```js
function firstMatch(people, wanted) {
  for (let i = 0; i < people.length; i++) {
    if (people[i] === "Don") return "Don";
    if (people[i] === "John") return "John";
    if (wanted.includes(people[i])) return people[i];
  }
  return "";
}
```

After: the special cases were just membership:

```js
function firstMatch(people, wanted) {
  const candidates = ["Don", "John", ...wanted];
  return people.find((p) => candidates.includes(p)) ?? "";
}
```

## House-rule interactions

- `engineering-judgment.md`: never program by coincidence: substituting an
  algorithm you haven't fully understood is that rule's named time bomb.
- `engineering-judgment.md`: prefer removing the cause over compensating: where
  incremental cleanups would each compensate for the algorithm's shape, substitution
  removes the shape.
