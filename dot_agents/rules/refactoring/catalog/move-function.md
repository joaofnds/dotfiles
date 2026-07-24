# Move Function

**Smells:** Feature Envy, Shotgun Surgery, Insider Trading, Divergent Change
**Inverse:** none
**Improves:** maintainability — the function lives with the data and neighbors it actually works with, so changes stay local

## When to apply

- A function references another module's data or functions more than its own home's —
  the classic Feature Envy read. Move it to where its interest lies.
- One logical change keeps touching this function *and* a cluster in another module;
  co-locating them turns a multi-module edit into a local one.
- Two modules keep whispering through each other's internals. Moving the trespassing
  function inside the boundary replaces the whispering with a public interface.

## When not to apply

- The function uses both modules roughly equally. Moving it just reverses the envy;
  consider Extract Function to split it along the module seam first.
- The "envy" is a deliberate pattern — a mapper or anti-corruption layer *exists* to
  read another model's fields. Translation code at a boundary is doing its job, not
  smelling.
- The target module should not know about the source's types — a move that reverses a
  dependency direction is an architecture change, not a tidy-up.

## Mechanics

1. Examine everything the function uses in its current home; consider whether any of it
   should move along (move the most dependent pieces first if so).
2. Copy the function into the target module; adjust it to its new home (parameters for
   what it can no longer see, renames to fit the target's vocabulary).
3. Make the source function delegate to the new one. Run the tests.
4. Migrate callers to the new location, testing as you go; then delete the delegating
   stub — or keep it when external callers make removal a separate task.

## Example

Before — a billing function that only reads customer data:

```js
// billing.js
function loyaltyDiscount(order) {
  const years = order.customer.memberSince.yearsUntil(today());
  return Math.min(years * 0.01, 0.1);
}
```

After — moved to the module whose data it envied:

```js
// customer.js
function loyaltyDiscountFor(customer) {
  const years = customer.memberSince.yearsUntil(today());
  return Math.min(years * 0.01, 0.1);
}
```

## House-rule interactions

- `coding_style.md:58` — Tell, Don't Ask: a function interrogating a neighbor's
  internals is the asking this rule forbids; moving it inside the neighbor turns the
  interrogation into behavior offered by the role.
- `coding_style.md:66` — put domain behavior with the model it governs; Move Function
  is the mechanical step that enforces it.
- `engineering_judgment.md:23` — dependencies point inward: verify the move does not
  make a domain module import an adapter. A move that fixes envy but reverses an arrow
  is a worse trade.
