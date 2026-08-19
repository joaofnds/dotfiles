# Change Value to Reference

**Smells:** Duplicated Code, Shotgun Surgery
**Inverse:** Change Reference to Value
**Improves:** maintainability: one entity, one instance, so an update happens once and is seen everywhere

## When to apply

- The same logical entity is loaded or constructed as multiple copies, and an update
  must now reach all of them: the copies have started to drift, or soon will. One
  shared instance makes the update a single event.
- Many orders each hold their own copy of the same customer; changing the customer's
  address means hunting the copies. That hunt is this refactoring's trigger.
- Direction against Change Reference to Value is settled by the update requirement:
  entities whose changes must be observed everywhere want references; data that is
  content-equal-and-done wants values.

## When not to apply

- The object is immutable in practice. Copies of an unchanging value cannot drift, so
  sharing buys nothing and costs a lookup structure.
- Only one holder exists per instance; there is no sharing problem to solve.
- The registry this refactoring needs would become ambient global state reached from
  everywhere: the cure must not introduce Global Data.

## Mechanics

1. Create a repository: a lookup that returns the single instance for a given
   identity, creating it on first request.
2. Route constructors that used to build copies through the repository: the holder's
   constructor asks for the instance by id instead of building one.
3. Decide the repository's ownership and pass it explicitly; test after each holder
   migrates.

## Example

Before: every order builds its own customer copy:

```js
function makeOrder(data) {
  return { id: data.id, customer: { id: data.customerId, ...data.customer } };
}
```

After: orders share the one customer instance:

```js
function makeOrder(data, customers) {
  return { id: data.id, customer: customers.get(data.customerId) };
}
```

## House-rule interactions

- `coding_style.md`: inject side-effecting or replaceable dependencies: the
  repository is a constructor-injected collaborator, never a module-level singleton;
  reaching it globally would trade the Duplicated Code smell for Global Data.
- `engineering_judgment.md`: DRY is about knowledge: N copies of one entity are N
  encodings of the same fact, and this refactoring is the unification.
- `coding_style.md`: Beck's ordering: the repository is an added element, bought
  by removing the copy-drift class of bugs: only justified where updates genuinely
  must be shared.
