# Preserve Whole Object

**Smells:** Data Clumps, Long Parameter List
**Inverse:** none
**Improves:** maintainability: the signature stops enumerating fields, so the callee can need more without every caller changing

## When to apply

- Callers unpack an object's fields just to pass them as separate arguments:
  `fits(room.tempRange.low, room.tempRange.high)`. Passing the object shortens every
  call and makes the next field the callee needs a zero-caller change.
- The same unpacking ritual precedes several different calls: the clump of extracted
  values is the signature's version of Data Clumps.
- The function's logic keeps reaching for more of the object each release: the
  growing parameter list is trend evidence.

## When not to apply

- The callee should *not* know the object: a generic utility taking a whole domain
  entity to read two numbers couples the utility to the domain; primitives keep it
  generic and the dependency arrow clean.
- The object and the function live on opposite sides of a module boundary where
  passing the type would create or reverse a dependency.
- Extracting the values first is what the caller's own logic does anyway: sometimes
  the real fix is moving the function onto the object (Move Function), with this
  refactoring as the intermediate step.

## Mechanics

1. Create a variant of the function that accepts the whole object; implement it by
   delegating to the old one with the fields unpacked inside.
2. Migrate callers one at a time to the new variant, deleting their unpacking code.
   Run the tests per caller.
3. Inline the old function into the new one; rework the body to read fields off the
   parameter directly.
4. Consider Move Function next: a function consuming the whole object often belongs
   with it.

## Example

Before: the caller does the callee's field work:

```js
const low = room.tempRange.low;
const high = room.tempRange.high;
if (!withinRange(plan, low, high)) alerts.push("range violation");
```

After:

```js
if (!plan.withinRange(room.tempRange)) alerts.push("range violation");
```

## House-rule interactions

- `engineering-judgment.md`: dependencies point inward: the whole-object form is
  right between domain neighbors and wrong when it hands a domain type to
  infrastructure or a generic helper: check the arrow before applying.
- `coding-style.md`: generic utilities carve-out: `clamp`-style helpers take
  primitives by design; this refactoring's scope is domain functions, not utilities.
- `coding-style.md`: Tell, Don't Ask: caller-side unpacking is asking; the
  follow-up move of the function onto the object completes the tell.
