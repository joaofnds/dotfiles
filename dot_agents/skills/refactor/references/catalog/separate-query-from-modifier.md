# Separate Query from Modifier

**Smells:** Mutable Data
**Inverse:** none
**Improves:** testability: a pure query can be called anywhere, any number of times, with nothing to undo

## When to apply

- One function both returns a value and changes observable state: callers who only
  want the answer get the side effect anyway, and callers must know the hidden pairing
  to use it safely. Splitting yields a query callable freely and a modifier called
  deliberately.
- A caller has appeared that needs the value *without* the effect (or the effect
  without the value): the demand that proves the bundling wrong.
- The side effect is the surprising kind: a getter that increments, a check that
  logs, a find that marks. Surprise in a query is the smell at its strongest.

## When not to apply

- The value *is* a receipt of the modification: an ID from an insert, the popped
  element of a stack. Splitting `pop` into `peek` + `drop` may serve no caller and
  introduces a race window in concurrent use.
- Atomicity matters: when ask-then-act can interleave with other actors, the combined
  operation is the correct design (compare Replace Exception with Precheck's racy
  cases).

## Mechanics

1. Copy the function; name the copy as a pure query for the value it returns.
2. Strip every side effect from the query. Run the tests.
3. In the original, strip the return value; it is now the modifier, named as a
   command.
4. Migrate each caller: queries where only the value was wanted, modifier where only
   the effect, both (query then modifier) where genuinely both. Test per caller.

## Example

Before: asking the total also stamps the audit:

```js
function totalOutstanding(customer) {
  audit.record("balance-check", customer.id);
  return customer.invoices.reduce((sum, inv) => sum + inv.due, 0);
}
```

After: reading is free; recording is a choice:

```js
function totalOutstanding(customer) {
  return customer.invoices.reduce((sum, inv) => sum + inv.due, 0);
}
function recordBalanceCheck(customer) {
  audit.record("balance-check", customer.id);
}
```

## House-rule interactions

- `the doctrine skill`: listen to the tests: a value assertion that cannot
  run without stubbing a side effect is this smell speaking through the harness; the
  split is the design fix, not more mocking.
- `the style skill`: Beck's ordering: the second function is an added element
  bought by intent-revelation: each name now tells the whole truth about what calling
  it does.
