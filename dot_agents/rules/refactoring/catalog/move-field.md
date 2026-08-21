# Move Field

**Smells:** Shotgun Surgery, Insider Trading, Data Clumps
**Inverse:** none
**Improves:** maintainability: data sits on the record whose changes it follows, so one edit reaches it

## When to apply

- Whenever you pass one record's field alongside another record into functions, the
  field is telling you where it wants to live.
- A change to one record forces a synchronized change to a field kept on another:
  the two are one concept split across two homes.
- The field is updated by, guarded by, or only meaningful through another record's
  behavior; ownership follows the behavior.

## When not to apply

- The field is shared context, not owned data: configuration read by many records
  belongs to neither of them; moving it around just relocates the awkwardness.
- The move would put domain data onto an infrastructure or wire-format record,
  coupling the domain shape to a boundary shape.
- The source record is about to be dissolved anyway (Inline Class); do the bigger move
  once instead of relocating fields one at a time.

## Mechanics

1. Encapsulate the field on its source record so every access runs through functions.
2. Create the field on the target record, reachable from the source (directly or via
   an existing link).
3. Point the source's accessors at the target's field. Run the tests.
4. Migrate users of the source accessors to the target where they have natural access
   to it; remove the source accessors and field when no user remains.

## Example

Before: the discount rate lives on the customer but belongs to the plan:

```js
const customer = {
  name: "Ana",
  plan: { tier: "gold" },
  discountRate: 0.15,
};
const price = base * (1 - customer.discountRate);
```

After:

```js
const customer = {
  name: "Ana",
  plan: { tier: "gold", discountRate: 0.15 },
};
const price = base * (1 - customer.plan.discountRate);
```

## House-rule interactions

- `engineering-judgment.md`: orthogonality, one change one place: the trigger for
  this refactoring is exactly the scattered-edit signal that rule names, and the move
  is its structural cure.
- `coding-style.md`: domain models keep raw database schemas and wire formats out;
  a field move whose target is a persisted or serialized shape needs the corresponding
  migration treated as part of the change, not discovered after it.
