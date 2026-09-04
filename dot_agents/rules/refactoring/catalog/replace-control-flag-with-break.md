# Replace Control Flag with Break

**Smells:** Mutable Data
**Inverse:** none
**Improves:** readability: control flow reads from the control statements, not from a variable's life story

## When to apply

- A boolean variable exists only to steer execution: set in one place, tested in the
  loop condition or downstream `if`s, meaning nothing in the domain. `found`, `done`,
  `keepGoing`: the reader must trace its assignments to know what the code does.
- The flag simulates an exit the language provides natively: `break` for stopping a
  loop, `return` for leaving a function with an answer, `continue` for skipping.
- The flag survives the loop to signal the outcome: usually the loop plus flag wants
  to be an extracted function that simply returns the outcome.

## When not to apply

- The variable carries a domain fact rather than steering flow: `isEligible`
  computed for later business use is data, not a control flag, and deleting it loses
  meaning.
- Multiple loops or async steps legitimately coordinate through the condition; the
  restructure must not scatter one decision across several exits. Extract first, then
  see if a plain `return` serves.

## Mechanics

1. If the flagged code has enough around it, extract the loop and its flag into a
   function (Extract Function) so an early `return` is available.
2. Replace each assignment-plus-later-test with the direct exit: `break`, `continue`,
   or `return` at the point the decision is made. Run the tests after each.
3. Delete the flag and any tests of it that remain.

## Example

Before: `found` steers, but only its biography says so:

```js
let found = false;
for (const account of accounts) {
  if (!found && account.frozen) {
    alertSecurity(account);
    found = true;
  }
}
```

After:

```js
for (const account of accounts) {
  if (account.frozen) {
    alertSecurity(account);
    break;
  }
}
```

## House-rule interactions

- `coding-style.md`: boring control flow, "early returns over clever
  expression-level tricks": the flag is the opposite of boring, flow encoded as
  mutable state, and this refactoring restores the plain form.
- `coding-style.md`: move understanding into the code: what the flag made the
  reader reconstruct (when does this loop actually stop?) the `break` states at the
  exact spot it happens.
