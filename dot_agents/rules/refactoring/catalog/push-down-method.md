# Push Down Method

**Smells:** Refused Bequest, Speculative Generality
**Inverse:** Pull Up Method
**Improves:** maintainability: the superclass stops promising behavior most of its children disown

## When to apply

- A superclass method is relevant to only one subclass (or a minority). Every other
  child inherits an operation that is meaningless for it: the Refused Bequest smell
  from the parent's side. Sinking the method makes the interface honest.
- The method was hoisted speculatively ("all employees will bill hours eventually")
  and the generality never arrived.
- Direction against Pull Up Method is settled by usage: behavior all subclasses share
  rises; behavior only some use sinks.

## When not to apply

- Callers invoke the method through superclass-typed references: after the push,
  those calls break or need type checks. First migrate callers to subclass-aware
  paths, or accept that the method is genuinely part of the shared contract.
- Half the subclasses use it: neither up nor down is honest. Consider an intermediate
  class for the users, or a composed capability only they carry (the
  composition-first rendering: a capability interface the relevant types implement).
- The inheritance axis itself is the problem: repeated pushes and pulls on one
  hierarchy signal Replace Subclass with Delegate territory.

## Mechanics

1. Confirm no caller reaches the method via the superclass type (grep call sites;
   check dynamic dispatch).
2. Copy the method into each subclass that needs it. Run the tests.
3. Delete the superclass method. Run the tests again: a failure here is a caller
   step 1 missed.

## Example

Before: only engineers have on-call quotas, but everyone inherits it:

```js
class Employee {
  onCallQuota() { return 4; }
}
class Engineer extends Employee {}
class Recruiter extends Employee {} // recruiter.onCallQuota() === 4, absurdly
```

After:

```js
class Employee {}
class Engineer extends Employee {
  onCallQuota() { return 4; }
}
class Recruiter extends Employee {}
```

## House-rule interactions

- `engineering-judgment.md`: YAGNI: the speculatively-generalized method is
  flexibility for a future that never came; the push-down is its retirement.
- `coding-style.md`: leverage the type system: after the move, code that still
  wants the method on a general reference will be tempted into type-sniffing;
  restructure the callers (or the hierarchy) rather than casting around the honesty
  you just bought.
