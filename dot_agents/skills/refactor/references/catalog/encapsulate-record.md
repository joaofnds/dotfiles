# Encapsulate Record

**Smells:** Data Class, Mutable Data
**Inverse:** none
**Improves:** maintainability: consumers depend on an interface, so the stored shape can evolve behind it

## When to apply

- A mutable bare record is read and written across the codebase; every consumer is
  coupled to its exact field layout, so reshaping it means touching them all. Wrapping
  it lets the stored shape change while accessors keep their contract.
- Some fields are stored while others should be derived: an object can hide which is
  which; a record cannot.
- The record needs invariants (fields that must change together, values that must stay
  in range) and currently trusts every writer everywhere to maintain them.

## When not to apply

- **`the style skill`'s "solely to satisfy this document" outranks the book here**: an immutable record passed around as
  a value is fine as it is; wrapping it in a class because "records should be
  encapsulated" is class-introduction to satisfy a document. The trigger is mutation
  plus reach, not the existence of a record.
- The record is a local or short-lived shape (a function's return bundle, a parsed
  intermediate); it has no update paths to guard.

## Mechanics

1. Encapsulate the variable holding the record (Encapsulate Variable), so access runs
   through functions.
2. Replace the raw record with a class holding it; expose accessor methods for each
   used field. Run the tests.
3. Migrate consumers from raw field access to the accessors, testing as you go:
   deep-reading consumers (nested structures) migrate innermost first.
4. Once no one touches the raw data, the internal shape is yours: derive fields,
   split storage, add invariants.

## Example

Before: every consumer writes any field, no invariant holds:

```js
const account = { balance: 500, overdraftLimit: 100 };
account.balance -= 700;
```

After: updates pass through the rule:

```js
class Account {
  constructor(balance, overdraftLimit) {
    this.#balance = balance; this.#overdraftLimit = overdraftLimit;
  }
  withdraw(amount) {
    if (this.#balance - amount < -this.#overdraftLimit) throw new Error("over limit");
    this.#balance -= amount;
  }
  get balance() { return this.#balance; }
  #balance; #overdraftLimit;
}
```

## House-rule interactions

- `the style skill`: do not introduce classes solely to satisfy a document: the
  class must be bought by demonstrated update paths and invariants, per "When not to
  apply."
- `the style skill`: behavior lives with data: the anemic-model rule is why the
  wrapper should immediately attract the update logic (like `withdraw`), not remain a
  bag of getters and setters: that would trade one Data Class for another.
