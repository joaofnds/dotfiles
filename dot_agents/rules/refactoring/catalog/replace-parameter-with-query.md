# Replace Parameter with Query

**Smells:** Long Parameter List
**Inverse:** Replace Query with Parameter
**Improves:** maintainability: callers stop supplying what the callee can determine, shrinking every call site

## When to apply

- A parameter's value is derivable from another parameter or from state the callee
  already holds: callers pass `order` *and* `order.customer.discountRate`. The extra
  parameter is caller busywork and an inconsistency risk (what if they disagree?).
- The parameter exists because the caller "already had the value handy": convenience
  that outlived its context and now just lengthens the list.
- Direction against Replace Query with Parameter is settled by dependency comfort: if
  the callee resolving the value itself creates no unwanted dependency, fewer
  parameters win.

## When not to apply

- Removing the parameter forces the callee to reach for something it should not know:
  a global, a service, another module's internals. Trading a parameter for a hidden
  dependency makes the function less pure and harder to test; that trade runs the
  other refactoring's direction.
- The parameter deliberately decouples: callers pass a value *so that* the callee
  stays ignorant of where it comes from (a clock, a config source). The "redundancy"
  is the seam.
- The derivation is expensive or must be consistent across one transaction: computing
  once and passing it fixes the value; querying may not.

## Mechanics

1. If the value's computation is tangled in the caller, extract it into a query the
   callee can call (Extract Function).
2. In the callee, replace each use of the parameter with the query; run the tests.
3. Remove the parameter via Change Function Declaration; update callers, deleting
   their now-unused derivation code.

## Example

Before: the caller passes what the order already knows:

```js
const rate = order.customer.discountRate;
const price = discountedPrice(order, rate);

function discountedPrice(order, discountRate) {
  return order.baseTotal * (1 - discountRate);
}
```

After:

```js
const price = discountedPrice(order);

function discountedPrice(order) {
  return order.baseTotal * (1 - order.customer.discountRate);
}
```

## House-rule interactions

- `engineering-judgment.md`: code is a liability: a parameter is caller-facing
  code at every call site; removable ones should be removed.
- `coding-style.md`: control non-deterministic side effects: clocks, random
  sources, and network reads are the parameters this refactoring must *not* absorb:
  their explicitness is what keeps tests deterministic, per "When not to apply."
