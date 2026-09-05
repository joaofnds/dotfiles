# Combine Functions into Transform

**Smells:** Shotgun Surgery, Duplicated Code
**Inverse:** none
**Improves:** maintainability: every derivation lives in one transform instead of at each consumer

## When to apply

- The same derived values are computed from the same source record at several sites,
  and drift between those computations is a bug waiting to be reported. One transform
  computes them once; consumers read fields.
- A processing pipeline wants its input enriched up front, so downstream steps become
  declarative reads instead of repeated calculations.
- The competing grouping is Combine Functions into Class. Prefer the transform when the
  source data is immutable in practice and consumers want values rather than behavior.

## When not to apply

- The source data is updated after enrichment: derived fields on the copy go stale
  silently. A class computing on demand cannot go stale; use it instead.
- Only one consumer computes the value, in one place. A transform for it is
  speculative infrastructure.
- Consumers need to change the data, not read derived facts. A transform's output is a
  value; mutating it forfeits the guarantee that the derived fields are consistent.

## Mechanics

1. Write a transform function that takes the source record and returns a deep copy of
   it.
2. Move one derivation into the transform, writing its result onto the copy as a new
   field. Run the tests.
3. Repeat for each remaining derivation.
4. Replace each consumer's inline computation with a read of the enriched field,
   testing per consumer.

## Example

Before: the cost rule lives at two sites:

```js
function invoiceLine(usage) { return `${usage.kwh} kWh: ${usage.kwh * usage.tariff}`; }
function invoiceTax(usage) { return usage.kwh * usage.tariff * 0.2; }
```

After: one transform; consumers read:

```js
function enrichUsage(usage) {
  const result = structuredClone(usage);
  result.cost = result.kwh * result.tariff;
  result.tax = result.cost * 0.2;
  return result;
}
function invoiceLine(u) { return `${u.kwh} kWh: ${u.cost}`; }
function invoiceTax(u) { return u.tax; }
```

## House-rule interactions

- `coding-style.md`: transformations are "stateless, non-mutating translators …
  input objects are never modified in place." The deep copy in step 1 is what keeps
  this refactoring inside that rule; enriching the input in place violates it.
- `coding-style.md`: where this refactoring and Combine Functions into Class both
  fit, the transform wins by default: it delivers the single change site without
  introducing a class.
- `engineering-judgment.md`: complexity carries the burden of proof: the transform
  is justified by demonstrated duplication of derivations, never by anticipated ones.
