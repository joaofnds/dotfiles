# Remove Subclass

**Smells:** Lazy Element, Speculative Generality
**Inverse:** Replace Type Code with Subclasses
**Improves:** maintainability — a variation too small for a class becomes a field, and the hierarchy's cost disappears

## When to apply

- A subclass does so little — a constant here, one trivial override there — that its
  existence costs more than it expresses. A field on the parent carries the same
  information without the class machinery.
- The variation the subclasses modeled has drained away as features moved or died;
  what remains distinguishes instances by *data*, not behavior.
- Direction against Replace Type Code with Subclasses is settled by where the weight
  is: behavior varying by kind wants subclasses; mere data varying by kind wants a
  field.

## When not to apply

- The subclass still carries real behavioral difference — overridden logic callers
  rely on polymorphically. Removing it means reintroducing conditionals; that trade
  only pays when the conditional is trivial.
- Construction sites throughout the codebase instantiate the subclasses directly and
  cannot yet be funneled through a factory — do that migration first; it is step one
  below for a reason.

## Mechanics

1. Replace direct subclass construction with factory functions on the parent
   (Replace Constructor with Factory Function). Run the tests.
2. Add a type field (or the datum that really varied) to the parent; the factories
   set it.
3. Replace each `instanceof`/override with a read of the field, testing per use;
   move any residual override logic into the parent as plain conditionals or lookup
   tables.
4. Delete the empty subclasses. Run the tests.

## Example

Before — two classes to store one boolean's worth of difference:

```js
class Person {}
class Male extends Person { get genderCode() { return "M"; } }
class Female extends Person { get genderCode() { return "F"; } }
```

After:

```js
class Person {
  constructor(genderCode) { this.genderCode = genderCode; }
}
const createMale = () => new Person("M");
const createFemale = () => new Person("F");
```

## House-rule interactions

- `coding_style.md` — the house presumption against class machinery makes this
  refactoring's bar *low*: a subclass must actively justify itself, and "it stores a
  constant" is not justification.
- `engineering_judgment.md` — match complexity to the problem: data-only variation
  is the simple end of the spectrum; keeping hierarchy there is over-architecting by
  inertia.
