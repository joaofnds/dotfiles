# Replace Error Code with Exception

**Smells:** Duplicated Code, Shotgun Surgery
**Inverse:** none
**Improves:** resilience — a failure cannot be silently ignored, and propagation stops being every caller's manual duty

## When to apply

- A function signals failure with a sentinel (`-1`, `null`, `{ ok: false }`) and
  every caller up the chain repeats the same check-and-forward boilerplate. Each
  intermediate level is a place to forget the check; exceptions propagate without
  anyone's cooperation.
- A missed check has already caused a silent failure downstream — the incident that
  proves the sentinel is unsafe in this codebase.
- The condition is genuinely exceptional: callers cannot reasonably act on it locally,
  so the handler lives levels above.

## When not to apply

- The "failure" is an expected outcome of the domain — validation findings, a lookup
  that legitimately misses. Expected outcomes are return values (or result types);
  reaching for exceptions here turns normal control flow into hidden gotos.
- The language or codebase idiom handles errors as values (Go's `error`, result
  types) — the equivalent refactoring there is making the error impossible to ignore
  in that idiom, not importing exceptions.
- No caller boilerplate exists — one caller checking one code is fine as is.

## Mechanics

1. Put a handler at the level that can actually respond, catching the
   exception-to-be.
2. Change the function to throw a distinct error type instead of returning the code.
   Run the tests — existing sentinel checks should now be unreachable.
3. Delete the sentinel checks and manual forwarding at each intermediate level,
   testing as each layer is cleaned.

## Example

Before — each layer must remember to forward the sentinel:

```js
function reserve(sku, qty) {
  if (stock(sku) < qty) return -1;
  return createReservation(sku, qty);
}
const r = reserve(sku, qty);
if (r === -1) return -1; // and so on, at every level
```

After — only the responder mentions the failure:

```js
function reserve(sku, qty) {
  if (stock(sku) < qty) throw new OutOfStockError(sku);
  return createReservation(sku, qty);
}
// intermediate layers say nothing; the checkout endpoint catches OutOfStockError
```

## House-rule interactions

- `coding_style.md:54` — error translation at boundaries: the thrown type must be a
  stable application/port error; letting driver or HTTP errors fly raw just moves the
  problem.
- `coding_style.md:44` — "use domain errors only for domain outcomes": the same
  boundary discipline that governs which failures deserve an exception at all.
- `engineering_judgment.md:62` — narrows future bugs: the forgotten-check class
  disappears structurally instead of being reviewed for.
