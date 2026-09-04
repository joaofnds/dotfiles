# Inline Class

**Smells:** Lazy Element, Speculative Generality
**Inverse:** Extract Class
**Improves:** maintainability: a class that stopped earning its keep stops charging rent

## When to apply

- The class no longer justifies its existence: earlier refactorings moved its
  substance elsewhere, and what remains is a few fields and forwards. Fold it into its
  closest collaborator.
- The class was built for a generality that never materialized: one implementation,
  one caller, no variation ever demanded.
- As a waypoint: to re-partition two badly-split classes, inline one into the other
  first, then extract along the better seam.
- Direction against Extract Class is settled by demonstrated pain: inline the class
  that does too little; extract from the class that does too much.

## When not to apply

- The class is small but load-bearing: a value object with an invariant, a boundary
  type keeping a wire shape out of the domain. Size is not the measure; contribution
  is.
- Multiple independent clients use the class; inlining into one of them strands the
  others.

## Mechanics

1. In the target class, create delegating members for everything the dying class
   offers, so its interface appears on the target.
2. Migrate every client from the dying class to the target. Run the tests.
3. Move the fields and remaining logic into the target, removing delegations as the
   real members land; test as you go.
4. Delete the empty class.

## Example

Before: `TrackingInfo` holds two fields and no behavior of its own:

```js
class Shipment {
  tracking = new TrackingInfo();
  get trackingNumber() { return this.tracking.number; }
}
class TrackingInfo {
  number; carrier;
}
```

After:

```js
class Shipment {
  trackingNumber; carrier;
}
```

## House-rule interactions

- `the doctrine skill`: code is a liability: a structure whose only content
  is structure is pure carrying cost; deletion is the feature.
- `the doctrine skill`: YAGNI: the class built for the future that never
  came is this rule's textbook exhibit, and inlining is its enforcement.
- `the style skill`: Beck's ordering: removal is a fewest-elements win that costs
  no intent; when the class *was* carrying intent (a named domain concept), see
  "When not to apply" instead.
