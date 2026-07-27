# Combine Functions into Class

**Smells:** Long Parameter List, Shotgun Surgery, Data Clumps
**Inverse:** none
**Improves:** maintainability — shared data and its derived values get one home and one change site

## When to apply

- Several functions take the same data — often the same parameter clump — and hand it
  among themselves. A class fixes the common context once instead of at every
  signature.
- The functions recompute each other's derived values; as methods they share
  intermediates and expose results uniformly.
- The group is a de facto object already — constructed in one place, operated on
  everywhere. Making it a real class lets behavior live with the data it governs.

## When not to apply

- **`coding_style.md`'s "solely to satisfy this document" outranks this refactoring**: never introduce a class merely
  because functions *could* be grouped. The class must be bought by demonstrated shared
  state or duplicated signatures, not by taxonomy.
- Two functions and one record rarely justify the ceremony — Introduce Parameter Object
  may deliver the clump-naming win without the class.
- The functions form a read-only enrichment over immutable source data — Combine
  Functions into Transform does the same job without a class, and under the house rules
  it is the preferred shape when either fits.
- Where classes are not the working idiom (Go, functional codebases), a struct with
  methods, a module, or a closure over the shared data is this same refactoring in
  local dress — the point is co-locating behavior with data, not the keyword.

## Mechanics

1. Encapsulate the shared data into an object (Encapsulate Record).
2. Move each function onto the class (Move Function), turning its shared parameters
   into field reads. Test after each move.
3. Extract remaining inline logic that manipulates the data (Extract Function) and
   move it in as well.

## Example

Before — three functions, one implicit object:

```js
function distance(trip) { return trip.legs.reduce((d, l) => d + l.km, 0); }
function fuelUsed(trip) { return trip.legs.reduce((f, l) => f + l.liters, 0); }
function efficiency(trip) { return distance(trip) / fuelUsed(trip); }
```

After:

```js
class Trip {
  constructor(legs) { this.legs = legs; }
  get distance() { return this.legs.reduce((d, l) => d + l.km, 0); }
  get fuelUsed() { return this.legs.reduce((f, l) => f + l.liters, 0); }
  get efficiency() { return this.distance / this.fuelUsed; }
}
```

## House-rule interactions

- `coding_style.md` — "do not introduce classes … solely to satisfy this document."
  The canonical collision: this refactoring is admissible only when shared data and
  duplicated signatures demonstrate the need; grouping for tidiness fails the rule and
  the finding must be dropped.
- `coding_style.md` — put domain behavior with the model it governs, using "a class,
  value object, module, or pure function according to the language and required state."
  The class is one rendering of this refactoring, not its definition.
- `coding_style.md` — Beck's ordering: the class is an added element and must buy
  removal of the repeated parameter clump or shared derivations, or it is not a win.
