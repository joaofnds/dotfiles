# Pull Up Method

**Smells:** Duplicated Code
**Inverse:** Push Down Method
**Improves:** maintainability: one implementation serves all subclasses, so a fix lands once

## When to apply

- Two sibling subclasses carry methods with the same body, or bodies that become the
  same after small preparatory steps (rename locals, Parameterize Function). Two
  copies of one rule will drift; hoisting to the superclass leaves one.
- The methods are identical in *meaning*, not merely in text: they implement the same
  obligation each subclass happens to restate.
- Direction against Push Down Method is settled by usage: behavior all subclasses
  share rises; behavior only some use sinks.

## When not to apply

- The bodies look alike but encode different subclass-specific rules that coincide
  today: hoisting welds them, and the next divergence forces a hurried push back
  down.
- The method reads subclass fields the superclass lacks; pull up the fields first
  (Pull Up Field) or reshape via a template: hoist the common skeleton and leave
  abstract steps for subclasses to fill.
- In Go or composition-first TypeScript, this refactoring renders as moving the shared
  function to the embedded/composed common type: same move, no inheritance required.

## Mechanics

1. Diff the candidate methods; make them textually identical through renames and
   parameterization first.
2. Check every referenced field and method exists on (or can be pulled up to) the
   superclass.
3. Copy the method to the superclass; run the tests.
4. Delete one subclass copy, test; delete the next, test.

## Example

Before: the same annual-cost rule, twice:

```js
class Engineer extends Employee {
  annualCost() { return this.monthlySalary * 12; }
}
class Salesperson extends Employee {
  annualCost() { return this.monthlySalary * 12; }
}
```

After:

```js
class Employee {
  annualCost() { return this.monthlySalary * 12; }
}
class Engineer extends Employee {}
class Salesperson extends Employee {}
```

## House-rule interactions

- `engineering_judgment.md`: DRY is about knowledge: the pull-up is mandated when
  the copies share one rule and barred when they merely rhyme: the diff in mechanics
  step 1 is where that judgment happens.
- `engineering_judgment.md`: composition over inheritance: where the hierarchy
  itself is in question, prefer relocating shared behavior to a composed collaborator
  over deepening reliance on the superclass.
