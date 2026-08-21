# Move Statements to Callers

**Smells:** Divergent Change
**Inverse:** Move Statements into Function
**Improves:** maintainability: behavior that no longer belongs to every call stops being imposed on every caller

## When to apply

- A function bundles behavior that used to suit all callers, but a new or changed
  caller needs the core without the trimming. The bundled statements have become a
  per-caller decision.
- The function's edges (its first or last statements) vary by circumstance while the
  middle is stable: a sign the boundary was drawn one statement too wide.
- Direction against Move Statements into Function is settled by uniformity: behavior
  every caller repeats moves in; behavior only some callers want moves out.

## When not to apply

- All callers still need the statements. Moving them out then just manufactures the
  duplication the inverse refactoring exists to remove.
- The divergence is better served by a parameter or a second function: hoisting
  statements to many call sites multiplies edit points; prefer it when callers are few.
- The statements are entangled mid-function, not at its edges. Restructure the function
  first (Slide Statements) until the movable part sits at a boundary.

## Mechanics

1. For one or two callers: cut the edge statements from the function and paste them at
   each call site. Run the tests.
2. For more: extract the statements that stay into a new function, so the original
   becomes "statements + call". Migrate every caller from the original to the new
   function, adding the hoisted statements only where wanted, testing per caller.
3. Delete the original function and rename the new one to take its name.

## Example

Before: `notify` forces a log entry on every caller:

```js
function notify(user, message) {
  channel.send(user.address, message);
  activityLog.record(user.id, "notified");
}
```

After: the digest job wants no activity entries:

```js
function notify(user, message) {
  channel.send(user.address, message);
}
notify(user, alertText);
activityLog.record(user.id, "notified");

notify(user, digestText);
```

## House-rule interactions

- `engineering-judgment.md`: orthogonality: hoisting statements to N call sites
  creates N edit points for one rule; acceptable only because the rule genuinely became
  per-caller; if it ever re-unifies, apply the inverse.
- `coding-style.md`: surgical execution: migrate the callers this task touches;
  when other teams' call sites are affected, the delegating stub stays until their
  migration is agreed.
