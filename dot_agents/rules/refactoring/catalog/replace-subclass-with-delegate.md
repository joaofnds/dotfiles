# Replace Subclass with Delegate

**Smells:** Refused Bequest, Insider Trading
**Inverse:** none
**Improves:** maintainability: variation moves to a composed object, freeing the single inheritance axis and allowing change at runtime

## When to apply

- The hierarchy models one axis of variation, and a second axis has appeared: you
  can subclass by booking type *or* by customer tier, not both. Delegates compose;
  superclasses don't.
- The category an instance belongs to must change at runtime (the premium booking
  downgraded, the member lapsing); an object cannot re-parent itself, but it can swap
  a delegate.
- The subclass leans on its parent's internals (Insider Trading between parent and
  child); a delegate forces the relationship through an interface.

## When not to apply

- One axis, static categories, healthy overrides: plain inheritance is simpler and
  this house keeps simple things simple; don't dismantle a hierarchy that isn't
  hurting (the surgical-execution rule applies to hierarchies too).
- The delegate would forward the entire parent surface back: if everything must be
  re-exposed, the boundary is drawn wrong; reconsider which behavior actually varies.

## Mechanics

1. Create a delegate class for the varying behavior; give the parent a field for it
   (empty for the default case).
2. Add a factory that wires the right delegate at construction.
3. Move one subclass override into the delegate; the parent's method delegates when
   the field is set, else runs the base behavior. Run the tests.
4. Repeat per override; when the subclass is empty, delete it and let the factory
   return the parent with the delegate attached.

## Example

Before: booking varies by subclassing:

```js
class Booking {
  get basePrice() { return this.room.rate; }
}
class PremiumBooking extends Booking {
  get basePrice() { return this.room.rate * 1.15 + this.dinnerFee; }
}
```

After: booking varies by delegate, swappable at runtime:

```js
class Booking {
  premium = null; // set by createPremiumBooking factory
  get basePrice() {
    const base = this.room.rate;
    return this.premium ? this.premium.extendPrice(base) : base;
  }
}
class PremiumDelegate {
  extendPrice(base) { return base * 1.15 + this.dinnerFee; }
}
```

## House-rule interactions

- `engineering_judgment.md`: composition over inheritance: this refactoring is
  the canonical migration from the discouraged form to the favored one; in this
  corpus its findings should be common wherever hierarchies strain.
- `coding_style.md`: Beck's ordering: the delegate adds elements (class, field,
  factory); the purchase must be a demonstrated second axis, runtime change, or
  coupling break, not composition for its own sake.
