# Replace Derived Variable with Query

**Smells:** Mutable Data
**Inverse:** none
**Improves:** maintainability: a computed value cannot be stale, so no update site can forget it

## When to apply

- A variable holds a value derivable from other data, and every mutation of the source
  must remember to update it. Each update site is a chance to forget; a query has no
  update sites.
- The derived value has already drifted once: a bug where the total and the items
  disagreed is this refactoring's strongest evidence.
- The stored value exists "for convenience" with no measured cost behind it.

## When not to apply

- The computation is demonstrably expensive on a demonstrated hot path, and the cached
  value is a deliberate, measured optimization. Then the pair (cache + invalidation)
  is a design decision: document it as such and keep the assertion from the mechanics
  as a guard.
- The source data for the derivation is itself transient (consumed streams, cleared
  buffers) so the value cannot be recomputed later. That is a snapshot, not a derived
  variable.

## Mechanics

1. Identify every update site of the derived variable.
2. Write a function that computes the value from its sources.
3. Add an assertion that the stored value equals the query's result; run the system
   and the tests to shake out disagreements (Introduce Assertion).
4. Replace readers of the variable with calls to the query, testing as you go.
5. Delete the variable and every update to it. Run the tests.

## Example

Before: `total` must be maintained by every mutation:

```js
const cart = { items: [], total: 0 };
function addItem(cart, item) {
  cart.items.push(item);
  cart.total += item.price;
}
```

After: the total cannot disagree with the items:

```js
const cart = { items: [] };
function addItem(cart, item) {
  cart.items.push(item);
}
function cartTotal(cart) {
  return cart.items.reduce((sum, item) => sum + item.price, 0);
}
```

## House-rule interactions

- `engineering_judgment.md`: a good change narrows the space of future bugs: the
  entire class "update site forgot the derived value" is eliminated, not patched.
- `engineering_judgment.md`: facts before theories: the performance case for
  keeping the stored value must be measured under a representative workload, never
  assumed from the shape of the loop.
