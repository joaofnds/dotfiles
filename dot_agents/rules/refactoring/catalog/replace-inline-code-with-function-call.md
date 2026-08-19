# Replace Inline Code with Function Call

**Smells:** Duplicated Code
**Inverse:** none
**Improves:** maintainability: one implementation of the behavior remains, and every caller inherits its fixes

## When to apply

- A block of code re-implements what an existing function already does, whether a
  sibling in the codebase or a standard-library capability (`includes`, `Math.max`,
  a date helper). Replace the block with the call; the duplicate can no longer drift.
- You just extracted a function elsewhere (Extract Function's final mechanic step is
  exactly this refactoring applied to the remaining duplicates).
- The inline block predates a library adoption: hand-rolled logic the platform now
  provides.

## When not to apply

- The resemblance is coincidence: the block looks like the function but encodes a
  different rule that happens to share its steps today. Calling the function welds the
  two rules together, and the next change to one silently changes the other.
- The existing function is wrong, deprecated, or belongs to a module this code must
  not depend on: a call that reverses a dependency arrow costs more than the
  duplication.

## Mechanics

1. Verify semantic equivalence, not just textual similarity: same edge cases, same
   boundary behavior (empty input, off-by-one, error handling).
2. Replace the inline block with the call.
3. Run the tests: a failure here usually means step 1 was wrong and the block was
   not a true duplicate; revert and reconsider rather than patching the callee.

## Example

Before: a hand-rolled scan for something the platform does:

```js
let hasRefund = false;
for (const tx of transactions) {
  if (tx.type === "refund") {
    hasRefund = true;
  }
}
```

After:

```js
const hasRefund = transactions.some((tx) => tx.type === "refund");
```

## House-rule interactions

- `engineering_judgment.md`: DRY is about knowledge, not code: the entire
  judgment in this refactoring is deciding whether the block and the function encode
  the same rule; when they don't, the rule instructs leaving them apart.
- `engineering_judgment.md`: don't fight your tools: hand-rolled equivalents of
  platform capabilities are the small-scale version of the workaround habit that rule
  flags; prefer the platform call.
