# Consolidate Conditional Expression

**Smells:** Duplicated Code
**Inverse:** none
**Improves:** readability: one named check replaces a scatter of tests that were secretly one question

## When to apply

- Several sequential checks return or assign the same result: three `if`s all
  yielding `0`. They are one condition written as three, and the reader must prove
  that to themselves each visit. Combine them and the shared outcome becomes explicit.
- The combined condition has a domain name, the separate clauses are fragments of
  "is ineligible", "is expired", "is blocked", and consolidation is the step that
  makes the name extractable (usually followed by Extract Function).

## When not to apply

- The checks are genuinely independent decisions that coincidentally share a result
  today. Welding them together couples rules that will want to diverge: the unified
  name would lie about the domain.
- Any clause has side effects; reordering or short-circuiting under a combined `||` /
  `&&` changes what executes.

## Mechanics

1. Confirm each condition is side-effect free.
2. Combine two conditions with `||` (sequential same-result checks) or `&&` (nested
   checks). Run the tests.
3. Repeat until one expression remains.
4. Extract the combined expression into a named function (Extract Function): the
   consolidation's payoff is usually the name.

## Example

Before: three fragments of one rule:

```js
if (employee.monthsDisabled > 12) return 0;
if (employee.isPartTime) return 0;
if (employee.onProbation) return 0;
return baseBonus(employee);
```

After:

```js
if (isIneligibleForBonus(employee)) return 0;
return baseBonus(employee);

function isIneligibleForBonus(e) {
  return e.monthsDisabled > 12 || e.isPartTime || e.onProbation;
}
```

## House-rule interactions

- `engineering-judgment.md`: DRY is about knowledge: consolidate only when the
  clauses encode one rule; identical results serving different rules stay separate,
  exactly as the rule prescribes for look-alike code.
- `coding-style.md`: boring control flow: the combined expression must stay
  readable: a three-line `&&`/`||` pile-up that needs parsing is worse than the
  original ifs, and the fix is extracting the name, not stacking clauses.
