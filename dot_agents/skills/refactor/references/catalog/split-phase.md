# Split Phase

**Smells:** Divergent Change, Shotgun Surgery
**Inverse:** none
**Improves:** maintainability: each phase changes for its own reason and can be exercised alone

## When to apply

- One block deals with two concerns in sequence, typically parse-then-compute or
  compute-then-format, so a change to either concern must be threaded through the
  other's code.
- The same second phase should serve input arriving in different shapes: one parsing
  phase per shape feeding a single computation phase removes the duplication.
- You want to test the logic without manufacturing raw input, or the parsing without
  asserting on computed results. The intermediate structure is the test seam.

## When not to apply

- The phases are trivially entangled: a two-line function does not need an
  intermediate data structure between its halves; the added element reveals nothing.
- The phases share most of their state. If the intermediate structure would carry
  nearly every local, the seam is in the wrong place or there is no seam.
- No second input shape, divergent change, or testing pain exists yet. A speculative
  pipeline is Speculative Generality wearing a virtue.

## Mechanics

1. Extract the second phase's code into its own function (Extract Function).
2. Introduce an intermediate data structure and make it that function's parameter.
   Run the tests.
3. Examine each remaining parameter of the second phase: if the first phase produces
   it, move it into the intermediate structure; if the caller supplies it
   independently, leave it a parameter.
4. Extract the first phase into a function returning the intermediate structure. Run
   the tests.

## Example

Before: parsing and pricing interleaved:

```js
function shippingCost(line) {
  const [weightStr, zone] = line.split(",");
  const weight = Number(weightStr);
  const rate = zone === "EU" ? 1.5 : 4;
  return Math.max(weight * rate, 10);
}
```

After: parse produces a record; pricing consumes it:

```js
function shippingCost(line) {
  return price(parseShipment(line));
}
function parseShipment(line) {
  const [weight, zone] = line.split(",");
  return { weight: Number(weight), zone };
}
function price({ weight, zone }) {
  return Math.max(weight * (zone === "EU" ? 1.5 : 4), 10);
}
```

## House-rule interactions

- `the style skill`: safe parsing at boundaries: when the first phase ingests
  external data, this refactoring gives the untrusted edge its own home, and the
  intermediate structure becomes the validated shape that crosses inward.
- `the doctrine skill`: draw boundaries at the demonstrated cost inflection: a
  cheap source-level split is exactly the early boundary that rule endorses, provided
  the two concerns demonstrably change for different reasons.
- `the style skill`: Beck's ordering: the intermediate structure is an added
  element, bought by the phases' independent reasons to change, not by pipeline
  aesthetics.
