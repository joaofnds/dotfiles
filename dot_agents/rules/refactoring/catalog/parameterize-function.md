# Parameterize Function

**Smells:** Duplicated Code
**Inverse:** none
**Improves:** maintainability — one implementation carries the shared logic; the variants shrink to arguments

## When to apply

- Two or more functions do the same thing with different literal values baked in —
  `tenPercentRaise`, `fivePercentRaise`. The shared logic is duplicated; the
  difference is data. One function with a parameter removes the copies and covers
  future values for free.
- A family of near-identical range or threshold checks differs only in bounds — the
  classic bottom/middle/top band trio collapses into one banded function.

## When not to apply

- The variants are about to diverge in *kind*, not degree — forcing them through one
  parameterized body now means branching inside it later, trading honest duplication
  for a conditional knot.
- The unifying parameter would be a boolean selecting wholly different behavior —
  that is a flag argument being born, precisely what Remove Flag Argument exists to
  kill. Parameterize over values, not over behaviors.
- The similarity is textual, not semantic (see Replace Inline Code with Function
  Call's coincidence caveat — the same judgment applies here).

## Mechanics

1. Pick the variant with the most general body.
2. Add the differing value to its signature (Change Function Declaration), replacing
   the baked-in literal with the parameter. Run the tests.
3. Migrate the callers of each sibling variant to the parameterized function, passing
   their value; test per variant.
4. Delete the emptied variants.

## Example

Before — the raise logic exists twice:

```js
function tenPercentRaise(employee) {
  employee.salary = employee.salary * 1.1;
}
function fivePercentRaise(employee) {
  employee.salary = employee.salary * 1.05;
}
```

After:

```js
function raise(employee, factor) {
  employee.salary = employee.salary * (1 + factor);
}
raise(employee, 0.1);
```

## House-rule interactions

- `engineering_judgment.md` — DRY is about knowledge: the variants encode one rule
  ("a raise scales salary"), so unification is mandated; if they had encoded two
  rules that merely rhymed, it would be forbidden.
- `engineering_judgment.md` — YAGNI: parameterize to remove existing duplicates,
  not to speculate — adding a parameter "for flexibility" with one caller is the
  smell, not the cure.
