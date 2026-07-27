# Encapsulate Collection

**Smells:** Data Class, Mutable Data
**Inverse:** none
**Improves:** resilience — no client can bypass the owner's invariants by mutating the collection behind its back

## When to apply

- A class exposes a mutable collection through a getter. Every client holding the
  reference can add or remove elements without the owner knowing — the owner's
  invariants and side effects (counts, notifications, validation) are silently
  bypassable.
- Add/remove logic for the collection is scattered across clients instead of living
  with the owner.
- A bug already occurred where the collection changed "by itself" — that is this
  smell's signature incident.

## When not to apply

- The collection is immutable at the language level (frozen, readonly type) — there
  is no back door to close.
- The "owner" is a transparent data bundle by design, with no invariants over the
  collection; adding ceremony around a list nobody guards is encapsulation theater.

## Mechanics

1. Add `add` and `remove` (and other mutating) methods on the owning class, carrying
   whatever invariants apply.
2. Find every client that mutates the collection through the getter; migrate each to
   the new methods, testing as you go.
3. Change the getter to return a copy or read-only view, so remaining references
   cannot mutate the original. Run the tests.

## Example

Before — anyone can push past the limit:

```js
class Course {
  students = [];
  get roster() { return this.students; }
}
course.roster.push(student);
```

After — enrollment goes through the rule; readers get a copy:

```js
class Course {
  #students = [];
  enroll(student) {
    if (this.#students.length >= 30) throw new Error("course full");
    this.#students.push(student);
  }
  get roster() { return [...this.#students]; }
}
```

## House-rule interactions

- `coding_style.md` — behavior lives with data: scattered `push` calls on an
  exposed list are the anemic-model pattern in miniature; the add/remove methods bring
  the behavior home.
- `coding_style.md` — Tell, Don't Ask: `course.enroll(student)` tells;
  `course.roster.push(student)` asks for internals and decides for them.
- `engineering_judgment.md` — narrows future bugs: returning copies makes the
  whole bypass class unrepresentable rather than merely discouraged.
