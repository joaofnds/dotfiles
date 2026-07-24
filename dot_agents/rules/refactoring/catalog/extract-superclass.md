# Extract Superclass

**Smells:** Duplicated Code, Alternative Classes with Different Interfaces
**Inverse:** Collapse Hierarchy
**Improves:** maintainability — the shared behavior of sibling classes gets one implementation and one contract

## When to apply

- Two classes independently implement the same fields and behaviors — not by
  historical accident but because they are the same kind of thing. A common parent
  absorbs the duplication and names the commonality.
- Two classes play the same role for their callers but expose drifted interfaces;
  extraction forces the aligning renames (Change Function Declaration) that make them
  interchangeable.
- You are unsure between this and Extract Class (composition): Fowler's own guidance
  is that the two solve the same duplication, inheritance is the cheaper first move,
  and Replace Superclass with Delegate exists if it sours — but see the house rule
  below, which shifts that default.

## When not to apply

- **This house prefers composition** (`engineering_judgment.md:25`): when the shared
  code can live in a composed collaborator or an embedded type with similar effort,
  that wins — it shares behavior without welding the classes onto one axis of
  variation.
- The commonality is partial and role-shaped, not kind-shaped — the classes share a
  capability, not an identity. That is an interface plus a shared helper, not a
  parent.
- In Go, there is no extraction of a superclass — the rendering is an interface for
  the contract plus an embedded struct for the shared implementation. A finding
  against Go code must say that, not "extract a superclass."

## Mechanics

1. Create an empty superclass; make both classes extend it. Run the tests.
2. Pull up the duplicated members one at a time — fields first (Pull Up Field), then
   methods (Pull Up Method), constructors' common prefix (Pull Up Constructor Body) —
   testing after each.
3. Examine callers: where they duplicated logic over the two classes, retarget them
   to the superclass type.

## Example

Before — two implementations of the same accounting:

```js
class Department {
  totalMonthlyCost() { return this.staff.reduce((s, e) => s + e.monthlyCost, 0); }
}
class Employee {
  totalMonthlyCost() { return this.monthlyCost; }
}
```

After — one concept, `Party`, owns the contract:

```js
class Party {
  totalAnnualCost() { return this.totalMonthlyCost() * 12; }
}
class Department extends Party { /* totalMonthlyCost over staff */ }
class Employee extends Party { /* totalMonthlyCost of self */ }
```

## House-rule interactions

- `engineering_judgment.md:25` — composition over inheritance: the house default
  reverses Fowler's coin-flip; extraction of a parent must argue why a composed
  shared type serves worse.
- `coding_style.md:8` — the superclass is an introduced element: duplication between
  the siblings must be demonstrated, not predicted.
