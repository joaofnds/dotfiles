# Introduce Assertion

**Smells:** Comments
**Inverse:** none
**Improves:** resilience: an assumed invariant becomes a checked one, so violations surface at the cause instead of downstream

## When to apply

- A section of code only works if something holds, a value is non-negative, a
  collection is sorted, an ID was validated upstream, and that assumption lives
  nowhere but the author's head or a comment. An assertion states it executably.
- During debugging: an assertion at the suspected invariant converts "I think this
  can't happen" into an experiment (see also Replace Derived Variable with Query,
  whose mechanics lean on exactly this).
- The invariant is programmer-facing truth about the code's internal state: the kind
  of thing that, when false, means a bug exists, not that input was bad.

## When not to apply

- The condition can legitimately be false at runtime: user input, external data,
  remote responses. That is validation, belongs at the boundary, and must not be
  compiled away or disabled the way assertions may be.
- The assertion would encode a business rule consumers rely on; rules belong in the
  domain model where they always execute.
- Asserting everything: a thicket of trivial assertions buries the load-bearing one.
  Assert what a colleague would be surprised to learn can fail.

## Mechanics

1. State the assumption as a boolean expression over reachable state.
2. Insert the assertion at the earliest point the assumption must hold.
3. Confirm the program's behavior does not depend on the assertion executing (no side
   effects in the expression); the code must run identically with assertions stripped.
4. Run the tests; and treat any firing as a found bug, not as a case to handle.

## Example

Before: the discount math quietly assumes an applied rate:

```js
function discountedTotal(order) {
  // rate is set during qualification
  return order.total * (1 - order.discountRate);
}
```

After: the assumption is stated and checked:

```js
function discountedTotal(order) {
  console.assert(order.discountRate >= 0, "qualification must set discountRate");
  return order.total * (1 - order.discountRate);
}
```

## House-rule interactions

- `coding_style.md`: safe parsing at boundaries: external data gets schema
  validation there, never assertions; this refactoring is for invariants *inside* the
  trusted zone.
- `coding_style.md`: comments default to zero: an assumption comment is the weak
  form of this refactoring; the assertion both documents and enforces.
