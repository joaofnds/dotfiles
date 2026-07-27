# Introduce Special Case

**Smells:** Duplicated Code, Repeated Switches, Temporary Field
**Inverse:** none
**Improves:** maintainability — one object answers for the special value, replacing the same check scattered across every consumer

## When to apply

- Many consumers test for the same special value — `if (customer === null)`,
  `if (plan === "unknown")` — and most react the same way. The shared reaction is
  behavior with no home; a special-case object gives it one, and the checks vanish
  into ordinary polymorphic calls.
- The special value is a legitimate domain citizen (the unoccupied site, the guest
  user) whose defaults are business decisions, currently duplicated as literals at
  each check site.
- Fields only meaningful in the normal case (Temporary Field) empty out once the
  special case carries its own data.

## When not to apply

- Consumers react *differently* to the special value — a shared object can only
  carry shared responses; divergent reactions still need their checks, and the object
  would just relocate them.
- The check appears once or twice. The object, its wiring, and its class are elements
  a couple of `if`s do not pay for.
- The "special case" is your own optional contract — when you control producer and
  consumer, make the field mandatory and delete the checks instead of institutionalizing
  them.

## Mechanics

1. Give the host an `isUnknown`-style property returning `false`; create the
   special-case object (class or literal) returning `true`.
2. Return the special-case object wherever the special value was produced.
3. Migrate consumers: replace each check-plus-default with a plain call, moving the
   default into the special-case object when it is common. Test per consumer.
4. Checks that remain mark genuinely divergent reactions — leave them, now visibly
   exceptional.

## Example

Before — every reader re-decides what "no customer" means:

```js
const name = site.customer === null ? "occupant" : site.customer.name;
const plan = site.customer === null ? basicPlan : site.customer.plan;
```

After:

```js
const UNKNOWN_CUSTOMER = { name: "occupant", plan: basicPlan, isUnknown: true };
// site.customer is never null — producers return UNKNOWN_CUSTOMER instead
const name = site.customer.name;
const plan = site.customer.plan;
```

## House-rule interactions

- `coding_style.md` — don't defend against your own code: if *you* decide whether
  the value can be missing, the fix is a mandatory contract, not a special-case
  object. This refactoring is for special values the domain itself produces.
- `engineering_judgment.md` — DRY over knowledge: the duplicated default ("occupant")
  is one business fact encoded N times; the object makes it one.
- `coding_style.md` — a class is not required — a frozen literal satisfies the
  pattern in JS; add a class only when the special case accrues real behavior.
