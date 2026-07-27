# Pull Up Field

**Smells:** Duplicated Code
**Inverse:** Push Down Field
**Improves:** maintainability — one declaration carries the shared datum, and behavior on it can follow upward

## When to apply

- Sibling subclasses each declare a field for the same datum — often under different
  names that history, not meaning, drove apart. One superclass declaration removes
  the duplicate and its drift risk.
- Pulled-up data is the enabler for pulling up the behavior that uses it: field
  first, then Pull Up Method on the newly-shared logic.
- Direction against Push Down Field is settled by usage: data every subclass holds
  rises; data only some populate sinks.

## When not to apply

- Same name, different meaning: two subclasses both call a field `rate`, but one
  stores a percentage and the other a currency amount. Unifying them corrupts both;
  the similarity is nominal, not semantic.
- The field would sit unused on some subclasses after the pull — that is the
  Temporary Field smell being manufactured, and the direction is wrong.
- In composition-first codebases, the shared datum belongs on the composed common
  struct/type rather than a superclass — same refactoring, different vehicle.

## Mechanics

1. Inspect every use of the candidate fields to confirm they hold the same datum
   with the same lifecycle.
2. If names differ, rename (Rename Field) each to the target name first, testing per
   subclass.
3. Declare the field on the superclass (with the tightest visibility subclass access
   allows); delete the subclass declarations. Run the tests.

## Example

Before — the same datum declared twice:

```js
class Engineer extends Employee {
  constructor() { super(); this.startDate = null; }
}
class Salesperson extends Employee {
  constructor() { super(); this.hiredOn = null; }
}
```

After:

```js
class Employee {
  startDate = null;
}
class Engineer extends Employee {}
class Salesperson extends Employee {}
```

## House-rule interactions

- `engineering_judgment.md` — DRY over knowledge governs the step-1 inspection:
  one datum in two declarations must unify; two data sharing a name must not.
- `coding_style.md` — behavior lives with data: after the field rises, audit
  which subclass methods now manipulate superclass data — they are Pull Up Method
  candidates, and leaving them scattered rebuilds the anemic split this rule bans.
