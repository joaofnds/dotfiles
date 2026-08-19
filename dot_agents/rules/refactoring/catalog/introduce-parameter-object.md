# Introduce Parameter Object

**Smells:** Data Clumps, Long Parameter List, Primitive Obsession
**Inverse:** none
**Improves:** maintainability: the traveling clump gets one name, one shape, and one place to grow behavior

## When to apply

- The same group of values travels together through several signatures: `startDate,
  endDate` here, there, everywhere. Naming the group (`DateRange`) shrinks every
  signature and makes the relationship explicit.
- The clump implies invariants no one enforces (start before end, min under max); a
  structure gives the invariant a home.
- Once named, the object starts attracting the behavior that used to be duplicated
  around the clump (`range.includes(date)`); this refactoring is often the first
  domino toward a real value object (Replace Primitive with Object at group scale).

## When not to apply

- The parameters merely coincide in one signature: grouping values that don't
  travel together elsewhere manufactures a false concept with a name nobody will
  recognize.
- The function is about to be moved onto the object that already holds these values
  (Move Function / Preserve Whole Object may serve better and shorter).

## Mechanics

1. Create the structure: prefer an immutable value shape with a domain name.
2. Add a parameter of the new type to the function (Change Function Declaration),
   leaving old parameters in place. Run the tests.
3. Migrate callers to construct and pass the object; inside the function, switch each
   use from the loose parameter to the object's field, one at a time, testing as you
   go.
4. Delete the emptied parameters. Watch for behavior that now wants to live on the
   new type, and move it there.

## Example

Before: the range travels as two loose values:

```js
function readingsOutsideRange(station, min, max) {
  return station.readings.filter((r) => r.temp < min || r.temp > max);
}
readingsOutsideRange(station, operatingPlan.low, operatingPlan.high);
```

After:

```js
function readingsOutsideRange(station, range) {
  return station.readings.filter((r) => !range.contains(r.temp));
}
readingsOutsideRange(station, operatingPlan.tempRange);
```

## House-rule interactions

- `coding_style.md`: a plain immutable record satisfies this refactoring in JS; a
  class enters only when behavior (like `contains`) accrues to justify it: the
  progression is earned, not front-loaded.
- `coding_style.md`: leverage the type system: in typed languages the named shape
  lets the compiler police what "two numbers" never could: mixed-up argument order
  dies at compile time.
- `engineering_judgment.md`: name things in the domain's language: the object's
  value is the *name*; if the domain has no word for the group, that absence is
  evidence for "When not to apply."
