# Replace Magic Literal

**Smells:** Mysterious Name
**Inverse:** none
**Improves:** readability — the code states the meaning, not just the number that happens to encode it

## When to apply

- A literal carries domain meaning a reader cannot recover from the value alone:
  `9.81`, `86400`, `"E"`, `0.15`. The name says what the value *is for*; the literal
  only says what it equals.
- The same meaningful literal appears in several places and must change together —
  a named constant makes the shared knowledge explicit and the change atomic.
- The literal participates in a comparison that is really a domain question:
  `status === "P"` wants to be `isPending(status)` or a named constant.

## When not to apply

- The literal is self-evident in context: `0` as an initial count, `1` as a step,
  `""` as an empty starting string. `const ZERO = 0` explains nothing and adds an
  indirection.
- The name would just restate the value (`const FIFTEEN_PERCENT = 0.15`) — that is
  renaming the number, not naming the meaning. The name must be `STANDARD_DISCOUNT`,
  or it is not worth having.
- Two occurrences of the same number encode *different* facts — one `7` is a week,
  another is a retry limit. Naming them separately is right; sharing one constant
  welds unrelated knowledge together.

## Mechanics

1. Declare a constant named for the meaning, assigned the literal.
2. Replace each occurrence that carries *that* meaning — check every candidate
   individually rather than search-and-replacing the value.
3. Run the tests.

## Example

Before — what is 0.35?

```js
function payout(sale) {
  return sale.amount * 0.35;
}
```

After:

```js
const AFFILIATE_COMMISSION_RATE = 0.35;

function payout(sale) {
  return sale.amount * AFFILIATE_COMMISSION_RATE;
}
```

## House-rule interactions

- `coding_style.md:14` — comments default to zero: `0.35 // commission rate` is this
  refactoring left half-done; the name replaces the comment.
- `engineering_judgment.md:41` — DRY is about knowledge, not code: one constant per
  fact, even when two facts share a value — the occurrence check in the mechanics
  exists to honor this rule.
