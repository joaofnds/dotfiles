# Replace Superclass with Delegate

**Smells:** Refused Bequest, Insider Trading
**Inverse:** none
**Improves:** resilience: the class exposes only what it means, so no caller can lean on inherited operations that never applied

## When to apply

- The class inherited for implementation convenience, not kind: the classic
  Stack-extends-List, where callers can `insertAt(3, …)` into the middle of a stack
  because the parent's whole API came along with the reuse. Holding the parent as a
  field keeps the reuse and drops the false interface.
- Superclass functions make no sense on the subclass: the is-a claim is false, and
  every inherited-but-inapplicable operation is a bug surface.
- The child depends on parent internals (protected fields, override timing): the
  Insider Trading coupling that delegation forces through a public interface.

## When not to apply

- The is-a relationship is genuine and the whole parent interface applies:
  delegation would replace one `extends` with a page of forwarding methods that mirror
  the parent (manufacturing a Middle Man). Inheritance is the simpler mechanism when
  it tells the truth.
- Performance-critical inner loops where the extra indirection is a measured cost.

## Mechanics

1. Add a field holding an instance of the former superclass.
2. For each superclass feature the class *legitimately* uses (internally or via
   callers), create a forwarding method to the field. Test as each group lands.
3. Remove the `extends`; construction now creates the delegate instance. Run the
   tests.
4. The operations you chose *not* to forward are the payoff: calls to them are now
   compile/runtime errors instead of silent misuse; fix any caller that surfaces.

## Example

Before: a stack that is accidentally a full array:

```js
class Stack extends Array {}
stack.splice(1, 2); // callers can do this, and one will
```

After: the interface tells the truth:

```js
class Stack {
  #items = [];
  push(item) { this.#items.push(item); }
  pop() { return this.#items.pop(); }
  get size() { return this.#items.length; }
}
```

## House-rule interactions

- `the doctrine skill`: composition over inheritance: this is the recovery
  move for inheritance adopted as a shortcut; the house default would not have taken
  the shortcut.
- `the style skill`: leverage the type system: the shrunken public surface turns
  "callers shouldn't use `splice`" from a convention into a checked fact.
- `the style skill`: Tell, Don't Ask: forwarding only meaningful operations is
  interface design by role: the delegate's API is what the role offers, not what the
  implementation happens to contain.
