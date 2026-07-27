# Change Reference to Value

**Smells:** Mutable Data
**Inverse:** Change Value to Reference
**Improves:** resilience — an immutable value can be shared, copied, and compared with no aliasing surprises

## When to apply

- A small object is shared by reference and mutated in place, so an update in one
  holder surfaces mysteriously in another. Making it a value — replaced whole rather
  than edited — removes the aliasing.
- The object is conceptually a value in the domain: money, a date range, a postal
  address, a point. Two instances with the same content *are* the same thing, and
  equality should say so.
- You want to hand the object across threads, async boundaries, or caches without
  defensive copying.
- Direction against Change Value to Reference is settled by the sharing requirement:
  if no one needs to observe updates made elsewhere, value semantics are simpler.

## When not to apply

- Holders genuinely need to see each other's updates — a shared account balance is one
  fact, and copying it forks the truth. That is the inverse refactoring's territory.
- The object is large and replaced wholesale on every small change, on a measured hot
  path.

## Mechanics

1. Check the candidate is replaceable whole — no client depends on observing another
   holder's mutation.
2. Make the object immutable: fields set only at construction; every "setter" becomes
   a function returning a new instance.
3. Give it value equality (compare contents, not identity); update any identity-based
   collections or comparisons. Run the tests.

## Example

Before — editing the shared address edits it for both:

```js
const address = { city: "Curitiba", zip: "80000" };
const shipping = { address };
const billing = { address };
shipping.address.zip = "80010";
```

After — a change constructs a new value:

```js
const address = Object.freeze({ city: "Curitiba", zip: "80000" });
const shipping = { address: { ...address, zip: "80010" } };
const billing = { address };
```

## House-rule interactions

- `coding_style.md` — stateless, non-mutating translators: value semantics extend
  the same never-modify-in-place discipline from boundary mappers to domain data.
- `engineering_judgment.md` — narrows the space of future bugs: every
  action-at-a-distance mutation through a shared reference becomes unrepresentable,
  not merely unlikely.
