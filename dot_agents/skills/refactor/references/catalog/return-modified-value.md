# Return Modified Value

**Smells:** Mutable Data
**Inverse:** none
**Improves:** readability: the call site shows that data flows out, instead of hiding the update inside

## When to apply

- A function updates a variable in its enclosing or outer scope, and callers must
  read its body to learn that. Returning the new value and assigning at the call site
  makes the data flow visible where it is consumed.
- A chain of functions each mutate the same accumulator passed along or captured:
  returning values converts an invisible mutation pipeline into explicit
  hand-offs.
- The function is one step from being pure; making it value-in, value-out completes
  the step and unlocks the benefits (safe reuse, trivial testing).

## When not to apply

- The function updates several distinct values: returning a grab-bag object can be
  worse than the mutation; often the real fix is splitting the function (Split Loop /
  Extract Function) until each piece returns one thing.
- The mutation *is* the point and the value is incidental: a modifier in the
  Separate Query from Modifier sense; forcing a return value onto it muddies the
  command's honesty.
- Large structures on a measured hot path where copy-and-return costs real time.

## Mechanics

1. Have the function return the updated value while still performing the mutation;
   at each call site, assign the result. Run the tests: behavior is unchanged, shape
   is new.
2. Inside the function, work on a local copy instead of the outer variable; return
   the local. Run the tests.
3. Rename function and variables to reflect the new value-producing nature
   (`updateTotal` → `totalWith`).

## Example

Before: the update is invisible at the call site:

```js
let totalAscent = 0;
calculateAscent(points);

function calculateAscent(points) {
  for (const p of points) totalAscent += Math.max(0, p.climb);
}
```

After: the flow is on the surface:

```js
const totalAscent = ascentOf(points);

function ascentOf(points) {
  return points.reduce((sum, p) => sum + Math.max(0, p.climb), 0);
}
```

## House-rule interactions

- `the style skill`: the never-modify-in-place discipline of translators, applied
  one function at a time; each conversion moves a mutation out of hiding.
- `the style skill`: move understanding into the code: "this call updates
  `totalAscent`" was head-knowledge; the assignment at the call site writes it down.
