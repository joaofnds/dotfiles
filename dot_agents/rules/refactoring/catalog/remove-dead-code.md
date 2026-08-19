# Remove Dead Code

**Smells:** Speculative Generality
**Inverse:** none
**Improves:** maintainability: readers stop spending attention on code that never runs

## When to apply

- No execution path reaches the code: an unreferenced function, an unused export, a
  branch whose condition can no longer hold, a parameter nothing passes.
- The code is commented out. Commented-out code is dead code with extra steps; version
  control already remembers it.
- A feature was removed but its scaffolding lingers: configuration keys, handlers,
  helper functions that only the removed feature called.

## When not to apply

- Reachability is asserted, not verified. "Nothing calls this" requires a probe: grep
  for callers, dynamic dispatch, reflection, route tables, and external entry points
  (public API, scheduled jobs, other repos) before deleting.
- The code is behind a feature flag awaiting release; that is unreleased, not dead.
  Deployment and release are separate decisions; check which one this code is waiting
  on.
- The code implements a contractual interface member that callers resolve dynamically
  even though no static reference exists.

## Mechanics

1. Verify deadness with a named probe: search for every reference, including string
   references for anything resolved dynamically.
2. Delete the code: do not comment it out, do not "keep it just in case." Version
   control is the archive.
3. Delete whatever the deletion orphaned: imports, helpers with no remaining caller,
   tests that only exercised the deleted path.
4. Run the tests and the type checker; a survivor referencing the deleted code is
   either a missed caller or more dead code.

## Example

Before: the fax path outlived the fax feature:

```js
function sendReceipt(order, channel) {
  if (channel === "fax") {
    return faxGateway.send(order); // removed from the UI in 2023
  }
  return mailer.send(order.customer.email, receiptFor(order));
}
```

After:

```js
function sendReceipt(order) {
  return mailer.send(order.customer.email, receiptFor(order));
}
```

## House-rule interactions

- `engineering_judgment.md`: code is a liability: dead code is the pure case, all
  maintenance cost and no behavior. When in doubt, delete.
- `engineering_judgment.md`: facts before theories: deadness is an empirical claim;
  the deletion is justified by the probe's result, never by memory of the call graph.
- `coding_style.md`: surgical execution names leaving no dead imports behind from
  your own changes; this refactoring is that duty applied to code others left behind.
