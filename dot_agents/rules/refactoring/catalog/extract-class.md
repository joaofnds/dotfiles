# Extract Class

**Smells:** Large Class, Divergent Change, Data Clumps, Temporary Field
**Inverse:** Inline Class
**Improves:** maintainability — each class carries one responsibility, so each kind of change lands in one place

## When to apply

- A class changes for two unrelated reasons — billing edits touch one cluster of
  fields and methods, contact-info edits another. The clusters are two classes sharing
  a namespace.
- A subset of fields travels together, is guarded together, or is nullable together
  (Temporary Field): that subset is a concept with a missing name.
- The class has grown past holding in one read, and a coherent fragment has an obvious
  domain name of its own.

## When not to apply

- **`coding_style.md:8` outranks the book**: the split must be demonstrated by
  divergent change reasons or a cohesive clump, not by line count alone. A large class
  with one responsibility and one reason to change may simply be a large
  responsibility.
- The extracted concept would be anemic — fields moved out but every behavior left
  behind means the split cut across the grain; find the seam where behavior and data
  move together.
- Direction against Inline Class is settled by demonstrated pain: extract when change
  reasons collide inside one class; inline when a class no longer justifies its
  existence.

## Mechanics

1. Decide the responsibility to split off and name the new class for it.
2. Create the new class; give the old class a field linking to it.
3. Move fields one at a time (Move Field), testing after each; then move methods
   (Move Function), starting with the lowest-level ones.
4. Review both interfaces: rename methods to fit their new homes, and decide whether
   the new class is exposed to clients or hidden behind the old one.

## Example

Before — one class, two reasons to change:

```js
class Employee {
  name; email;
  bankCode; accountNumber;
  paySalary() { transfer(this.bankCode, this.accountNumber, this.salary); }
}
```

After — payment details change without touching Employee's identity:

```js
class Employee {
  name; email;
  account; // PaymentAccount
  paySalary() { this.account.receive(this.salary); }
}
class PaymentAccount {
  bankCode; accountNumber;
  receive(amount) { transfer(this.bankCode, this.accountNumber, amount); }
}
```

## House-rule interactions

- `coding_style.md:8` — the new class is an introduced element; it is admissible only
  on demonstrated divergent change or clumping, per "When not to apply."
- `engineering_judgment.md:42` — orthogonality, one change one place: divergent change
  inside one class is that rule failing at class granularity, and this refactoring is
  the repair.
- `coding_style.md:33` — behavior lives with data: fields and their governing methods
  move together, or the extraction manufactures an anemic satellite.
