# Replace Type Code with Subclasses

**Smells:** Primitive Obsession, Repeated Switches
**Inverse:** Remove Subclass
**Improves:** maintainability: behavior that varies by kind attaches to the kind, so a new kind is an addition, not an edit spree

## When to apply

- A field like `type: "engineer" | "manager"` steers behavior through conditionals in
  several places. Reifying each code as a type lets polymorphism eat those
  conditionals (this refactoring is the enabling step for Replace Conditional with
  Polymorphism).
- Some fields or invariants only apply to certain codes: subclasses give each kind
  its own shape instead of a shared record with sometimes-valid fields (Temporary
  Field by construction).
- Direction against Remove Subclass is settled by where the weight is: behavior
  varying by kind earns types; data-only variation stays a field.

## When not to apply

- The type code only labels: it is displayed, stored, compared, but never branches
  behavior. A validated value (Replace Primitive with Object) suffices; a hierarchy
  for a label is the class `the style skill` bars introducing "solely to satisfy this
  document".
- The kind must change at runtime: objects cannot re-class. Use Replace Subclass
  with Delegate's shape instead: a swappable kind-delegate.
- In Go or class-light TypeScript, the rendering is one implementation of a common
  interface per kind (or a per-kind function table), selected by a factory: the
  finding must speak that language, not "subclass."

## Mechanics

1. Self-encapsulate the type code (a getter, so subclasses can override it).
2. Pick one code; create its subclass overriding the getter. Route construction
   through a factory that returns the right subclass. Run the tests.
3. Repeat per code; then migrate type-code conditionals into overridden methods
   (Replace Conditional with Polymorphism), and per-kind fields down (Push Down
   Field).
4. Remove the now-derivable type field; keep the getter where callers still ask.

## Example

Before: the code branches; the kinds are strings:

```js
function payFor(employee) {
  if (employee.type === "commissioned") return base(employee) + commission(employee);
  return base(employee);
}
```

After: each kind answers for itself:

```js
class Employee {
  pay() { return this.base(); }
}
class Commissioned extends Employee {
  pay() { return this.base() + this.commission(); }
}
```

## House-rule interactions

- `the style skill`: subclasses are introduced elements: the demonstrated need is
  behavior branching on the code in multiple places; a single label field never
  qualifies.
- `the style skill`: leverage the type system: the refactored form lets the
  compiler own kind-dispatch (exhaustive unions, sealed interfaces) instead of
  string comparison at runtime.
- `the doctrine skill`: encapsulate what varies: the kinds are the varying
  thing; this refactoring builds the enclosure around them.
