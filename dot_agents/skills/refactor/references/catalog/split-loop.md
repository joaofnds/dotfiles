# Split Loop

**Smells:** Long Function, Divergent Change
**Inverse:** none
**Improves:** readability: each loop answers one question instead of braiding several

## When to apply

- One loop accumulates two or more unrelated results. Splitting gives each result its
  own loop, each readable, and changeable, in isolation.
- You want to extract the computations into named functions (the usual follow-up:
  Extract Function per loop), and the shared loop body is what blocks the extraction.
- A modification needs to touch only one of the braided concerns; splitting first makes
  that change small instead of surgical-inside-a-shared-body.

## When not to apply

- The iterations are genuinely one computation: a running value where each concern
  feeds the other. If the halves cannot execute independently, there is nothing to
  split.
- The loop body's work is dominated by an expensive shared step (a network call per
  item, a heavy parse); doubling the traversal doubles that cost. Measure first;
  and if the split still pays, hoist the expensive step instead of abandoning the
  refactoring.
- The collection is a one-shot stream that cannot be traversed twice; buffer it first
  or leave the loop fused.

## Mechanics

1. Copy the loop verbatim below the original.
2. Delete from the first loop the statements serving the second concern, and from the
   second the statements serving the first. Run the tests.
3. Remove now-unused variables from each loop's scope.
4. Consider Extract Function on each loop: the split usually exists to enable it.

## Example

Before: one loop, two questions:

```js
let total = 0;
let oldest = Infinity;
for (const member of members) {
  total += member.balance;
  if (member.joined < oldest) oldest = member.joined;
}
```

After:

```js
let total = 0;
for (const member of members) total += member.balance;

let oldest = Infinity;
for (const member of members) {
  if (member.joined < oldest) oldest = member.joined;
}
```

## House-rule interactions

- `the doctrine skill`: facts before theories: the performance objection to a
  second traversal is a hypothesis; splitting is reverted only on a measured regression
  in a workload that represents the real caller, not on instinct.
- `the style skill`: Beck's ordering: two simple loops beat one entangled loop on
  reveals-intent, and no duplication is created: the iterations repeat, the knowledge
  does not.
