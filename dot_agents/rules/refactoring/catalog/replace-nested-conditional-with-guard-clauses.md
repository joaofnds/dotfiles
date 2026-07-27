# Replace Nested Conditional with Guard Clauses

**Smells:** Long Function
**Inverse:** none
**Improves:** readability — special cases exit at the top, and the main path runs unindented as the function's story

## When to apply

- The function's real work sits nested inside layers of `if` — each layer handling an
  unusual case while the common path drifts rightward. Guards flip the structure:
  check the unusual, leave, continue flat.
- The branches are not peers: one path is the point of the function, the others are
  early outs (missing data, permissions, degenerate inputs). Nesting presents them as
  equals; guards present them as the asides they are.
- A single-exit habit is producing result variables threaded through arms — the
  structure exists to avoid `return`, not to express the domain.

## When not to apply

- The branches *are* peers — two legitimate outcomes of equal standing. A guard would
  demote one arbitrarily; keep the `if`/`else` (or see Decompose Conditional).
- The "guard" would hide a rule that deserves prominence — an early return for a
  condition central to the domain buries the lede.

## Mechanics

1. Pick the outermost special case; rewrite it as a guard clause that returns (or
   throws) immediately. Run the tests.
2. Repeat inward, one condition per step, un-nesting the main path as you go.
3. If guards accumulate on related conditions, consolidate them (Consolidate
   Conditional Expression).
4. Delete result variables the flattening made unnecessary.

## Example

Before — the payout logic hides two levels deep:

```js
function payout(employee) {
  let result;
  if (!employee.separated) {
    if (!employee.retired) {
      result = computePayout(employee);
    } else result = 0;
  } else result = 0;
  return result;
}
```

After:

```js
function payout(employee) {
  if (employee.separated) return 0;
  if (employee.retired) return 0;
  return computePayout(employee);
}
```

## House-rule interactions

- `coding_style.md` — boring control flow names "early returns" as the house
  default; this refactoring is that clause applied to inherited nesting.
- `coding_style.md` — Beck's ordering: no elements added — pure intent-revelation
  through structure, the cheapest win in the catalog.
