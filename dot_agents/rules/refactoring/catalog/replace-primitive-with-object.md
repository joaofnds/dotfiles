# Replace Primitive with Object

**Smells:** Primitive Obsession, Duplicated Code
**Inverse:** none
**Improves:** maintainability — behavior about the concept accretes on its type instead of scattering across consumers

## When to apply

- A domain concept rides in a bare string or number, and logic about it (validation,
  comparison, formatting, range rules) is duplicated wherever the primitive travels.
  The second copy of that logic is the trigger.
- The primitive has an invalid subspace — not every string is a phone number, not
  every number is a quantity — and each consumer currently re-checks or, worse,
  trusts.
- Two primitives travel together to mean one thing (amount + currency): that pair
  wants to be a value object before a mismatch bug arrives.

## When not to apply

- **`coding_style.md`'s "solely to satisfy this document" outranks the book**: a primitive that is only stored and
  displayed, with no behavior and no invalid states worth rejecting, does not need a
  type. Wrap when behavior demonstrates the need, not on principle.
- The language's type system offers a cheaper fence — a union of literals, a branded
  type — that rejects invalid values at compile time without a runtime object.

## Mechanics

1. Encapsulate the variable or field holding the primitive (Encapsulate Variable).
2. Create a small value class: constructor validates, value is immutable, equality is
   by content.
3. Change the holder to store the object while accessors still return the primitive —
   consumers are undisturbed. Run the tests.
4. Migrate consumers that want behavior onto the object's methods; move the duplicated
   logic in as you reach each consumer.

## Example

Before — every consumer re-implements priority ordering:

```js
if (["high", "rush"].includes(order.priority)) expedite(order);
```

After — the concept owns its rules:

```js
class Priority {
  static #order = ["low", "normal", "high", "rush"];
  constructor(value) {
    if (!Priority.#order.includes(value)) throw new Error(`bad priority: ${value}`);
    this.value = value;
  }
  higherThan(other) {
    return Priority.#order.indexOf(this.value) > Priority.#order.indexOf(other.value);
  }
}
if (order.priority.higherThan(new Priority("normal"))) expedite(order);
```

## House-rule interactions

- `coding_style.md` — leverage the type system: an opaque string sniffed at each
  use is a runtime cast in disguise; parsing once into a real type at the boundary is
  the sanctioned shape.
- `coding_style.md` — the class must be earned by demonstrated duplicated behavior
  or invalid states, never introduced for taxonomy.
- `coding_style.md` — safe parsing at boundaries: the value object's validating
  constructor is where "never let raw external data cross into the domain" gets
  enforced for this concept.
