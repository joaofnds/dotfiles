# Replace Query with Parameter

**Smells:** Global Data, Mutable Data
**Inverse:** Replace Parameter with Query
**Improves:** testability: the function's inputs become its signature, so it can be exercised with plain values

## When to apply

- The function reaches out, to a global, a module-level config, a clock, an
  environment read, and that hidden input makes it unpredictable from its call site
  and unpluggable in tests. Hoisting the read to the caller turns hidden state into an
  explicit argument.
- You are dismantling a dependency: the callee should stop knowing about some object,
  so its callers take over supplying the value (dependency direction repair at
  function scale).
- The function wants referential transparency, same arguments, same result, and one
  internal query is all that prevents it.

## When not to apply

- The hoist just moves the problem: if every caller must now perform the same global
  read, the coupling has multiplied, not vanished. Push the read to the few places
  that own the value, or inject the source instead (constructor injection for
  long-lived collaborators).
- The value must be resolved at execution time, not call time: deferred work, retry
  loops, and queues may run long after the caller's snapshot went stale.
- Direction against Replace Parameter with Query is settled by what the callee may
  know: parameters for what should be outside its knowledge, queries for what is
  legitimately its own.

## Mechanics

1. Extract the body's use of the query result into a variable at the top (Extract
   Variable makes the seam visible).
2. Add a parameter for the value; replace the internal query with the parameter.
   Callers now perform the query. Run the tests.
3. Clean both sides: delete the callee's access to the source entirely; simplify
   callers that already had the value.

## Example

Before: the tax rule reads ambient state:

```js
function netPrice(order) {
  return order.total * (1 + globalConfig.taxRate);
}
```

After: the input is visible and controllable:

```js
function netPrice(order, taxRate) {
  return order.total * (1 + taxRate);
}
```

## House-rule interactions

- `coding_style.md`: control non-deterministic side effects: "pass clocks,
  network clients, and random or ID generators explicitly"; this refactoring is that
  rule's mechanical form for any hidden input.
- `coding_style.md`: inject side-effecting or replaceable dependencies: for a
  long-lived collaborator, constructor injection is the sibling move; a per-call
  parameter suits values, injection suits sources.
- `engineering_judgment.md`: listen to the tests: needing to monkey-patch a
  global to test a function is the harness reporting this refactoring's trigger.
