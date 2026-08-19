# Remove Setting Method

**Smells:** Mutable Data
**Inverse:** none
**Improves:** resilience: a field that cannot change after construction cannot be corrupted after construction

## When to apply

- A setter exists for a field that is only ever set during creation. Its presence is a
  false advertisement: readers must assume the field can change anywhere, and trace
  all callers to learn it doesn't.
- The field is an identity (an ID, a key) that must never change once assigned;
  a setter on identity is a bug with a public API.
- Construction flows through a builder or framework that required setters
  historically, but the codebase now supports constructor arguments.

## When not to apply

- The field legitimately changes during the object's life: removing its setter just
  pushes mutation into ad-hoc field pokes. The refactoring targets creation-only
  fields, not mutability in general.
- A serialization or ORM framework genuinely requires the setter; then constrain and
  document it as framework surface rather than deleting it (and keep domain code from
  calling it).

## Mechanics

1. If the constructor cannot yet receive the value, add it as a constructor parameter
   (Change Function Declaration) and set the field there.
2. Migrate each creation-time caller of the setter to pass the value at construction,
   testing per caller.
3. When no callers remain, delete the setter and make the field private/immutable to
   whatever degree the language offers. Run the tests.

## Example

Before: the ID is assignable forever:

```js
const account = new Account();
account.setId("acc-42");
```

After: identity is fixed at birth:

```js
class Account {
  #id;
  constructor(id) { this.#id = id; }
  get id() { return this.#id; }
}
const account = new Account("acc-42");
```

## House-rule interactions

- `coding_style.md`: explicit construction: entities map properties explicitly at
  creation; a post-construction setter phase is the bulk-assignment pattern this rule
  exists to prevent, one field at a time.
- `coding_style.md`: behavior lives with data: getter/setter pairs with logic
  elsewhere define the anemic model; every deleted setter moves the design away from
  it.
- `engineering_judgment.md`: narrows future bugs: the whole class of
  "mutated after creation" defects for this field becomes unrepresentable.
