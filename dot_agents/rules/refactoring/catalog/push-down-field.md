# Push Down Field

**Smells:** Refused Bequest, Temporary Field
**Inverse:** Pull Up Field
**Improves:** maintainability: data lives only where it means something, so no subclass carries dead weight

## When to apply

- A superclass field is used by only one subclass (or a minority); the rest inherit
  storage that is never read, never valid, or permanently null for them: Temporary
  Field manufactured by the hierarchy itself.
- The field's lifecycle (when set, when cleared, what validates it) is dictated
  entirely by one subclass's behavior; ownership follows the behavior.
- Direction against Pull Up Field is settled by usage: data every subclass holds
  rises; data only some populate sinks.

## When not to apply

- Superclass code touches the field: shared methods read or write it, even if only
  some subclasses populate it meaningfully. Push the behavior down first (Push Down
  Method) or the field is genuinely shared.
- Serialization, ORM mapping, or a wire schema addresses the field on the base shape;
  moving it is a boundary contract change to coordinate, not a local edit.
- The hierarchy is fighting you on several fields at once: that pattern usually
  wants Extract Class per cluster or Replace Subclass with Delegate, not field
  shuffling.

## Mechanics

1. Confirm nothing in the superclass (or in other subclasses) references the field.
2. Declare the field in each subclass that uses it, including its initialization.
   Run the tests.
3. Remove the superclass declaration. Run the tests again.

## Example

Before: every vehicle carries cargo data; only trucks have cargo:

```js
class Vehicle {
  constructor() { this.cargoCapacityKg = null; }
}
class Truck extends Vehicle {}
class Motorcycle extends Vehicle {} // cargoCapacityKg: forever null
```

After:

```js
class Vehicle {}
class Truck extends Vehicle {
  constructor() { super(); this.cargoCapacityKg = 3500; }
}
class Motorcycle extends Vehicle {}
```

## House-rule interactions

- `coding_style.md`: behavior lives with data, read in both directions: the field
  belongs beside the methods that govern it, and a base-class field governed by one
  subclass's methods violates the co-location this rule demands.
- `engineering_judgment.md`: code is a liability: a never-meaningful inherited
  field is storage plus reader-confusion with zero value; sinking it is deletion from
  everywhere it did not belong.
